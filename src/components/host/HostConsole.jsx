import { useRef, useState } from 'react';
import { Upload, Trash2, Play, FileDown, AlertCircle, Timer } from 'lucide-react';
import PinnacleGame from '../games/PinnacleGame';
import {
  listCustomSets,
  getCustomSetQuestions,
  importCustomSet,
  deleteCustomSet,
  buildTemplateJson,
} from '../../utils/customQuestionSets';

// Cài đặt riêng của host (chỉ trong trình duyệt máy này)
const HOST_SETTINGS_KEY = 'pinnacle_host_settings_v1';

const loadHostSettings = () => {
  try {
    const raw = localStorage.getItem(HOST_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { disableTimer: false };
};

const saveHostSettings = (settings) => {
  try {
    localStorage.setItem(HOST_SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
};

/**
 * Host Console — trang riêng (?host=1) để chuẩn bị bộ câu hỏi hằng ngày,
 * lưu CHỈ trong trình duyệt của máy này, và chọn bộ để đố người xem khi live.
 * Không hiển thị cho người chơi thường vì không có lối vào từ menu chính.
 */
const HostConsole = () => {
  const [sets, setSets] = useState(() => listCustomSets());
  const [setName, setSetName] = useState('');
  const [error, setError] = useState(null);
  const [activeSetId, setActiveSetId] = useState(null);
  const [hostSettings, setHostSettings] = useState(() => loadHostSettings());
  const fileInputRef = useRef(null);

  const toggleDisableTimer = () => {
    setHostSettings((prev) => {
      const next = { ...prev, disableTimer: !prev.disableTimer };
      saveHostSettings(next);
      return next;
    });
  };

  if (activeSetId) {
    const customQuestions = getCustomSetQuestions(activeSetId);
    return (
      <div className="relative w-full overflow-hidden bg-[#020617]" style={{ height: '100dvh' }}>
        <PinnacleGame
          customQuestions={customQuestions}
          disableTimer={hostSettings.disableTimer}
          onLeaveGame={() => setActiveSetId(null)}
        />
      </div>
    );
  }

  const refresh = () => setSets(listCustomSets());

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const name = setName.trim() || file.name.replace(/\.json$/i, '');
        importCustomSet(name, parsed);
        setSetName('');
        refresh();
      } catch (err) {
        setError(err.message || 'File JSON không hợp lệ');
      } finally {
        e.target.value = '';
      }
    };
    reader.onerror = () => setError('Không đọc được file');
    reader.readAsText(file);
  };

  const handleDelete = (id, name) => {
    if (!window.confirm(`Xóa bộ câu hỏi "${name}"?`)) return;
    deleteCustomSet(id);
    refresh();
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([buildTemplateJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mau_bo_cau_hoi.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-black text-yellow-300">Host Console — Nhà Thần Học</h1>
          <p className="text-blue-200 text-sm mt-1">
            Chuẩn bị bộ câu hỏi riêng cho buổi live hôm nay. Bộ câu hỏi chỉ lưu trên trình duyệt này, không upload lên server.
          </p>
        </div>

        {/* Settings card */}
        <div className="bg-[#1e3a8a]/60 border-2 border-blue-400/30 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-700/60 border border-blue-400/40 flex items-center justify-center shrink-0">
              <Timer size={16} className="text-yellow-300" />
            </div>
            <div>
              <p className="font-bold text-blue-100 text-sm">Tắt đếm giờ trả lời</p>
              <p className="text-blue-300/70 text-xs">Người chơi có thể suy nghĩ không giới hạn thời gian mỗi câu</p>
            </div>
          </div>
          <button
            onClick={toggleDisableTimer}
            role="switch"
            aria-checked={hostSettings.disableTimer}
            className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
              hostSettings.disableTimer ? 'bg-green-500' : 'bg-blue-900/70'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                hostSettings.disableTimer ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Upload card */}
        <div className="bg-[#1e3a8a]/60 border-2 border-blue-400/30 rounded-2xl p-4 flex flex-col gap-3">
          <h2 className="font-bold text-blue-100">Tải lên bộ câu hỏi mới (đúng 15 câu, định dạng JSON)</h2>
          <input
            type="text"
            value={setName}
            onChange={(e) => setSetName(e.target.value)}
            placeholder="Tên bộ câu hỏi (vd: Live 29/08 - Sáng Thế Ký)"
            className="rounded-xl bg-[#0f1f4d] border border-blue-400/40 px-3 py-2 text-sm placeholder:text-blue-300/50 outline-none focus:border-yellow-300"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-[#1e3a8a] font-black text-sm px-4 py-2.5 rounded-xl transition-all"
            >
              <Upload size={16} /> Chọn file JSON
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-blue-700/60 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all border border-blue-400/40"
            >
              <FileDown size={16} /> Tải file mẫu
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileChange} className="hidden" />
          {error && (
            <div className="flex items-start gap-2 text-red-300 text-xs bg-red-950/40 border border-red-500/30 rounded-xl p-3 whitespace-pre-line">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Sets list */}
        <div className="flex flex-col gap-2">
          <h2 className="font-bold text-blue-100">Các bộ câu hỏi đã lưu ({sets.length})</h2>
          {sets.length === 0 && (
            <p className="text-blue-300/60 text-sm">Chưa có bộ câu hỏi nào. Tải file JSON lên để bắt đầu.</p>
          )}
          {sets.map((s) => (
            <div key={s.id} className="flex items-center gap-3 bg-[#1e40af]/40 border border-blue-400/20 rounded-xl p-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{s.name}</p>
                <p className="text-blue-300/70 text-xs">{s.count} câu · {new Date(s.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <button
                onClick={() => setActiveSetId(s.id)}
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-white font-black text-xs px-3 py-2 rounded-lg transition-all"
              >
                <Play size={13} fill="currentColor" /> Chơi
              </button>
              <button
                onClick={() => handleDelete(s.id, s.name)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-all"
                aria-label="Xóa"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HostConsole;
