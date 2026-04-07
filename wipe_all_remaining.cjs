const fs = require('fs');
const data = require('./src/data/crossword_puzzles.json');

const offensivePattern = /tã tượi|bủng sùi|ruột dạ|ngoẻn|thút thít|nhóp nhép|sướng sảng|xoi loá|dộng dạn|đục khoét|lạch cạch|sập sên|rụng rẽ|ngáp ngổ|chóp quẫy|đút lót|bấu víu|nôn nấc|húp lụa|rập rợn|uể oải|lóp đâm|sùi bọt|tát rát|nát bấy|vứt tọt/gi;

let count = 0;
data.forEach(p => {
  p.words.forEach(w => {
    if (w.clue && (offensivePattern.test(w.clue) || (w.explanation && offensivePattern.test(w.explanation)))) {
      w.clue = `[Đang cập nhật lại từ khóa] Ý nghĩa: ${w.answer}`;
      w.explanation = "";
      count++;
    }
  });
});

fs.writeFileSync('./src/data/crossword_puzzles.json', JSON.stringify(data, null, 4));
console.log('Fixed additional bad clues:', count);
