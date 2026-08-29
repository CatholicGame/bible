/**
 * Question Manager — Quản lý rút câu hỏi ngẫu nhiên từ 1500 câu
 *
 * Mỗi ván chơi = 15 câu hỏi (1 câu mỗi level, tăng dần độ khó)
 * Đảm bảo không lặp lại câu đã trả lời (dựa trên answeredIds từ PlayFab)
 */

// Static imports — bundled cùng app
import level01 from '../data/level_01.json';
import level02 from '../data/level_02.json';
import level03 from '../data/level_03.json';
import level04 from '../data/level_04.json';
import level05 from '../data/level_05.json';
import level06 from '../data/level_06.json';
import level07 from '../data/level_07.json';
import level08 from '../data/level_08.json';
import level09 from '../data/level_09.json';
import level10 from '../data/level_10.json';
import level11 from '../data/level_11.json';
import level12 from '../data/level_12.json';
import level13 from '../data/level_13.json';
import level14 from '../data/level_14.json';
import level15 from '../data/level_15.json';

// All 15 levels in order
const ALL_LEVELS = [
  level01, level02, level03, level04, level05,
  level06, level07, level08, level09, level10,
  level11, level12, level13, level14, level15,
];

/**
 * Convert raw JSON format → game format
 * JSON:  { id, question, opt_a, opt_b, opt_c, opt_d, correct_ans, explanation, category }
 * Game:  { id, question, options: [a,b,c,d], answer, explanation }
 */
export function toGameFormat(raw) {
  return {
    id: raw.id,
    question: raw.question,
    options: [raw.opt_a, raw.opt_b, raw.opt_c, raw.opt_d],
    answer: raw.correct_ans,
    explanation: raw.explanation,
  };
}

/**
 * Fisher-Yates shuffle (in-place)
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Rút 1 câu hỏi ngẫu nhiên từ 1 level, loại trừ đã trả lời.
 * Nếu tất cả câu trong level đã trả lời → reset pool (cho phép lặp lại level đó).
 *
 * @param {Array} levelQuestions - Mảng câu hỏi raw của level
 * @param {Set} answeredSet - Set chứa các ID đã trả lời
 * @returns {{ question: object, poolWasReset: boolean }}
 */
function pickFromLevel(levelQuestions, answeredSet) {
  // Lọc ra câu chưa trả lời
  let available = levelQuestions.filter(q => !answeredSet.has(q.id));

  let poolWasReset = false;

  // Nếu hết pool → reset level này
  if (available.length === 0) {
    available = [...levelQuestions];
    poolWasReset = true;
  }

  // Random pick
  const randomIndex = Math.floor(Math.random() * available.length);
  return {
    question: available[randomIndex],
    poolWasReset,
  };
}

/**
 * Rút 15 câu hỏi cho 1 ván chơi (1 câu mỗi level).
 * Loại trừ các câu đã trả lời.
 *
 * @param {string[]} answeredIds - Mảng ID các câu đã trả lời (từ PlayFab)
 * @returns {{ questions: object[], resetLevels: number[] }}
 *   - questions: 15 câu hỏi ở game format
 *   - resetLevels: các level đã phải reset pool (thông tin)
 */
export function getQuestionsForGame(answeredIds = []) {
  const answeredSet = new Set(answeredIds);
  const questions = [];
  const resetLevels = [];

  for (let i = 0; i < ALL_LEVELS.length; i++) {
    const { question, poolWasReset } = pickFromLevel(ALL_LEVELS[i], answeredSet);
    questions.push(toGameFormat(question));
    if (poolWasReset) resetLevels.push(i + 1);
  }

  return { questions, resetLevels };
}

/**
 * Lấy thống kê tổng quan
 * @param {string[]} answeredIds
 * @returns {{ total: number, answered: number, byLevel: Array<{level:number, total:number, answered:number}> }}
 */
export function getQuestionStats(answeredIds = []) {
  const answeredSet = new Set(answeredIds);
  let total = 0;
  let answered = 0;
  const byLevel = [];

  for (let i = 0; i < ALL_LEVELS.length; i++) {
    const levelQuestions = ALL_LEVELS[i];
    const levelAnswered = levelQuestions.filter(q => answeredSet.has(q.id)).length;
    total += levelQuestions.length;
    answered += levelAnswered;
    byLevel.push({
      level: i + 1,
      total: levelQuestions.length,
      answered: levelAnswered,
    });
  }

  return { total, answered, byLevel };
}
