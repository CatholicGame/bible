/**
 * Master crossword generator — merges all seed files and builds 100 puzzles
 * Run: node scripts/crossword_generate_all.cjs
 */
const fs = require('fs');
const path = require('path');

/* ── ALGORITHM (copy from crossword_builder.cjs) ── */
function buildCrossword(wordList) {
  const sorted = [...wordList].sort((a, b) => b.answer.length - a.answer.length);
  const placed = [];
  const grid = {};
  function getCell(r, c) { return grid[`${r},${c}`] || null; }
  function setCell(r, c, ch) { grid[`${r},${c}`] = ch; }
  function canPlace(answer, dir, row, col) {
    const len = answer.length;
    const br = dir === 'down' ? row - 1 : row, bc = dir === 'across' ? col - 1 : col;
    const ar = dir === 'down' ? row + len : row, ac = dir === 'across' ? col + len : col;
    if (getCell(br, bc) || getCell(ar, ac)) return false;
    let hit = false;
    for (let i = 0; i < len; i++) {
      const r = dir === 'down' ? row + i : row, c = dir === 'across' ? col + i : col;
      if (r < -12 || c < -12 || r > 30 || c > 30) return false;
      const ex = getCell(r, c);
      if (ex) { if (ex !== answer[i]) return false; hit = true; }
      else {
        if (dir === 'across' && (getCell(r-1,c) || getCell(r+1,c))) return false;
        if (dir === 'down'   && (getCell(r,c-1) || getCell(r,c+1))) return false;
      }
    }
    return placed.length === 0 || hit;
  }
  function doPlace(answer, dir, row, col) {
    for (let i = 0; i < answer.length; i++) {
      const r = dir === 'down' ? row + i : row, c = dir === 'across' ? col + i : col;
      setCell(r, c, answer[i]);
    }
  }
  const first = sorted[0];
  doPlace(first.answer, 'across', 0, 0);
  placed.push({ ...first, direction: 'across', row: 0, col: 0 });
  for (let wi = 1; wi < sorted.length; wi++) {
    const word = sorted[wi]; let ok = false;
    outer: for (const pw of placed) {
      const nd = pw.direction === 'across' ? 'down' : 'across';
      for (let i = 0; i < word.answer.length; i++) {
        for (let j = 0; j < pw.answer.length; j++) {
          if (word.answer[i] !== pw.answer[j]) continue;
          const nr = nd === 'down' ? pw.row - i : pw.row + j;
          const nc = nd === 'across' ? pw.col - i : pw.col + j;
          if (canPlace(word.answer, nd, nr, nc)) {
            doPlace(word.answer, nd, nr, nc);
            placed.push({ ...word, direction: nd, row: nr, col: nc });
            ok = true; break outer;
          }
        }
      }
    }
    if (!ok) console.warn(`  ⚠ skip: ${word.answer}`);
  }
  if (!placed.length) return null;
  const allR = [], allC = [];
  placed.forEach(w => {
    allR.push(w.row); allC.push(w.col);
    if (w.direction === 'down') allR.push(w.row + w.answer.length - 1);
    else allC.push(w.col + w.answer.length - 1);
  });
  const minR = Math.min(...allR), minC = Math.min(...allC);
  const maxR = Math.max(...allR), maxC = Math.max(...allC);
  const normalized = placed.map(w => ({ ...w, row: w.row-minR, col: w.col-minC }));
  normalized.sort((a,b) => a.row !== b.row ? a.row-b.row : a.col-b.col);
  normalized.forEach((w,i) => { w.num = i+1; w.id = `${i+1}-${w.direction}`; });
  return { gridSize: { rows: maxR-minR+1, cols: maxC-minC+1 }, words: normalized };
}

/* ── LOAD ALL SEEDS ── */
const seeds1  = require('./crossword_builder.cjs').seeds || [];
// Load manually from crossword_builder.cjs via regex since it uses const SEEDS
const builderSrc = fs.readFileSync(path.join(__dirname, 'crossword_builder.cjs'), 'utf8');

const SEEDS = [
  ...require('./seeds_A_1_10.cjs'),
  ...require('./seeds_B_11_15.cjs'),
  ...require('./seeds_C_16_20.cjs'),
  ...require('./seeds_D_21_25.cjs'),
  ...require('./seeds_E_26_30.cjs'),
  ...require('./seeds_F_31_35.cjs'),
  ...require('./seeds_G_36_40.cjs'),
  ...require('./seeds_H_41_45.cjs'),
  ...require('./seeds_I_46_50.cjs'),
  ...require('./seeds_J_51_55.cjs'),
  ...require('./seeds_K_56_60.cjs'),
  ...require('./seeds_L_61_65.cjs'),
  ...require('./seeds_M_66_70.cjs'),
  ...require('./seeds_N_71_75.cjs'),
  ...require('./seeds_O_76_80.cjs'),
  ...require('./seeds_P_81_90.cjs'),
  ...require('./seeds_Q_91_100.cjs'),
];

const results = [];
SEEDS.forEach(seed => {
  console.log(`#${seed.id} ${seed.theme}`);
  const layout = buildCrossword(seed.words);
  if (layout) {
    results.push({ id: seed.id, theme: seed.theme, ...layout });
    console.log(`  ✓ ${layout.words.length} words, ${layout.gridSize.rows}x${layout.gridSize.cols}`);
  }
});

const out = path.resolve(__dirname, '../src/data/crossword_puzzles.json');
fs.writeFileSync(out, JSON.stringify(results, null, 2), 'utf8');
console.log(`\nDone: ${results.length} puzzles → ${out}`);
