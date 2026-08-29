/**
 * Custom Question Sets — bộ câu hỏi do host tự soạn, lưu CHỈ trong trình duyệt (localStorage).
 * Không upload lên server/PlayFab/Firebase — dùng cho host livestream tự chọn bộ để đố người xem.
 *
 * Mỗi bộ = đúng 15 câu, cùng schema với src/data/level_XX.json:
 *   { question, opt_a, opt_b, opt_c, opt_d, correct_ans (0-3), explanation?, category? }
 */
import { toGameFormat } from './questionManager';

const STORAGE_KEY = 'pinnacle_custom_sets_v1';
const QUESTIONS_PER_SET = 15;

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(sets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

/** Danh sách bộ câu hỏi (không gồm nội dung câu hỏi, chỉ metadata) */
export function listCustomSets() {
  return readAll()
    .map(({ id, name, createdAt, questions }) => ({ id, name, createdAt, count: questions.length }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Lấy câu hỏi của 1 bộ, đã convert sang game format (options[], answer index) */
export function getCustomSetQuestions(id) {
  const set = readAll().find(s => s.id === id);
  if (!set) return null;
  return set.questions.map(toGameFormat);
}

/**
 * Validate 1 mảng câu hỏi thô theo schema level_XX.json.
 * Trả về mảng lỗi (rỗng nếu hợp lệ).
 */
export function validateQuestionSet(rawArray) {
  const errors = [];
  if (!Array.isArray(rawArray)) {
    return ['File phải là một mảng JSON các câu hỏi'];
  }
  if (rawArray.length !== QUESTIONS_PER_SET) {
    errors.push(`Bộ câu hỏi phải có đúng ${QUESTIONS_PER_SET} câu (hiện có ${rawArray.length})`);
  }
  rawArray.forEach((q, i) => {
    const n = i + 1;
    if (!q || typeof q !== 'object') { errors.push(`Câu ${n}: không hợp lệ`); return; }
    if (!q.question || typeof q.question !== 'string') errors.push(`Câu ${n}: thiếu "question"`);
    for (const key of ['opt_a', 'opt_b', 'opt_c', 'opt_d']) {
      if (!q[key] || typeof q[key] !== 'string') errors.push(`Câu ${n}: thiếu "${key}"`);
    }
    if (!Number.isInteger(q.correct_ans) || q.correct_ans < 0 || q.correct_ans > 3) {
      errors.push(`Câu ${n}: "correct_ans" phải là số nguyên 0-3 (0=A, 1=B, 2=C, 3=D)`);
    }
  });
  return errors;
}

/**
 * Lưu 1 bộ câu hỏi mới vào localStorage.
 * ID câu hỏi luôn được sinh mới (custom_<setId>_<index>) để không bao giờ trùng
 * với ID câu hỏi trong pool ngẫu nhiên (level_01..15).
 * @throws {Error} nếu dữ liệu không hợp lệ
 */
export function importCustomSet(name, rawArray) {
  const errors = validateQuestionSet(rawArray);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  const setId = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const questions = rawArray.map((q, i) => ({
    id: `${setId}_${i}`,
    question: q.question,
    opt_a: q.opt_a,
    opt_b: q.opt_b,
    opt_c: q.opt_c,
    opt_d: q.opt_d,
    correct_ans: q.correct_ans,
    explanation: q.explanation || '',
    category: q.category || 'custom',
  }));

  const sets = readAll();
  sets.push({
    id: setId,
    name: (name || '').trim() || `Bộ câu hỏi ${new Date().toLocaleDateString('vi-VN')}`,
    createdAt: Date.now(),
    questions,
  });
  writeAll(sets);
  return setId;
}

export function deleteCustomSet(id) {
  writeAll(readAll().filter(s => s.id !== id));
}

/** Mẫu JSON để host tải về, chỉnh sửa rồi upload lại */
export function buildTemplateJson() {
  const template = Array.from({ length: QUESTIONS_PER_SET }, (_, i) => ({
    question: `Câu hỏi số ${i + 1}?`,
    opt_a: 'Đáp án A',
    opt_b: 'Đáp án B',
    opt_c: 'Đáp án C',
    opt_d: 'Đáp án D',
    correct_ans: 0,
    explanation: 'Giải thích đáp án đúng (tùy chọn).',
    category: 'custom',
  }));
  return JSON.stringify(template, null, 2);
}
