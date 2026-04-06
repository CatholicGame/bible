/**
 * validate_puzzles.cjs
 * Phát hiện các từ nằm ngoài gridSize trong crossword_puzzles.json
 * Run: node scripts/validate_puzzles.cjs
 */
const fs = require('fs');
const path = require('path');

const jsonPath = path.resolve(__dirname, '../src/data/crossword_puzzles.json');
const puzzles = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let totalBad = 0;
let badPuzzles = [];

puzzles.forEach(p => {
  const { rows, cols } = p.gridSize;
  const badWords = [];

  p.words.forEach(w => {
    const len = w.answer.length;
    let maxRow = w.row, maxCol = w.col;
    if (w.direction === 'across') maxCol = w.col + len - 1;
    else maxRow = w.row + len - 1;

    if (maxRow >= rows || maxCol >= cols) {
      badWords.push({
        answer: w.answer,
        direction: w.direction,
        row: w.row, col: w.col,
        len,
        maxRow, maxCol,
        gridRows: rows, gridCols: cols,
        overflowRow: maxRow >= rows ? `row ${maxRow} >= ${rows}` : null,
        overflowCol: maxCol >= cols ? `col ${maxCol} >= ${cols}` : null,
      });
    }
  });

  if (badWords.length > 0) {
    totalBad += badWords.length;
    badPuzzles.push({ id: p.id, theme: p.theme, gridSize: p.gridSize, badWords });
  }
});

if (totalBad === 0) {
  console.log('✅ All puzzles OK — no out-of-bounds words found.');
} else {
  console.log(`❌ Found ${totalBad} out-of-bounds word(s) in ${badPuzzles.length} puzzle(s):\n`);
  badPuzzles.forEach(bp => {
    console.log(`  Puzzle #${bp.id} "${bp.theme}" [grid ${bp.gridSize.rows}x${bp.gridSize.cols}]:`);
    bp.badWords.forEach(bw => {
      const overflow = [bw.overflowRow, bw.overflowCol].filter(Boolean).join(', ');
      console.log(`    ⚠ "${bw.answer}" (${bw.direction}, r=${bw.row}, c=${bw.col}, len=${bw.len}) → OVERFLOW: ${overflow}`);
    });
  });
}
