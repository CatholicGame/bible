const fs = require('fs');
const data = require('./src/data/crossword_puzzles.json');

const offensivePattern = /rên rĩ|xé rách|cắm lều|nát bấy|vứt tọt|tã tượi|bủng sùi|ruột dạ|ngoẻn|thút thít|ngọng|nhóp nhép|sướng sảng|xoi loá|dộng dạn|đục khoét|lạch cạch|sập sên|rụng rẽ|ngáp ngổ|chóp quẫy|đâm thâu|rỉ rả|đút lót|bấu víu|nôn nấc|húp lụa|chà đạp|rập rợn|uể oải|lóp đâm|sùi bọt|ỏ õ|nụt|oạch|cựa quậy|tọt|phèo|mục rữa|tã mục|sùi mầm|cựa bọ|lỏm|nhốc|tẽ|ỏ|uốn ọ|õ|rũ rượi|tã nát|đĩ thõa|xạc xựa|kéo tuột|vứt vũng|cứt|đái|đực|nhục/gi;

let wiped = 0;
data.forEach(p => {
  if (p.id >= 76 && p.id <= 100) {
    p.words.forEach(w => {
      if (offensivePattern.test(w.clue) || offensivePattern.test(w.explanation)) {
        w.clue = `[Đang cập nhật lại từ khóa] Ý nghĩa: ${w.answer}.`;
        w.explanation = "";
        wiped++;
      }
    });
  }
});

fs.writeFileSync('./src/data/crossword_puzzles.json', JSON.stringify(data, null, 4));
console.log('Wiped offensive words:', wiped);
