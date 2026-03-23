/**
 * check_duplicates.js
 * Kiểm tra câu hỏi trùng lặp giữa các level trong Bible Quiz Game
 * 
 * Chạy: node scripts/check_duplicates.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../src/data');

// ─── 1. Đọc tất cả level files ────────────────────────────────────────────────
function loadAllLevels() {
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => /^level_\d+\.json$/.test(f))
    .sort();

  const levels = {};
  for (const file of files) {
    const levelName = file.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
    levels[levelName] = data;
  }
  return levels;
}

// ─── 2. Normalize câu hỏi để so sánh ─────────────────────────────────────────
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[\s\u00a0]+/g, ' ')   // chuẩn hóa khoảng trắng
    .replace(/[?!.,;:'"]/g, '')     // bỏ dấu câu
    .trim();
}

// ─── 3. Kiểm tra trùng ID ─────────────────────────────────────────────────────
function checkDuplicateIds(levels) {
  const seen = {};         // id → level
  const duplicates = [];

  for (const [level, questions] of Object.entries(levels)) {
    for (const q of questions) {
      if (seen[q.id]) {
        duplicates.push({
          id: q.id,
          level1: seen[q.id],
          level2: level,
        });
      } else {
        seen[q.id] = level;
      }
    }
  }
  return duplicates;
}

// ─── 4. Kiểm tra trùng NỘI DUNG câu hỏi ──────────────────────────────────────
function checkDuplicateQuestions(levels) {
  const seen = {};         // normalized question → {level, id}
  const duplicates = [];

  for (const [level, questions] of Object.entries(levels)) {
    for (const q of questions) {
      const key = normalize(q.question);
      if (seen[key]) {
        duplicates.push({
          question: q.question,
          occurrence1: seen[key],
          occurrence2: { level, id: q.id },
        });
      } else {
        seen[key] = { level, id: q.id };
      }
    }
  }
  return duplicates;
}

// ─── 5. Kiểm tra trùng ĐÁP ÁN (câu khác nhau nhưng đáp án giống hệt) ────────
function checkSimilarAnswers(levels) {
  // So sánh tất cả 4 đáp án cùng một lúc — nếu 4/4 đáp án giống nhau thì coi là trùng
  const seen = {};
  const duplicates = [];

  for (const [level, questions] of Object.entries(levels)) {
    for (const q of questions) {
      const answerKey = [q.opt_a, q.opt_b, q.opt_c, q.opt_d]
        .map(normalize)
        .sort()
        .join('|');

      if (seen[answerKey]) {
        duplicates.push({
          note: 'Bộ đáp án giống nhau (câu hỏi khác)',
          q1: { level: seen[answerKey].level, id: seen[answerKey].id, question: seen[answerKey].question },
          q2: { level, id: q.id, question: q.question },
        });
      } else {
        seen[answerKey] = { level, id: q.id, question: q.question };
      }
    }
  }
  return duplicates;
}

// ─── 6. Báo cáo thống kê ──────────────────────────────────────────────────────
function printStats(levels) {
  console.log('\n📊 THỐNG KÊ CÂU HỎI THEO LEVEL');
  console.log('─'.repeat(40));
  let total = 0;
  for (const [level, questions] of Object.entries(levels)) {
    console.log(`  ${level}: ${questions.length} câu`);
    total += questions.length;
  }
  console.log('─'.repeat(40));
  console.log(`  TỔNG: ${total} câu\n`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
function main() {
  console.log('🔍 Bible Quiz — Kiểm Tra Trùng Lặp Câu Hỏi\n');

  const levels = loadAllLevels();
  printStats(levels);

  // --- Kiểm tra ID trùng ---
  const dupIds = checkDuplicateIds(levels);
  if (dupIds.length === 0) {
    console.log('✅ Không có ID trùng lặp');
  } else {
    console.log(`❌ Tìm thấy ${dupIds.length} ID trùng lặp:`);
    for (const d of dupIds) {
      console.log(`   • ID "${d.id}" xuất hiện ở ${d.level1} và ${d.level2}`);
    }
  }

  // --- Kiểm tra câu hỏi trùng ---
  const dupQ = checkDuplicateQuestions(levels);
  if (dupQ.length === 0) {
    console.log('✅ Không có câu hỏi trùng nội dung');
  } else {
    console.log(`\n❌ Tìm thấy ${dupQ.length} câu hỏi trùng nội dung:`);
    for (const d of dupQ) {
      console.log(`\n   • "${d.question}"`);
      console.log(`     → ${d.occurrence1.level} (${d.occurrence1.id})`);
      console.log(`     → ${d.occurrence2.level} (${d.occurrence2.id})`);
    }
  }

  // --- Kiểm tra bộ đáp án trùng ---
  const dupAns = checkSimilarAnswers(levels);
  const realDupAns = dupAns.filter(d => normalize(d.q1.question) !== normalize(d.q2.question));
  if (realDupAns.length === 0) {
    console.log('✅ Không có bộ đáp án bị trùng lặp giữa các câu khác nhau');
  } else {
    console.log(`\n⚠️  ${realDupAns.length} cặp câu hỏi khác nhau nhưng có bộ 4 đáp án giống hệt:`);
    for (const d of realDupAns.slice(0, 10)) {
      console.log(`\n   Q1 [${d.q1.level}/${d.q1.id}]: "${d.q1.question}"`);
      console.log(`   Q2 [${d.q2.level}/${d.q2.id}]: "${d.q2.question}"`);
    }
  }

  console.log('\n─'.repeat(40));
  const hasIssues = dupIds.length > 0 || dupQ.length > 0 || realDupAns.length > 0;
  if (!hasIssues) {
    console.log('🎉 Tất cả data đều sạch — không có trùng lặp!');
  } else {
    console.log('⚠️  Cần xử lý các vấn đề trùng lặp nêu trên trước khi release.');
  }
}

main();
