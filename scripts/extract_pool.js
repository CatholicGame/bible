const fs = require('fs');
const path = require('path');

const dataDir = path.join('e:\\ManC\\bible\\src\\data');
const level03Path = path.join(dataDir, 'level_03.json');
const poolPath = path.join(dataDir, 'higher_level_pool.json');

const toPool = {
  'L03_007': 10, 'L03_009': 6, 'L03_010': 6, 'L03_012': 4, 'L03_013': 4,
  'L03_020': 6,  'L03_025': 9, 'L03_032': 6, 'L03_036': 6, 'L03_037': 6,
  'L03_039': 7,  'L03_040': 6, 'L03_046': 5, 'L03_047': 5,
  'L03_064': 6,  'L03_066': 6, 'L03_068': 6, 'L03_071': 6,
  'L03_073': 5,  'L03_074': 6, 'L03_075': 5, 'L03_099': 5,
  'L03_003': 4, 'L03_005': 4, 'L03_006': 4, 'L03_011': 4, 'L03_014': 4,
  'L03_015': 6, 'L03_016': 4, 'L03_041': 5, 'L03_042': 4, 'L03_043': 8,
  'L03_044': 6, 'L03_045': 5, 'L03_063': 5, 'L03_065': 4, 'L03_067': 5,
  'L03_091': 5, 'L03_094': 5, 'L03_096': 5, 'L03_100': 4,
};

const level03 = JSON.parse(fs.readFileSync(level03Path, 'utf8'));

let poolData = [];
if (fs.existsSync(poolPath)) {
  poolData = JSON.parse(fs.readFileSync(poolPath, 'utf8'));
}

const kept = [];
const extracted = [];

for (const q of level03) {
  if (toPool[q.id] !== undefined) {
    extracted.push({ ...q, original_level: 3, suggested_level: toPool[q.id] });
  } else {
    kept.push(q);
  }
}

const existingIds = new Set(poolData.map(q => q.id));
const newPoolEntries = extracted.filter(q => !existingIds.has(q.id));
const finalPool = [...poolData, ...newPoolEntries];

fs.writeFileSync(poolPath, JSON.stringify(finalPool, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'level_03_filtered.json'), JSON.stringify(kept, null, 2), 'utf8');

console.log('Extracted:', extracted.length, 'questions to pool');
console.log('Kept:', kept.length, 'questions for L3');
console.log('Pool total:', finalPool.length);
