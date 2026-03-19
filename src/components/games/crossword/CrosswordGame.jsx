import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Trophy, Star, Check, RotateCcw, Zap, Eye, Lightbulb } from 'lucide-react';
import { useUserStore } from '../../../store/userStore';
import bgCrossword from '../../../assets/common/bg_crossword.png';

const BG_STYLE = {
  backgroundImage: `url(${bgCrossword})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

/* ══════════════════════════════════════════════════════════════
   PUZZLE DATA — 3 bộ puzzle chủ đề Công giáo
   ══════════════════════════════════════════════════════════════ */

const PUZZLES = [
  {
    id: 1,
    title: 'Kinh Thánh Cơ Bản',
    gridSize: { rows: 12, cols: 12 },
    words: [
      { id: '1-across', num: 1, direction: 'across', row: 0, col: 0, answer: 'GIÊSU',      clue: 'Con Thiên Chúa, Đấng Cứu Thế' },
      { id: '2-down',   num: 2, direction: 'down',   row: 0, col: 2, answer: 'ÊĐEN',       clue: 'Vườn địa đàng đầu tiên' },
      { id: '3-across', num: 3, direction: 'across', row: 2, col: 1, answer: 'PHERÔ',      clue: 'Tông đồ trưởng, giữ chìa khóa Nước Trời' },
      { id: '4-down',   num: 4, direction: 'down',   row: 0, col: 4, answer: 'MARIA',      clue: 'Mẹ Thiên Chúa, Đức Trinh Nữ' },
      { id: '5-across', num: 5, direction: 'across', row: 4, col: 0, answer: 'THÁNH',      clue: 'Danh xưng cho người được Chúa tôn vinh' },
      { id: '6-down',   num: 6, direction: 'down',   row: 2, col: 5, answer: 'GIUSE',      clue: 'Bạn trăm năm của Đức Maria' },
      { id: '7-across', num: 7, direction: 'across', row: 6, col: 2, answer: 'GIOAN',      clue: 'Tông đồ được Chúa yêu mến nhất' },
      { id: '8-down',   num: 8, direction: 'down',   row: 4, col: 3, answer: 'NOAH',       clue: 'Người đóng tàu cứu muôn loài khỏi đại hồng thủy' },
      { id: '9-across', num: 9, direction: 'across', row: 8, col: 0, answer: 'MÔSÊ',       clue: 'Người dẫn dân Israel qua Biển Đỏ' },
      { id: '10-down',  num: 10, direction: 'down',  row: 6, col: 4, answer: 'AĐAM',       clue: 'Người nam đầu tiên Chúa tạo dựng' },
      { id: '11-across',num: 11, direction: 'across', row: 10, col: 1, answer: 'SINAI',    clue: 'Núi nơi Môsê nhận Mười Điều Răn' },
      { id: '12-down',  num: 12, direction: 'down',  row: 8, col: 2, answer: 'SÁNG',       clue: 'Điều đầu tiên Thiên Chúa tạo ra: "Hãy có ___"' },
    ],
  },
  {
    id: 2,
    title: 'Bí Tích & Phụng Vụ',
    gridSize: { rows: 12, cols: 12 },
    words: [
      { id: '1-across', num: 1, direction: 'across', row: 0, col: 0, answer: 'THÁNH',     clue: 'Bí tích ___ Thể: Mình và Máu Chúa Kitô' },
      { id: '2-down',   num: 2, direction: 'down',   row: 0, col: 0, answer: 'TRUYỀN',    clue: 'Bí tích ___ Chức Thánh' },
      { id: '3-across', num: 3, direction: 'across', row: 2, col: 1, answer: 'CHAY',      clue: 'Mùa ___ : 40 ngày ăn chay, cầu nguyện' },
      { id: '4-down',   num: 4, direction: 'down',   row: 0, col: 4, answer: 'NƯỚC',      clue: 'Bí tích Rửa Tội dùng ___ để thanh tẩy' },
      { id: '5-across', num: 5, direction: 'across', row: 4, col: 0, answer: 'PHỤC',      clue: '___ Sinh: Chúa sống lại ngày thứ ba' },
      { id: '6-down',   num: 6, direction: 'down',   row: 2, col: 3, answer: 'DẦU',       clue: '___ thánh dùng trong bí tích Thêm Sức' },
      { id: '7-across', num: 7, direction: 'across', row: 6, col: 1, answer: 'GIÁNG',     clue: '___ Sinh: lễ mừng Chúa ra đời 25/12' },
      { id: '8-down',   num: 8, direction: 'down',   row: 4, col: 2, answer: 'CẦU',       clue: '___ nguyện: nói chuyện với Chúa' },
      { id: '9-across', num: 9, direction: 'across', row: 8, col: 0, answer: 'TÌNH',      clue: 'Điều răn mới: Yêu ___ như Thầy đã yêu' },
      { id: '10-down',  num: 10, direction: 'down',  row: 6, col: 5, answer: 'LỄ',        clue: '___ Vọng Phục Sinh: đêm thánh nhất năm' },
      { id: '11-across',num: 11, direction: 'across', row: 10, col: 2, answer: 'BÁNH',    clue: '___ Thánh: Mình Chúa Kitô' },
      { id: '12-down',  num: 12, direction: 'down',  row: 8, col: 3, answer: 'HÒA',       clue: 'Bí tích ___ Giải: xưng tội, làm hoà với Chúa' },
    ],
  },
  {
    id: 3,
    title: 'Các Thánh & Đức Mẹ',
    gridSize: { rows: 12, cols: 12 },
    words: [
      { id: '1-across', num: 1, direction: 'across', row: 0, col: 1, answer: 'LUCA',       clue: 'Thánh sử viết Phúc Âm thứ ba' },
      { id: '2-down',   num: 2, direction: 'down',   row: 0, col: 1, answer: 'LỘ',         clue: 'Đức Mẹ hiện ra tại ___ Đức (Lourdes)' },
      { id: '3-across', num: 3, direction: 'across', row: 2, col: 0, answer: 'TÔMA',       clue: 'Tông đồ đòi xem dấu đinh mới tin' },
      { id: '4-down',   num: 4, direction: 'down',   row: 0, col: 3, answer: 'CATARINA',   clue: 'Thánh nữ ___ Siena, Tiến sĩ Hội Thánh' },
      { id: '5-across', num: 5, direction: 'across', row: 4, col: 1, answer: 'GIUĐA',      clue: 'Kẻ phản bội Chúa Giêsu' },
      { id: '6-down',   num: 6, direction: 'down',   row: 2, col: 2, answer: 'MÂN',        clue: 'Kinh ___ Côi: 20 mầu nhiệm' },
      { id: '7-across', num: 7, direction: 'across', row: 6, col: 0, answer: 'PHAOLÔ',     clue: 'Tông đồ dân ngoại, trước đó tên Saolô' },
      { id: '8-down',   num: 8, direction: 'down',   row: 4, col: 5, answer: 'TÊRÊXA',     clue: 'Thánh nữ ___ Hài Đồng Giêsu' },
      { id: '9-across', num: 9, direction: 'across', row: 8, col: 1, answer: 'FATIMA',     clue: 'Đức Mẹ hiện ra năm 1917 tại ___' },
      { id: '10-down',  num: 10, direction: 'down',  row: 6, col: 3, answer: 'ÔLÔP',       clue: 'Thánh Phêrô thủ lĩnh ___ đồ đoàn' },
      { id: '11-across',num: 11, direction: 'across', row: 10, col: 0, answer: 'PHÚC',     clue: '___ Âm: Tin Mừng của Chúa Giêsu' },
      { id: '12-down',  num: 12, direction: 'down',  row: 8, col: 4, answer: 'IM',          clue: 'Đức Mẹ Vô Nhiễm Nguyên Tội (Bà ___ aculata)' },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════
   HELPER: build grid map from puzzle data
   ══════════════════════════════════════════════════════════════ */

function buildGridMap(puzzle) {
  const { rows, cols } = puzzle.gridSize;
  // grid[r][c] = { isCell: bool, letter: '', wordIds: [], cellNum: null }
  const grid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ isCell: false, letter: '', wordIds: [], cellNum: null }))
  );

  puzzle.words.forEach((word) => {
    const letters = [...word.answer];
    letters.forEach((ch, i) => {
      const r = word.direction === 'down' ? word.row + i : word.row;
      const c = word.direction === 'across' ? word.col + i : word.col;
      if (r < rows && c < cols) {
        grid[r][c].isCell = true;
        grid[r][c].letter = ch;
        if (!grid[r][c].wordIds.includes(word.id)) {
          grid[r][c].wordIds.push(word.id);
        }
        if (i === 0 && grid[r][c].cellNum === null) grid[r][c].cellNum = word.num;
      }
    });
  });

  return grid;
}

/* ══════════════════════════════════════════════════════════════
   VIRTUAL KEYBOARD
   ══════════════════════════════════════════════════════════════ */

const VIET_KEYS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M','⌫'],
];

const VirtualKeyboard = ({ onKey, onBackspace, compact = false }) => (
  <div className="flex flex-col gap-[3px] items-center w-full max-w-lg mx-auto select-none">
    {VIET_KEYS.map((row, ri) => (
      <div key={ri} className="flex gap-[3px] justify-center w-full">
        {row.map((k) => (
          <motion.button
            key={k}
            whileTap={{ scale: 0.88, y: 2 }}
            onClick={() => k === '⌫' ? onBackspace() : onKey(k)}
            className="flex items-center justify-center rounded-lg font-black transition-colors"
            style={{
              width: k === '⌫' ? (compact ? 38 : 46) : (compact ? 30 : 34),
              height: compact ? 32 : 38,
              fontSize: k === '⌫' ? (compact ? 15 : 18) : (compact ? 13 : 15),
              color: k === '⌫' ? '#ffffff' : '#fef08a',  /* yellow-200 for letters */
              background: k === '⌫'
                ? 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)'
                : 'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%)',
              border: k === '⌫' ? '2px solid #991b1b' : '2px solid #7dd3fc',
              boxShadow: k === '⌫' ? '0 2px 0 #7f1d1d' : '0 2px 0 #0369a1',
              textShadow: k === '⌫' ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {k}
          </motion.button>
        ))}
      </div>
    ))}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   PROGRESS BAR (P2P)
   ══════════════════════════════════════════════════════════════ */

const ProgressBar = ({ label, percent, color, avatar }) => (
  <div className="flex items-center gap-2 w-full">
    <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0"
      style={{ background: color, border: '2px solid rgba(0,0,0,0.3)', boxShadow: '0 2px 0 rgba(0,0,0,0.3)' }}>
      {avatar || '?'}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline mb-0.5">
        <span className="text-white/80 font-bold text-[10px] truncate">{label}</span>
        <span className="text-white font-black text-xs">{Math.round(percent)}%</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
          initial={{ width: '0%' }}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */

const CrosswordGame = ({
  onLeaveGame,
  // P2P props (null in solo)
  opponentProgress = null,
  myProfile = null,
  opponentProfile = null,
  onProgressUpdate = null,
  onFinish = null,
}) => {
  // Game state: 'intro' → 'playing' → 'finished'
  const [gameState, setGameState] = useState('intro');
  const [confirmQuit, setConfirmQuit] = useState(false);

  // Puzzle
  const [puzzle, setPuzzle] = useState(() => PUZZLES[Math.floor(Math.random() * PUZZLES.length)]);
  const gridMap = useMemo(() => buildGridMap(puzzle), [puzzle]);
  const totalWords = puzzle.words.length;
  const [isReplay, setIsReplay] = useState(false);

  // User input grid
  const [userGrid, setUserGrid] = useState(() => {
    const { rows, cols } = puzzle.gridSize;
    return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
  });

  // Selection
  const [selectedCell, setSelectedCell] = useState(null); // { row, col }
  const [direction, setDirection] = useState('across');    // current typing direction
  const [activeWordId, setActiveWordId] = useState(null);

  // Scoring
  const [solvedWords, setSolvedWords] = useState(new Set());
  const [wrongWords, setWrongWords] = useState(new Set());
  const [score, setScore] = useState(0);

  // Hints (solo only)
  const isSolo = opponentProgress == null;
  const [hintUsed, setHintUsed] = useState(false);     // whether any hint was used
  const [hintsSpent, setHintsSpent] = useState(0);      // total coins spent on hints
  const [showHintMenu, setShowHintMenu] = useState(false);

  // Store — for persisting XP/coins
  const { addXP, addCoins, coins: userCoins } = useUserStore();

  // Earned rewards (set at finish for display)
  const [earnedXP, setEarnedXP] = useState(null);
  const [earnedCoins, setEarnedCoins] = useState(null);

  // Timer
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const timerRef = useRef(null);

  // Celebration
  const [showCelebration, setShowCelebration] = useState(false);

  // Refs
  const gridContainerRef = useRef(null);
  const gridRef = useRef(null);
  const scrollToCellRef = useRef(null);

  /* ── compute which word is active ── */
  const getActiveWord = useCallback((row, col, dir) => {
    if (row == null) return null;
    const cell = gridMap[row]?.[col];
    if (!cell?.isCell) return null;
    // prefer the word matching current direction
    const match = cell.wordIds.find(wid => {
      const w = puzzle.words.find(ww => ww.id === wid);
      return w?.direction === dir;
    });
    if (match) return match;
    return cell.wordIds[0] || null;
  }, [gridMap, puzzle.words]);

  /* ── cell highlighting helpers ── */
  const getWordCells = useCallback((wordId) => {
    if (!wordId) return [];
    const w = puzzle.words.find(ww => ww.id === wordId);
    if (!w) return [];
    const letters = [...w.answer];
    return letters.map((_, i) => ({
      row: w.direction === 'down' ? w.row + i : w.row,
      col: w.direction === 'across' ? w.col + i : w.col,
    }));
  }, [puzzle.words]);

  /* ── Select cell ── */
  const selectCell = useCallback((row, col) => {
    const cell = gridMap[row]?.[col];
    if (!cell?.isCell) return;

    // If clicking same cell, toggle direction
    let newDir = direction;
    if (selectedCell?.row === row && selectedCell?.col === col) {
      newDir = direction === 'across' ? 'down' : 'across';
    }
    setSelectedCell({ row, col });
    setDirection(newDir);
    const wid = getActiveWord(row, col, newDir);
    setActiveWordId(wid);
    // Refocus hidden input for physical keyboard
    setTimeout(() => hiddenInputRef.current?.focus({ preventScroll: true }), 0);
  }, [gridMap, selectedCell, direction, getActiveWord]);

  /* ── Select word from clue ── */
  const selectWordFromClue = useCallback((wordId) => {
    const w = puzzle.words.find(ww => ww.id === wordId);
    if (!w) return;
    setDirection(w.direction);
    setSelectedCell({ row: w.row, col: w.col });
    setActiveWordId(wordId);
    // Scroll grid to show the word (especially useful in portrait)
    scrollToCellRef.current?.(w.row, w.col);
  }, [puzzle.words]);

  /* ── Move to next cell ── */
  const moveToNext = useCallback((row, col, dir) => {
    const nr = dir === 'down' ? row + 1 : row;
    const nc = dir === 'across' ? col + 1 : col;
    if (nr < puzzle.gridSize.rows && nc < puzzle.gridSize.cols && gridMap[nr]?.[nc]?.isCell) {
      setSelectedCell({ row: nr, col: nc });
    }
  }, [gridMap, puzzle.gridSize]);

  /* ── Move to previous cell ── */
  const moveToPrev = useCallback((row, col, dir) => {
    const nr = dir === 'down' ? row - 1 : row;
    const nc = dir === 'across' ? col - 1 : col;
    if (nr >= 0 && nc >= 0 && gridMap[nr]?.[nc]?.isCell) {
      setSelectedCell({ row: nr, col: nc });
    }
  }, [gridMap]);

  /* ── Check word completion ── */
  const checkWord = useCallback((wordId, currentUserGrid) => {
    const w = puzzle.words.find(ww => ww.id === wordId);
    if (!w) return false;
    const letters = [...w.answer];
    return letters.every((ch, i) => {
      const r = w.direction === 'down' ? w.row + i : w.row;
      const c = w.direction === 'across' ? w.col + i : w.col;
      return currentUserGrid[r]?.[c]?.toUpperCase() === ch.toUpperCase();
    });
  }, [puzzle.words]);

  /* ── Check if all cells of a word are filled ── */
  const isWordFilled = useCallback((wordId, currentUserGrid) => {
    const w = puzzle.words.find(ww => ww.id === wordId);
    if (!w) return false;
    const letters = [...w.answer];
    return letters.every((_, i) => {
      const r = w.direction === 'down' ? w.row + i : w.row;
      const c = w.direction === 'across' ? w.col + i : w.col;
      return currentUserGrid[r]?.[c]?.trim().length > 0;
    });
  }, [puzzle.words]);

  /* ── Handle letter input ── */
  const handleLetterInput = useCallback((letter) => {
    if (!selectedCell || gameState !== 'playing') return;
    const { row, col } = selectedCell;
    if (!gridMap[row]?.[col]?.isCell) return;

    const newGrid = userGrid.map(r => [...r]);
    newGrid[row][col] = letter.toUpperCase();
    setUserGrid(newGrid);

    // Remove wrong state if re-typing
    const cell = gridMap[row][col];
    cell.wordIds.forEach(wid => {
      if (wrongWords.has(wid)) {
        setWrongWords(prev => { const n = new Set(prev); n.delete(wid); return n; });
      }
    });

    // Auto-check each word this cell belongs to
    const newSolved = new Set(solvedWords);
    let changed = false;
    cell.wordIds.forEach(wid => {
      if (!newSolved.has(wid) && isWordFilled(wid, newGrid) && checkWord(wid, newGrid)) {
        newSolved.add(wid);
        changed = true;
      }
    });
    if (changed) {
      setSolvedWords(newSolved);
      setScore(newSolved.size * 10);
      // Report progress
      onProgressUpdate?.({
        score: newSolved.size * 10,
        completedItems: [...newSolved],
        lastUpdated: Date.now(),
      });
    }

    // Move to next cell
    moveToNext(row, col, direction);
  }, [selectedCell, gameState, gridMap, userGrid, direction, solvedWords, wrongWords, checkWord, isWordFilled, moveToNext, onProgressUpdate]);

  /* ── Handle backspace ── */
  const handleBackspace = useCallback(() => {
    if (!selectedCell || gameState !== 'playing') return;
    const { row, col } = selectedCell;
    if (!gridMap[row]?.[col]?.isCell) return;

    const newGrid = userGrid.map(r => [...r]);
    if (newGrid[row][col]) {
      newGrid[row][col] = '';
      setUserGrid(newGrid);
    } else {
      // Move back and clear
      const pr = direction === 'down' ? row - 1 : row;
      const pc = direction === 'across' ? col - 1 : col;
      if (pr >= 0 && pc >= 0 && gridMap[pr]?.[pc]?.isCell) {
        newGrid[pr][pc] = '';
        setUserGrid(newGrid);
        setSelectedCell({ row: pr, col: pc });
      }
    }
  }, [selectedCell, gameState, gridMap, userGrid, direction]);

  /* ── Handle "Kiểm tra" all ── */
  const handleCheckAll = useCallback(() => {
    const newSolved = new Set(solvedWords);
    const newWrong = new Set();
    puzzle.words.forEach(w => {
      if (newSolved.has(w.id)) return;
      if (isWordFilled(w.id, userGrid)) {
        if (checkWord(w.id, userGrid)) {
          newSolved.add(w.id);
        } else {
          newWrong.add(w.id);
        }
      }
    });
    setSolvedWords(newSolved);
    setWrongWords(newWrong);
    setScore(newSolved.size * 10);
    onProgressUpdate?.({
      score: newSolved.size * 10,
      completedItems: [...newSolved],
      lastUpdated: Date.now(),
    });
  }, [solvedWords, puzzle.words, userGrid, checkWord, isWordFilled, onProgressUpdate]);

  /* ── Hint: Reveal one letter ── */
  const handleRevealLetter = useCallback(() => {
    if (!selectedCell || gameState !== 'playing' || !isSolo) return;
    const { row, col } = selectedCell;
    const cell = gridMap[row]?.[col];
    if (!cell?.isCell) return;
    // Already filled correctly?
    if (userGrid[row][col]?.toUpperCase() === cell.letter.toUpperCase()) return;

    // Check user has enough coins
    if (userCoins < 20) return;
    setHintUsed(true);
    setHintsSpent(prev => prev + 20);
    addCoins(-20); // deduct coins live
    const newGrid = userGrid.map(r => [...r]);
    newGrid[row][col] = cell.letter;
    setUserGrid(newGrid);

    // Auto-check words after reveal
    const newSolved = new Set(solvedWords);
    let changed = false;
    cell.wordIds.forEach(wid => {
      if (!newSolved.has(wid) && isWordFilled(wid, newGrid) && checkWord(wid, newGrid)) {
        newSolved.add(wid);
        changed = true;
      }
    });
    if (changed) {
      setSolvedWords(newSolved);
      setScore(newSolved.size * 10);
      onProgressUpdate?.({
        score: newSolved.size * 10,
        completedItems: [...newSolved],
        lastUpdated: Date.now(),
      });
    }
    moveToNext(row, col, direction);
    setShowHintMenu(false);
  }, [selectedCell, gameState, isSolo, gridMap, userGrid, solvedWords, checkWord, isWordFilled, moveToNext, direction, onProgressUpdate]);

  /* ── Hint: Reveal entire word ── */
  const handleRevealWord = useCallback(() => {
    if (!activeWordId || gameState !== 'playing' || !isSolo) return;
    const w = puzzle.words.find(ww => ww.id === activeWordId);
    if (!w) return;

    // Check user has enough coins
    if (userCoins < 50) return;
    setHintUsed(true);
    setHintsSpent(prev => prev + 50);
    addCoins(-50); // deduct coins live
    const newGrid = userGrid.map(r => [...r]);
    const letters = [...w.answer];
    letters.forEach((ch, i) => {
      const r = w.direction === 'down' ? w.row + i : w.row;
      const c = w.direction === 'across' ? w.col + i : w.col;
      newGrid[r][c] = ch;
    });
    setUserGrid(newGrid);

    // Mark as solved + check cross-words
    const newSolved = new Set(solvedWords);
    newSolved.add(w.id);
    // Check all words that share cells with this word
    letters.forEach((_, i) => {
      const r = w.direction === 'down' ? w.row + i : w.row;
      const c = w.direction === 'across' ? w.col + i : w.col;
      gridMap[r][c].wordIds.forEach(wid => {
        if (!newSolved.has(wid) && isWordFilled(wid, newGrid) && checkWord(wid, newGrid)) {
          newSolved.add(wid);
        }
      });
    });
    setSolvedWords(newSolved);
    setScore(newSolved.size * 10);
    onProgressUpdate?.({
      score: newSolved.size * 10,
      completedItems: [...newSolved],
      lastUpdated: Date.now(),
    });
    setShowHintMenu(false);
  }, [activeWordId, gameState, isSolo, puzzle.words, userGrid, gridMap, solvedWords, checkWord, isWordFilled, onProgressUpdate]);

  /* ── Hidden input for physical keyboard + IME support ── */
  const hiddenInputRef = useRef(null);
  const handleLetterInputRef = useRef(handleLetterInput);
  const handleBackspaceRef = useRef(handleBackspace);
  const selectedCellRef = useRef(selectedCell);
  handleLetterInputRef.current = handleLetterInput;
  handleBackspaceRef.current = handleBackspace;
  selectedCellRef.current = selectedCell;

  // Keep hidden input focused during gameplay
  const focusHiddenInput = useCallback(() => {
    if (gameState === 'playing' && hiddenInputRef.current) {
      hiddenInputRef.current.focus({ preventScroll: true });
    }
  }, [gameState]);

  useEffect(() => {
    focusHiddenInput();
  }, [selectedCell, focusHiddenInput]);

  // Handle character input from hidden input (works with all IME modes)
  const lastInputTimeRef = useRef(0);
  const onHiddenInput = useCallback((e) => {
    // Skip intermediate composition input events
    if (e.nativeEvent?.isComposing) return;
    const val = e.target.value;
    if (val) {
      const lastChar = val.slice(-1).toUpperCase();
      if (/^[A-Z]$/.test(lastChar)) {
        lastInputTimeRef.current = Date.now();
        handleLetterInputRef.current(lastChar);
      }
      e.target.value = '';
    }
  }, []);

  // Handle special keys on hidden input (Backspace, Arrow, Tab)
  const onHiddenKeyDown = useCallback((e) => {
    if (e.isComposing) return; // let IME handle it
    const sel = selectedCellRef.current;

    if (e.key === 'Backspace') {
      // Ignore Backspace from IME (Unikey sends Backspace+replacement char
      // within <100ms of the previous input event)
      if (Date.now() - lastInputTimeRef.current < 100) return;
      e.preventDefault();
      handleBackspaceRef.current();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      setDirection(d => d === 'across' ? 'down' : 'across');
      return;
    }
    if (e.key === 'ArrowUp' && sel) {
      e.preventDefault();
      const nr = sel.row - 1;
      if (nr >= 0 && gridMap[nr]?.[sel.col]?.isCell) {
        setSelectedCell({ row: nr, col: sel.col });
        setDirection('down');
      }
      return;
    }
    if (e.key === 'ArrowDown' && sel) {
      e.preventDefault();
      const nr = sel.row + 1;
      if (nr < puzzle.gridSize.rows && gridMap[nr]?.[sel.col]?.isCell) {
        setSelectedCell({ row: nr, col: sel.col });
        setDirection('down');
      }
      return;
    }
    if (e.key === 'ArrowLeft' && sel) {
      e.preventDefault();
      const nc = sel.col - 1;
      if (nc >= 0 && gridMap[sel.row]?.[nc]?.isCell) {
        setSelectedCell({ row: sel.row, col: nc });
        setDirection('across');
      }
      return;
    }
    if (e.key === 'ArrowRight' && sel) {
      e.preventDefault();
      const nc = sel.col + 1;
      if (nc < puzzle.gridSize.cols && gridMap[sel.row]?.[nc]?.isCell) {
        setSelectedCell({ row: sel.row, col: nc });
        setDirection('across');
      }
      return;
    }
  }, [gridMap, puzzle.gridSize]);

  /* ── Timer ── */
  useEffect(() => {
    if (gameState !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  /* ── Auto-finish when time runs out ── */
  useEffect(() => {
    if (gameState === 'playing' && timeLeft <= 0) {
      finishGame();
    }
  }, [timeLeft, gameState]);

  /* ── Auto-finish when all words solved ── */
  useEffect(() => {
    if (gameState === 'playing' && solvedWords.size === totalWords) {
      setShowCelebration(true);
      setTimeout(() => finishGame(), 2000);
    }
  }, [solvedWords.size, totalWords, gameState]);

  /* ── Finish game ── */
  const finishGame = useCallback(() => {
    clearInterval(timerRef.current);

    if (isReplay) {
      // ── REPLAY: 0 XP, only +2 coin per word ──
      const wordCoins = solvedWords.size * 2;
      setEarnedXP({ wordsXP: 0, completionXP: 0, noHintXP: 0, speedXP: 0, total: 0 });
      setEarnedCoins({ wordCoins, completionCoins: 0, perfectBonus: 0, hintsSpent, total: wordCoins - hintsSpent });
      if (isSolo) {
        addCoins(wordCoins); // hints already deducted live
      }
    } else {
      // ── FIRST PLAY: full rewards ──
      const wordsXP = solvedWords.size * 3;
      const completionXP = 20;
      const noHintXP = !hintUsed ? 10 : 0;
      const timeUsed = 300 - timeLeft;
      const speedXP = timeUsed <= 120 ? 10 : 0;
      const totalXP = wordsXP + completionXP + noHintXP + speedXP;

      const wordCoins = solvedWords.size * 5;
      const completionCoins = 20;
      const perfectBonus = solvedWords.size === totalWords ? 20 : 0;
      const rewardCoins = wordCoins + completionCoins + perfectBonus;

      setEarnedXP({ wordsXP, completionXP, noHintXP, speedXP, total: totalXP });
      setEarnedCoins({ wordCoins, completionCoins, perfectBonus, hintsSpent, total: rewardCoins - hintsSpent });

      if (isSolo) {
        addXP(totalXP);
        addCoins(rewardCoins);
      }
    }

    const finalScore = solvedWords.size * 10 + Math.floor(timeLeft / 10);
    setScore(finalScore);
    setGameState('finished');
    onFinish?.({
      score: finalScore,
      completedItems: [...solvedWords],
      timeLeft,
      xpEarned: isReplay ? 0 : undefined,
      hintUsed,
      hintsSpent,
    });
  }, [solvedWords, timeLeft, onFinish, hintUsed, hintsSpent, totalWords, isSolo, addXP, addCoins, isReplay]);

  /* ── Start game ── */
  const handleStart = () => {
    setGameState('playing');
    // Select first cell of first word
    const firstWord = puzzle.words[0];
    if (firstWord) {
      setSelectedCell({ row: firstWord.row, col: firstWord.col });
      setDirection(firstWord.direction);
      setActiveWordId(firstWord.id);
    }
  };

  /* ── Reset game state (shared by replay & new game) ── */
  const resetGameState = (targetPuzzle) => {
    const { rows, cols } = targetPuzzle.gridSize;
    setUserGrid(Array.from({ length: rows }, () => Array.from({ length: cols }, () => '')));
    setSelectedCell(null);
    setDirection('across');
    setActiveWordId(null);
    setSolvedWords(new Set());
    setWrongWords(new Set());
    setScore(0);
    setHintUsed(false);
    setHintsSpent(0);
    setShowHintMenu(false);
    setEarnedXP(null);
    setEarnedCoins(null);
    setTimeLeft(300);
    setShowCelebration(false);
    clearInterval(timerRef.current);
  };

  /* ── Replay same puzzle (0 XP, reduced coins) ── */
  const handleReplay = () => {
    setIsReplay(true);
    resetGameState(puzzle);
    setGameState('playing');
    const firstWord = puzzle.words[0];
    if (firstWord) {
      setSelectedCell({ row: firstWord.row, col: firstWord.col });
      setDirection(firstWord.direction);
      setActiveWordId(firstWord.id);
    }
  };

  /* ── New game with a different puzzle (full rewards) ── */
  const handleNewGame = () => {
    setIsReplay(false);
    // Pick a different puzzle if possible
    let newPuzzle;
    if (PUZZLES.length > 1) {
      const others = PUZZLES.filter(p => p !== puzzle);
      newPuzzle = others[Math.floor(Math.random() * others.length)];
    } else {
      newPuzzle = PUZZLES[0];
    }
    setPuzzle(newPuzzle);
    resetGameState(newPuzzle);
    setGameState('intro');
  };

  /* ── Update active word when selection changes ── */
  useEffect(() => {
    if (selectedCell) {
      const wid = getActiveWord(selectedCell.row, selectedCell.col, direction);
      setActiveWordId(wid);
    }
  }, [selectedCell, direction, getActiveWord]);

  /* ── Format time ── */
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  /* ── Active word cells ── */
  const activeWordCells = useMemo(() => {
    if (!activeWordId) return [];
    return getWordCells(activeWordId);
  }, [activeWordId, getWordCells]);

  /* ── Progress Percents ── */
  const myPercent = (solvedWords.size / totalWords) * 100;
  const opponentPercent = opponentProgress
    ? ((opponentProgress.completedItems?.length || 0) / totalWords) * 100
    : 0;

  /* ── Orientation ── */
  const [isLandscape, setIsLandscape] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > window.innerHeight
  );
  useEffect(() => {
    const update = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* ── Cell Size ── */
  const [cellSize, setCellSize] = useState(36);
  useEffect(() => {
    const measure = () => {
      const el = gridContainerRef.current;
      if (!el) return;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const maxCellW = Math.floor((w - 12) / puzzle.gridSize.cols);
      const maxCellH = Math.floor((h - 12) / puzzle.gridSize.rows);
      // In landscape: fit all cells within the container (no scroll needed)
      // In portrait: allow oversized cells with scrolling
      const isLand = window.innerWidth > window.innerHeight;
      const fitted = Math.min(maxCellW, maxCellH);
      const computed = isLand ? Math.round(fitted * 0.92) : Math.round(fitted * 1.5);
      setCellSize(Math.max(28, Math.min(90, computed)));
    };
    // Slight delay so flex layout has settled before measuring
    const t = setTimeout(measure, 50);
    const ro = new ResizeObserver(measure);
    if (gridContainerRef.current) ro.observe(gridContainerRef.current);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [puzzle.gridSize, isLandscape, gameState]);

  /* ── keep scroll helper in a ref so it can be called from anywhere ── */
  scrollToCellRef.current = (row, col) => {
    const container = gridContainerRef.current;
    if (!container) return;
    const cellX = col * (cellSize + 2);
    const cellY = row * (cellSize + 2);
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    container.scrollTo({
      left: Math.max(0, cellX - containerW / 2 + cellSize / 2),
      top: Math.max(0, cellY - containerH / 2 + cellSize / 2),
      behavior: 'smooth',
    });
  };

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */

  // ── INTRO SCREEN ──
  if (gameState === 'intro') {
    return (
      <div className="w-full h-full flex flex-col items-center relative overflow-y-auto"
        style={{ ...BG_STYLE }}>
        {/* Dark overlay */}
        <div className="fixed inset-0 pointer-events-none z-0" style={{ background: 'rgba(10,15,30,0.72)' }} />

        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-amber-500/10" />
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 8, repeat: Infinity }}
            className="absolute bottom-10 right-10 w-40 h-40 rounded-2xl rotate-45 bg-blue-500/10" />
        </div>

        {/* Back button — top left */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          whileTap={{ scale: 0.9 }}
          onClick={onLeaveGame}
          className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft size={20} className="text-white/80" />
        </motion.button>

        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="z-10 flex flex-col items-center gap-3 px-6 py-6 max-w-md w-full text-center my-auto">

          {/* Icon — smaller on landscape */}
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl flex items-center justify-center text-3xl md:text-5xl relative shrink-0"
            style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', border: '4px solid #92400e', boxShadow: '0 6px 0 #78350f, 0 10px 24px rgba(0,0,0,0.5)' }}>
            <span className="absolute inset-0 w-full h-1/2 rounded-t-xl md:rounded-t-2xl bg-white/15 pointer-events-none" />
            <span className="relative z-10">✝️</span>
          </div>

          <div>
            <h1 className="text-2xl md:text-4xl font-black text-white mb-1"
              style={{ textShadow: '0 3px 0 rgba(0,0,0,0.5)' }}>
              Ô Chữ Công Giáo
            </h1>
            <p className="text-amber-200/70 text-sm font-semibold">
              {puzzle.title} — {totalWords} từ cần tìm
            </p>
          </div>

          {/* Rules — compact */}
          <div className="w-full rounded-2xl p-3 text-left space-y-1.5"
            style={{ background: 'rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.1)' }}>
            <p className="text-white/80 text-xs md:text-sm flex items-center gap-2">
              <span className="text-amber-400">📝</span>
              Điền chữ cái vào ô trống dựa theo gợi ý
            </p>
            <p className="text-white/80 text-xs md:text-sm flex items-center gap-2">
              <span className="text-amber-400">⏱️</span>
              Thời gian: 5 phút
            </p>
            <p className="text-white/80 text-xs md:text-sm flex items-center gap-2">
              <span className="text-amber-400">💡</span>
              Click vào gợi ý để nhảy đến ô tương ứng
            </p>
          </div>

          {/* Rewards info */}
          <div className="w-full rounded-2xl p-3 text-left space-y-2"
            style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(245,158,11,0.15))', border: '2px solid rgba(255,255,255,0.12)' }}>
            <p className="text-white/50 text-[10px] md:text-xs font-black uppercase tracking-widest text-center mb-1">
              🎁 Phần Thưởng
            </p>
            {/* XP section */}
            <div className="flex items-start gap-2">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 2px 0 #4c1d95' }}>
                ⭐
              </span>
              <div className="text-xs md:text-sm space-y-0.5">
                <p><span className="text-purple-300 font-black">XP</span></p>
                <p className="text-white/70 font-semibold">+3 mỗi từ đúng · +20 hoàn thành</p>
                <p className="text-white/70 font-semibold">+10 không dùng hint · +10 hoàn thành {'<'} 2 phút</p>
              </div>
            </div>
            {/* Coin section */}
            <div className="flex items-start gap-2">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 2px 0 #92400e' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" fill="#fef3c7" stroke="#92400e" strokeWidth="1"/>
                  <circle cx="8" cy="8" r="5" fill="#fbbf24"/>
                  <text x="8" y="11.5" textAnchor="middle" fontSize="7" fontWeight="900" fill="#78350f">$</text>
                </svg>
              </span>
              <div className="text-xs md:text-sm space-y-0.5">
                <p><span className="text-amber-300 font-black">Coin</span></p>
                <p className="text-white/70 font-semibold">+5 mỗi từ đúng · +20 hoàn thành</p>
                <p className="text-white/70 font-semibold">+20 bonus nếu 100%</p>
              </div>
            </div>
            {/* Hint info */}
            <div className="flex items-start gap-2 pt-1 border-t border-white/10">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', boxShadow: '0 2px 0 #0e7490' }}>
                💡
              </span>
              <div className="text-xs md:text-sm space-y-0.5">
                <p><span className="text-cyan-300 font-black">Gợi Ý (Solo)</span></p>
                <p className="text-white/70 font-semibold">Mở 1 chữ: 20 💰 · Mở cả từ: 50 💰</p>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96, y: 3 }}
            onClick={handleStart}
            className="w-full py-3 md:py-4 rounded-2xl font-black text-lg md:text-xl text-white relative overflow-hidden shrink-0"
            style={{ background: 'linear-gradient(180deg, #d97706, #b45309)', border: '3px solid #92400e', boxShadow: '0 6px 0 #78350f' }}>
            <span className="absolute inset-0 w-full h-1/2 bg-white/15 pointer-events-none" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Zap size={22} /> Bắt Đầu
            </span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── FINISHED SCREEN ──
  if (gameState === 'finished') {
    const isP2P = opponentProgress != null;
    const myWordsCount = solvedWords.size;
    const oppWordsCount = opponentProgress?.completedItems?.length || 0;
    const isWinner = isP2P ? myWordsCount > oppWordsCount : false;
    const isDraw = isP2P ? myWordsCount === oppWordsCount : false;

    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
        style={{ ...BG_STYLE }}>
        {/* Dark overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(10,15,30,0.72)' }} />

        {showCelebration && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
            <div className="text-8xl animate-bounce">🎉</div>
          </motion.div>
        )}

        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="z-10 flex flex-col items-center gap-5 px-6 max-w-md w-full text-center">

          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
            style={{
              background: solvedWords.size === totalWords
                ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                : 'linear-gradient(135deg, #3b82f6, #1e40af)',
              border: '4px solid rgba(0,0,0,0.3)', boxShadow: '0 6px 0 rgba(0,0,0,0.4)',
            }}>
            {solvedWords.size === totalWords ? '🏆' : '⏱️'}
          </div>

          <div>
            <h2 className="text-2xl font-black text-white mb-1" style={{ textShadow: '0 2px 0 rgba(0,0,0,0.5)' }}>
              {solvedWords.size === totalWords
                ? 'Hoàn Thành Xuất Sắc!'
                : 'Hết Thời Gian!'}
            </h2>
            {isP2P && (
              <p className="text-lg font-black" style={{ color: isWinner ? '#4ade80' : isDraw ? '#fbbf24' : '#f87171' }}>
                {isWinner ? '🎉 Bạn Thắng!' : isDraw ? '🤝 Hoà!' : '😔 Bạn Thua!'}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="w-full rounded-2xl p-4 space-y-3"
            style={{ background: 'rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.1)' }}>
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm font-bold">Từ đúng</span>
              <span className="text-white font-black text-lg">{solvedWords.size}/{totalWords}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60 text-sm font-bold">Thời gian còn lại</span>
              <span className="text-blue-400 font-black text-lg">{formatTime(timeLeft)}</span>
            </div>

            {/* XP Breakdown */}
            {earnedXP && (
              <div className="border-t border-white/10 pt-3 mt-1">
                <p className="text-purple-300 text-xs font-black uppercase tracking-widest mb-2">⭐ XP Nhận Được</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50 font-semibold">Từ đúng ({solvedWords.size} × 3)</span>
                    <span className="text-white/80 font-black">+{earnedXP.wordsXP}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50 font-semibold">Hoàn thành puzzle</span>
                    <span className="text-white/80 font-black">+{earnedXP.completionXP}</span>
                  </div>
                  {earnedXP.noHintXP > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-400/70 font-semibold">🛡️ Không dùng hint</span>
                      <span className="text-green-400 font-black">+{earnedXP.noHintXP}</span>
                    </div>
                  )}
                  {earnedXP.speedXP > 0 && (
                    <div className="flex justify-between">
                      <span className="text-cyan-400/70 font-semibold">⚡ Tốc độ {'<'} 2 phút</span>
                      <span className="text-cyan-400 font-black">+{earnedXP.speedXP}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-white/5">
                    <span className="text-purple-300 font-black">Tổng XP</span>
                    <span className="text-purple-300 font-black text-sm">+{earnedXP.total}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Coin Breakdown */}
            {earnedCoins && (
              <div className="border-t border-white/10 pt-3 mt-1">
                <p className="text-amber-300 text-xs font-black uppercase tracking-widest mb-2">💰 Coin Nhận Được</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50 font-semibold">Từ đúng ({solvedWords.size} × 5)</span>
                    <span className="text-white/80 font-black">+{earnedCoins.wordCoins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50 font-semibold">Hoàn thành puzzle</span>
                    <span className="text-white/80 font-black">+{earnedCoins.completionCoins}</span>
                  </div>
                  {earnedCoins.perfectBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-yellow-400/70 font-semibold">🏆 Bonus 100%</span>
                      <span className="text-yellow-400 font-black">+{earnedCoins.perfectBonus}</span>
                    </div>
                  )}
                  {earnedCoins.hintsSpent > 0 && (
                    <div className="flex justify-between">
                      <span className="text-red-400/70 font-semibold">💡 Chi phí hint</span>
                      <span className="text-red-400 font-black">-{earnedCoins.hintsSpent}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-white/5">
                    <span className="text-amber-300 font-black">Tổng Coin</span>
                    <span className={`font-black text-sm ${earnedCoins.total >= 0 ? 'text-amber-300' : 'text-red-400'}`}>{earnedCoins.total >= 0 ? '+' : ''}{earnedCoins.total}</span>
                  </div>
                </div>
              </div>
            )}

            {isP2P && (
              <>
                <div className="border-t border-white/10 pt-3 mt-3">
                  <p className="text-white/50 text-xs font-bold mb-2">SO SÁNH</p>
                  <ProgressBar label={myProfile?.nickname || 'Bạn'} percent={myPercent} color="#3b82f6" avatar={(myProfile?.nickname || 'B')[0]} />
                  <div className="h-1.5" />
                  <ProgressBar label={opponentProfile?.nickname || 'Đối thủ'} percent={opponentPercent} color="#ef4444" avatar={(opponentProfile?.nickname || 'Đ')[0]} />
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div className="w-full flex flex-col gap-2.5">
            {isSolo && (
              <>
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96, y: 3 }}
                  onClick={handleReplay}
                  className="w-full py-3 rounded-2xl font-black text-base text-white relative overflow-hidden"
                  style={{ background: 'linear-gradient(180deg, #f59e0b, #d97706)', border: '3px solid #b45309', boxShadow: '0 5px 0 #92400e' }}>
                  <span className="absolute inset-0 w-full h-1/2 bg-white/15 pointer-events-none" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    🔄 Chơi Lại <span className="text-xs font-bold opacity-70">(+2💰/từ)</span>
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96, y: 3 }}
                  onClick={handleNewGame}
                  className="w-full py-3 rounded-2xl font-black text-base text-white relative overflow-hidden"
                  style={{ background: 'linear-gradient(180deg, #10b981, #059669)', border: '3px solid #047857', boxShadow: '0 5px 0 #047857' }}>
                  <span className="absolute inset-0 w-full h-1/2 bg-white/15 pointer-events-none" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    🆕 Chơi Mới
                  </span>
                </motion.button>
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96, y: 3 }}
              onClick={onLeaveGame}
              className="w-full py-3 rounded-2xl font-black text-base text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(180deg, #3b82f6, #1e40af)', border: '3px solid #1e3a8a', boxShadow: '0 5px 0 #1e3a8a' }}>
              <span className="absolute inset-0 w-full h-1/2 bg-white/15 pointer-events-none" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                <ArrowLeft size={18} /> Về Menu
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── PLAYING SCREEN ──
  const isP2P = opponentProgress != null;
  const acrossClues = puzzle.words.filter(w => w.direction === 'across');
  const downClues = puzzle.words.filter(w => w.direction === 'down');

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden select-none"
      style={{ ...BG_STYLE }}>
      {/* Dark overlay */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'rgba(10,15,30,0.70)' }} />

      {/* Hidden input for physical keyboard + IME — inputMode="none" prevents native mobile keyboard */}
      <input
        ref={hiddenInputRef}
        onInput={onHiddenInput}
        onKeyDown={onHiddenKeyDown}
        inputMode="none"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 1,
          height: 1,
          left: -9999,
          top: 0,
          zIndex: -1,
        }}
      />

      {/* ── HEADER ── */}
      <div className="relative z-10 flex-shrink-0 flex items-center gap-2 px-3 py-2"
        style={{ background: '#1e3a8a', borderBottom: '3px solid #172554' }}>

        {/* Quit */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setConfirmQuit(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)' }}>
          <ArrowLeft size={16} className="text-white" />
        </motion.button>

        {/* Title */}
        <span className="font-black text-white text-sm md:text-base flex-1 truncate" style={{ textShadow: '0 1px 0 #172554' }}>
          Ô Chữ
        </span>

        {/* Timer */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full font-black text-xs"
          style={{
            background: timeLeft <= 30 ? 'rgba(239,68,68,0.3)' : 'rgba(0,0,0,0.4)',
            border: `2px solid ${timeLeft <= 30 ? '#ef4444' : 'rgba(255,255,255,0.2)'}`,
            color: timeLeft <= 30 ? '#fca5a5' : '#93c5fd',
          }}>
          <Clock size={13} />
          {formatTime(timeLeft)}
        </div>

        {/* Score */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full font-black text-xs text-amber-200"
          style={{ background: 'rgba(0,0,0,0.4)', border: '2px solid rgba(251,191,36,0.3)' }}>
          <Star size={13} className="text-amber-400" />
          {score}
        </div>

        {/* Check button */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleCheckAll}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-black text-xs text-white"
          style={{ background: 'linear-gradient(180deg, #10b981, #059669)', border: '2px solid #047857', boxShadow: '0 2px 0 #047857' }}>
          <Check size={13} /> Kiểm tra
        </motion.button>
      </div>

      {/* ── P2P PROGRESS ── */}
      {isP2P && (
        <div className="relative z-10 flex-shrink-0 px-3 py-2 flex gap-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <ProgressBar label={myProfile?.nickname || 'Bạn'} percent={myPercent} color="#3b82f6" avatar={(myProfile?.nickname || 'B')[0]} />
          <ProgressBar label={opponentProfile?.nickname || 'Đối thủ'} percent={opponentPercent} color="#ef4444" avatar={(opponentProfile?.nickname || 'Đ')[0]} />
        </div>
      )}

      {/* ── BODY ── */}
      {/* Landscape: row layout (grid | right-pane), Portrait: column layout (grid then keyboard) */}
      <div className={`relative z-10 flex-1 min-h-0 flex gap-2 p-2 ${isLandscape ? 'flex-row' : 'flex-col'}`}>

        {/* ── GRID ── */}
        <div ref={gridContainerRef}
          className={`overflow-auto ${
            isLandscape ? 'flex-1 min-w-0 min-h-0' : 'flex-1 min-h-0'
          }`}>
          <div ref={gridRef} className="grid gap-[2px] px-2"
            style={{
              gridTemplateColumns: `repeat(${puzzle.gridSize.cols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${puzzle.gridSize.rows}, ${cellSize}px)`,
              width: 'fit-content',
              margin: isLandscape ? 'auto' : '0 auto',
              paddingTop: isLandscape ? 10 : 12,
              paddingBottom: isLandscape ? 10 : 12,
            }}>
            {Array.from({ length: puzzle.gridSize.rows }).map((_, r) =>
              Array.from({ length: puzzle.gridSize.cols }).map((_, c) => {
                const cell = gridMap[r][c];
                if (!cell.isCell) {
                  return <div key={`${r}-${c}`} style={{ width: cellSize, height: cellSize, background: 'transparent' }} />;
                }

                const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                const isInActiveWord = activeWordCells.some(ac => ac.row === r && ac.col === c);
                const cellWordIds = cell.wordIds;
                const isSolved = cellWordIds.some(wid => solvedWords.has(wid));
                const isWrong = cellWordIds.some(wid => wrongWords.has(wid));

                // Glossy gradient backgrounds
                let bg, border, shadow;
                if (isSelected) {
                  bg = 'linear-gradient(180deg, #fde68a 0%, #fbbf24 40%, #f59e0b 100%)';
                  border = '2px solid #d97706';
                  shadow = '0 3px 0 #b45309, 0 5px 10px rgba(245,158,11,0.4), inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(0,0,0,0.08)';
                } else if (isSolved) {
                  bg = 'linear-gradient(180deg, #86efac 0%, #4ade80 40%, #22c55e 100%)';
                  border = '2px solid #16a34a';
                  shadow = '0 3px 0 #15803d, 0 5px 10px rgba(34,197,94,0.35), inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(0,0,0,0.08)';
                } else if (isWrong) {
                  bg = 'linear-gradient(180deg, #fca5a5 0%, #f87171 40%, #ef4444 100%)';
                  border = '2px solid #dc2626';
                  shadow = '0 3px 0 #b91c1c, 0 5px 10px rgba(239,68,68,0.35), inset 0 1px 2px rgba(255,255,255,0.45), inset 0 -1px 1px rgba(0,0,0,0.08)';
                } else if (isInActiveWord) {
                  bg = 'linear-gradient(180deg, #dbeafe 0%, #bfdbfe 40%, #93c5fd 100%)';
                  border = '2px solid #60a5fa';
                  shadow = '0 3px 0 #3b82f6, 0 5px 10px rgba(59,130,246,0.25), inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(0,0,0,0.05)';
                } else {
                  bg = 'linear-gradient(180deg, #ffffff 0%, #f8fafc 40%, #e2e8f0 100%)';
                  border = '1px solid rgba(0,0,0,0.12)';
                  shadow = '0 3px 0 rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -1px 1px rgba(0,0,0,0.04)';
                }

                return (
                  <motion.div
                    key={`${r}-${c}`}
                    onClick={() => selectCell(r, c)}
                    whileTap={{ scale: 0.92 }}
                    className="relative flex items-center justify-center cursor-pointer overflow-hidden"
                    style={{
                      width: cellSize, height: cellSize,
                      background: bg,
                      border,
                      borderRadius: 8,
                      boxShadow: shadow,
                      transition: 'all 0.18s ease',
                    }}>
                    {/* Cell number */}
                    {cell.cellNum && (
                      <span className="absolute font-black text-blue-800/70 leading-none"
                        style={{ fontSize: Math.max(8, cellSize * 0.26), top: 1, left: 2 }}>
                        {cell.cellNum}
                      </span>
                    )}
                    {/* Letter */}
                    <span className="font-black leading-none"
                      style={{
                        fontSize: Math.max(10, cellSize * 0.48),
                        color: isSolved ? '#15803d' : isWrong ? '#dc2626' : '#1e293b',
                      }}>
                      {userGrid[r][c] || ''}
                    </span>
                    {/* Solved check */}
                    {isSolved && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute text-green-500"
                        style={{ fontSize: Math.max(7, cellSize * 0.25), bottom: 0, right: 1 }}>✓</motion.span>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANE (landscape: hints + clues stacked vertically) ── */}
        {isLandscape ? (
          <div className="flex-shrink-0 flex flex-col gap-2" style={{ width: 220 }}>
            {/* Hint buttons */}
            {isSolo && (
              <div className="flex flex-col gap-2">
                <motion.button whileTap={{ scale: 0.93, y: 2 }}
                  onClick={handleRevealLetter}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs text-white relative overflow-hidden w-full"
                  style={{ background: 'linear-gradient(180deg, #06b6d4, #0891b2)', border: '2px solid #0e7490', boxShadow: '0 3px 0 #0e7490' }}>
                  <span className="absolute inset-0 w-full h-1/2 bg-white/15 pointer-events-none" />
                  <Eye size={13} className="relative z-10" />
                  <span className="relative z-10">Mở 1 chữ</span>
                  <span className="relative z-10 text-amber-300 text-[10px] font-bold ml-auto">20💰</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.93, y: 2 }}
                  onClick={handleRevealWord}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs text-white relative overflow-hidden w-full"
                  style={{ background: 'linear-gradient(180deg, #f59e0b, #d97706)', border: '2px solid #b45309', boxShadow: '0 3px 0 #92400e' }}>
                  <span className="absolute inset-0 w-full h-1/2 bg-white/15 pointer-events-none" />
                  <Lightbulb size={13} className="relative z-10" />
                  <span className="relative z-10">Mở cả từ</span>
                  <span className="relative z-10 text-white/80 text-[10px] font-bold ml-auto">50💰</span>
                </motion.button>
              </div>
            )}
            {/* Clues */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded-xl p-2 space-y-2 scrollbar-hide"
              style={{ background: '#0f1b2d', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div>
                <p className="text-amber-400 font-black text-[10px] uppercase tracking-widest mb-1 px-1">→ Ngang</p>
                {acrossClues.map(w => {
                  const solved = solvedWords.has(w.id);
                  const wrong = wrongWords.has(w.id);
                  const active = activeWordId === w.id;
                  return (
                    <motion.button key={w.id}
                      onClick={() => selectWordFromClue(w.id)}
                      className={`w-full text-left px-2 py-1 rounded-lg text-[10px] transition-colors mb-0.5 flex items-center gap-1
                        ${active ? 'bg-amber-500/20' : solved ? 'bg-green-500/10' : wrong ? 'bg-red-500/10' : 'hover:bg-white/5'}`}
                      style={{ border: active ? '1px solid rgba(245,158,11,0.4)' : solved ? '1px solid rgba(34,197,94,0.3)' : wrong ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent' }}>
                      <span className={`font-black mr-1 ${solved ? 'text-green-400' : wrong ? 'text-red-400' : 'text-amber-300'}`}>{w.num}.</span>
                      <span className={`font-semibold flex-1 ${solved ? 'text-green-300/70 line-through' : wrong ? 'text-red-300/80' : 'text-white/80'}`}>{w.clue}</span>
                      {solved && <span className="text-green-400 text-xs font-black shrink-0">✓</span>}
                      {wrong && <span className="text-red-400 text-xs font-black shrink-0">✗</span>}
                    </motion.button>
                  );
                })}
              </div>
              <div>
                <p className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-1 px-1">↓ Dọc</p>
                {downClues.map(w => {
                  const solved = solvedWords.has(w.id);
                  const wrong = wrongWords.has(w.id);
                  const active = activeWordId === w.id;
                  return (
                    <motion.button key={w.id}
                      onClick={() => selectWordFromClue(w.id)}
                      className={`w-full text-left px-2 py-1 rounded-lg text-[10px] transition-colors mb-0.5 flex items-center gap-1
                        ${active ? 'bg-blue-500/20' : solved ? 'bg-green-500/10' : wrong ? 'bg-red-500/10' : 'hover:bg-white/5'}`}
                      style={{ border: active ? '1px solid rgba(59,130,246,0.4)' : solved ? '1px solid rgba(34,197,94,0.3)' : wrong ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent' }}>
                      <span className={`font-black mr-1 ${solved ? 'text-green-400' : wrong ? 'text-red-400' : 'text-blue-300'}`}>{w.num}.</span>
                      <span className={`font-semibold flex-1 ${solved ? 'text-green-300/70 line-through' : wrong ? 'text-red-300/80' : 'text-white/80'}`}>{w.clue}</span>
                      {solved && <span className="text-green-400 text-xs font-black shrink-0">✓</span>}
                      {wrong && <span className="text-red-400 text-xs font-black shrink-0">✗</span>}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Portrait: hints as a row above clues, clues in a short panel */
          <div className="flex-shrink-0 flex flex-col gap-2" style={{ maxHeight: '38vh' }}>
            {/* Hint buttons row */}
            {isSolo && (
              <div className="flex gap-2 flex-shrink-0">
                <motion.button whileTap={{ scale: 0.93, y: 2 }}
                  onClick={handleRevealLetter}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs text-white relative overflow-hidden"
                  style={{ background: 'linear-gradient(180deg, #06b6d4, #0891b2)', border: '2px solid #0e7490', boxShadow: '0 3px 0 #0e7490' }}>
                  <span className="absolute inset-0 w-full h-1/2 bg-white/15 pointer-events-none" />
                  <Eye size={13} className="relative z-10" />
                  <span className="relative z-10">Mở 1 chữ</span>
                  <span className="relative z-10 text-amber-300 text-[10px] font-bold">20💰</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.93, y: 2 }}
                  onClick={handleRevealWord}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs text-white relative overflow-hidden"
                  style={{ background: 'linear-gradient(180deg, #f59e0b, #d97706)', border: '2px solid #b45309', boxShadow: '0 3px 0 #92400e' }}>
                  <span className="absolute inset-0 w-full h-1/2 bg-white/15 pointer-events-none" />
                  <Lightbulb size={13} className="relative z-10" />
                  <span className="relative z-10">Mở cả từ</span>
                  <span className="relative z-10 text-white/80 text-[10px] font-bold">50💰</span>
                </motion.button>
              </div>
            )}
            {/* Clues panel — short, scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded-xl p-2 space-y-2 scrollbar-hide"
              style={{ background: '#0f1b2d', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-amber-400 font-black text-[10px] uppercase tracking-widest mb-1 px-1">→ Ngang</p>
                  {acrossClues.map(w => {
                    const solved = solvedWords.has(w.id);
                    const wrong = wrongWords.has(w.id);
                    const active = activeWordId === w.id;
                    return (
                      <motion.button key={w.id}
                        onClick={() => selectWordFromClue(w.id)}
                        className={`w-full text-left px-2 py-1 rounded-lg text-[10px] transition-colors mb-0.5 flex items-center gap-1
                          ${active ? 'bg-amber-500/20' : solved ? 'bg-green-500/10' : wrong ? 'bg-red-500/10' : 'hover:bg-white/5'}`}
                        style={{ border: active ? '1px solid rgba(245,158,11,0.4)' : solved ? '1px solid rgba(34,197,94,0.3)' : wrong ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent' }}>
                        <span className={`font-black mr-1 ${solved ? 'text-green-400' : wrong ? 'text-red-400' : 'text-amber-300'}`}>{w.num}.</span>
                        <span className={`font-semibold flex-1 ${solved ? 'text-green-300/70 line-through' : wrong ? 'text-red-300/80' : 'text-white/80'}`}>{w.clue}</span>
                        {solved && <span className="text-green-400 text-xs font-black shrink-0">✓</span>}
                        {wrong && <span className="text-red-400 text-xs font-black shrink-0">✗</span>}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex-1">
                  <p className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-1 px-1">↓ Dọc</p>
                  {downClues.map(w => {
                    const solved = solvedWords.has(w.id);
                    const wrong = wrongWords.has(w.id);
                    const active = activeWordId === w.id;
                    return (
                      <motion.button key={w.id}
                        onClick={() => selectWordFromClue(w.id)}
                        className={`w-full text-left px-2 py-1 rounded-lg text-[10px] transition-colors mb-0.5 flex items-center gap-1
                          ${active ? 'bg-blue-500/20' : solved ? 'bg-green-500/10' : wrong ? 'bg-red-500/10' : 'hover:bg-white/5'}`}
                        style={{ border: active ? '1px solid rgba(59,130,246,0.4)' : solved ? '1px solid rgba(34,197,94,0.3)' : wrong ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent' }}>
                        <span className={`font-black mr-1 ${solved ? 'text-green-400' : wrong ? 'text-red-400' : 'text-blue-300'}`}>{w.num}.</span>
                        <span className={`font-semibold flex-1 ${solved ? 'text-green-300/70 line-through' : wrong ? 'text-red-300/80' : 'text-white/80'}`}>{w.clue}</span>
                        {solved && <span className="text-green-400 text-xs font-black shrink-0">✓</span>}
                        {wrong && <span className="text-red-400 text-xs font-black shrink-0">✗</span>}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── VIRTUAL KEYBOARD (portrait only) ── */}
      {!isLandscape && (
        <div className="relative z-10 flex-shrink-0 px-2 pb-2">
          <VirtualKeyboard onKey={handleLetterInput} onBackspace={handleBackspace} compact />
        </div>
      )}

      {/* ── QUIT CONFIRM ── */}
      <AnimatePresence>
        {confirmQuit && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="rounded-3xl p-6 max-w-sm w-full text-center space-y-4"
              style={{ background: 'linear-gradient(180deg, #1e293b, #0f172a)', border: '3px solid rgba(255,255,255,0.15)' }}>
              <p className="text-white font-black text-xl">Thoát game?</p>
              <p className="text-white/60 text-sm">Tiến trình sẽ không được lưu</p>
              <div className="flex gap-3">
                <motion.button whileTap={{ scale: 0.95, y: 2 }}
                  onClick={() => setConfirmQuit(false)}
                  className="flex-1 py-3 rounded-xl font-black text-white"
                  style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)' }}>
                  Ở lại
                </motion.button>
                <motion.button whileTap={{ scale: 0.95, y: 2 }}
                  onClick={onLeaveGame}
                  className="flex-1 py-3 rounded-xl font-black text-white"
                  style={{ background: 'linear-gradient(180deg, #ef4444, #b91c1c)', border: '2px solid #991b1b', boxShadow: '0 3px 0 #7f1d1d' }}>
                  Thoát
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CrosswordGame;
