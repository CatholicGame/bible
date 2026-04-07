const fs = require('fs');

const badWords = [
  /răn đe sự phản trắc dối gian chà đạp nát bấy lên lời thề chung thủy xé rách khăng khăng giao ước phối ngẫu linh thiêng sùng kính cởi mở/g,
  /Dung túng luyến dục thấp hèn vứt tọt phá nát gia can, lật tung ổ chăn lụy tình phung phí là cào xé vết nhơ bẩn thỉu vào sự trong vắt kiều diễm của Bí Tích Hôn Phối đan cài/g,
  /rập rợn xoi loá nhồi sóng lúp búp tụ bầy dồn phọt tấp vẩy/g,
  /rụng rẽ đục đất xót xa đắp chiếu ngậm ngùi/gi,
  /nhóp nhép lạch cạch/g,
  /nham nhở/g,
  /búng mượt róc phách/gi,
  /sướng sảng sung tớp bế mạc/gi,
  /sập sên tột nấc dậm dịch bóp hầu bóp cổ chóp quẫy uổng tiếc/g,
  /mót nhặt tuổi xế bóng rụt rè vác củi leo đồi suýt lọt thớt chọc dao dạo/gi,
  // I will write a regex loop that reduces any excessively long string of adverbs/adjectives
];

const data = require('./src/data/crossword_puzzles.json');

// Restore backup from level 01 to start clean, but wait, the crosswords aren't from level 01.
// Let's use `bad_clues.json` to see the structure.
// I will just wipe out the explanations for puzzles >= 76 and <= 100 because they're too broken,
// and simplify the clues by keeping only the first 10 words, or just "Câu hỏi về [Answer]" if it's too bad.

let count = 0;
data.forEach(p => {
  if (p.id >= 76 && p.id <= 100) {
    p.words.forEach(w => {
      // Very crude fix for the remaining unpatched puzzles (97-100)
      if (p.id >= 97) {
        if (!w.clue || w.clue.includes('nặn hóa phàm') || w.clue.includes('oai lạch') || w.clue.match(/oặc|bóp sọ|rảo lý/g)) {
            // Revert them to a generic clean string
            w.clue = `[Cần cập nhật] Khái niệm liên quan đến: ${w.answer}`;
            w.explanation = "";
            count++;
        } else if (w.clue.match(/mốc rụng|thót nghễn|lấn tụp|nụt lấn/gi)) {
            w.clue = `[Cần cập nhật] Khái niệm liên quan đến: ${w.answer}`;
            w.explanation = "";
            count++;
        }
      }
    });
  }
});
fs.writeFileSync('./src/data/crossword_puzzles.json', JSON.stringify(data, null, 4));
console.log("Cleaned " + count + " words");
