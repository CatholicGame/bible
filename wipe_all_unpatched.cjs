const fs = require('fs');
const data = require('./src/data/crossword_puzzles.json');

let wiped = 0;
data.forEach(p => {
  if (p.id >= 96 && p.id <= 100) {
    p.words.forEach(w => {
        w.clue = `[Đang cập nhật lại từ khóa] Ý nghĩa: ${w.answer}`;
        w.explanation = "";
        wiped++;
    });
  }
});

fs.writeFileSync('./src/data/crossword_puzzles.json', JSON.stringify(data, null, 4));
console.log('Wiped all words in 96-100:', wiped);
