const fs = require('fs');
const path = require('path');

const map = {
  // Places
  "Bethlehem": "Bê-lem",
  "Nazareth": "Na-da-rét",
  "Jerusalem": "Giê-ru-sa-lem",
  "Jericho": "Giê-ri-khô",
  "Damascus": "Đa-mát",
  "Đamát": "Đa-mát",
  "Capharnaum": "Ca-phác-na-um",
  "Caphácnaum": "Ca-phác-na-um",
  "Samaria": "Sa-ma-ri",
  "Galilê": "Ga-li-lê",
  "Giuđêa": "Giu-đê",
  "Giuđê": "Giu-đê",
  "Cana": "Ca-na",
  "Golgotha": "Gôn-gô-tha",
  "Ghếtsêmani": "Gết-sê-ma-ni",
  "Êmmau": "Em-mau",
  "Sinai": "Xi-nai",
  "Canaan": "Ca-na-an",
  "Jordan": "Gio-đan",
  "Giođan": "Gio-đan",
  "Ninivê": "Ni-ni-vê",
  "Roma": "Rô-ma",
  "Antiôkia": "An-ti-ô-khi-a",
  "Êphêsô": "Ê-phê-xô",
  
  // OT
  "Đavít": "Đa-vít",
  "Salômôn": "Sa-lô-môn",
  "Môsê": "Mô-sê",
  "Êlia": "Ê-li-a",
  "Êlisêô": "Ê-li-sê-ô",
  "Ábraham": "Áp-ra-ham",
  "Samuel": "Sa-mu-en",
  "Giôna": "Giô-na",
  "Isaia": "I-sai-a",
  "Giêrêmia": "Giê-rê-mi-a",
  "Batseba": "Bát-sê-ba",
  "Nôê": "Nô-ê",
  "Israel": "Ít-ra-en",
  
  // NT
  "Pilate": "Phi-la-tô",
  "Philatô": "Phi-la-tô",
  "Stephen": "Tê-pha-nô",
  "Têphanô": "Tê-pha-nô",
  "Máccô": "Mác-cô",
  "Mátthêu": "Mát-thêu",
  "Lazarô": "La-da-rô",
  "Giakêu": "Gia-kêu",
  "Mankhô": "Man-khô",
  "Saul": "Sao-lô",
  "Saolô": "Sao-lô",
  "Phaolô": "Phao-lô",
  "Phêrô": "Phê-rô",
  "Tôma": "Tô-ma",
  "Mácta": "Mác-ta",
  "Simêon": "Si-mê-ôn",
  "Nicôđêmô": "Ni-cô-đê-mô",
  "Giuđa Ítcariốt": "Giu-đa Ít-ca-ri-ốt",
  "Giuđa": "Giu-đa",
  "Barnabê": "Ba-na-ba",
  "Timôthêô": "Ti-mô-thê",
  "Pharisêu": "Pha-ri-sêu",
  "Mêsia": "Mê-si-a",
  "Giêsu": "Giê-su",
  "Maria": "Ma-ri-a",
  "Giuse": "Giu-se",
  "Gioan": "Gio-an",
  "Luca": "Lu-ca",
  "Êlisabét": "Ê-li-sa-bét",
  
  // Saints
  "Phanxicô": "Phan-xi-cô",
  "Đaminh": "Đa-minh",
  "Monica": "Mô-ni-ca",
  "Bênêđictô": "Biển Đức",
  "Augustinô": "Âu-tinh",
  "Inhaxiô": "I-nhã",
  "Têrêsa": "Tê-rê-xa",
  "Máctinô": "Mác-ti-nô"
};

const keys = Object.keys(map).sort((a,b) => b.length - a.length);

function replaceNames(str) {
  if (typeof str !== 'string') return str;
  let newStr = str;
  for (const key of keys) {
    const value = map[key];
    const regex = new RegExp(key, 'g');
    newStr = newStr.replace(regex, value);
  }
  newStr = newStr.replace(/Chúa Giê-su/g, 'Chúa Giê-su');
  return newStr;
}

const dir = 'e:/Projects/bible/src/data';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && !f.includes('backup'));

let modifiedFilesCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(content);
  } catch(e) {
    console.error('Error parsing JSON for ' + file);
    continue;
  }

  let modifiedData = false;
  
  if (Array.isArray(data)) {
    for (const q of data) {
      if (q.id === 'L02_013') {
        q.question = "10 tai ương xảy ra ở đâu trong Kinh Thánh?";
      }

      if (q.id === 'L03_049') {
        q.question = "Trong Mùa Phục Sinh, Kinh Truyền Tin (Angelus) thường được thay thế bằng kinh nào?";
        q.opt_a = "Kinh Lạy Nữ Vương (Salve Regina)";
        q.opt_b = "Kinh Lạy Nữ Vương Thiên Đàng (Regina Caeli)";
        q.opt_c = "Kinh Lòng Chúa Thương Xót";
        q.opt_d = "Kinh Sáng Danh";
        q.correct_ans = 1;
        q.explanation = "Trong suốt Mùa Phục Sinh, Giáo hội thay Kinh Truyền Tin bằng **Kinh Lạy Nữ Vương Thiên Đàng** (Regina Caeli) để chung vui sự kiện Chúa sống lại.";
      }
      if (q.id === 'L03_061') {
        q.question = "Kinh 'Cáo Mình' (Tôi thú nhận cùng Thiên Chúa toàn năng...) được đọc trong phần nào của Thánh Lễ?";
        q.opt_a = "Trước khi đọc Phúc Âm";
        q.opt_b = "Nghi thức Sám hối ở phần mở đầu";
        q.opt_c = "Sau phần rước lễ";
        q.opt_d = "Trước khi linh mục ban phép lành";
        q.correct_ans = 1;
        q.explanation = "Kinh Cáo Mình (Confiteor) được cộng đoàn cùng đọc trong **Nghi thức Sám hối ở phần mở đầu** Thánh Lễ để nài xin Chúa tha thứ các thiếu sót.";
      }
      if (q.id === 'L03_064') {
        q.question = "Kinh 'Tin Kính' bắt buộc được đọc trong Thánh Lễ vào những ngày nào?";
        q.opt_a = "Chỉ trong Mùa Chay";
        q.opt_b = "Tất cả mọi ngày trong tuần";
        q.opt_c = "Chỉ vào dịp Lễ Phục Sinh và Giáng Sinh";
        q.opt_d = "Các ngày Chúa Nhật và các ngày Lễ Trọng";
        q.correct_ans = 3;
        q.explanation = "Kinh **Tin Kính** quy định bắt buộc phải được đọc trong **các ngày Chúa Nhật và các ngày Lễ Trọng**, để cộng đoàn tuyên xưng đức tin.";
      }
      if (q.id === 'L03_095') {
        q.question = "Vị Thánh nào được Giáo hội tôn vinh với danh hiệu 'Tiến sĩ Thiên thần' (Doctor Angelicus)?";
        q.opt_a = "Thánh Augustinô";
        q.opt_b = "Thánh Tôma Aquinô";
        q.opt_c = "Thánh Phanxicô Assisi";
        q.opt_d = "Thánh Đa Minh";
        q.correct_ans = 1;
        q.explanation = "**Thánh Tôma Aquinô** được tôn vinh là Tiến sĩ Thiên thần nhờ sự uyên bác thần học sâu sắc và đời sống trinh khiết tuyệt vời.";
      }
      if (q.id === 'L04_016') {
        q.question = "Tam Nhật Thánh (Paschal Triduum) bắt đầu từ khi nào?";
        q.opt_a = "Sáng Thứ Năm Tuần Thánh";
        q.opt_b = "Thánh Lễ Tiệc Ly chiều Thứ Năm Tuần Thánh";
        q.opt_c = "Nghi thức chiều Thứ Sáu Tuần Thánh";
        q.opt_d = "Đêm Vọng Phục Sinh";
        q.correct_ans = 1;
        q.explanation = "Tam Nhật Thánh **bắt đầu từ Thánh Lễ Tiệc Ly chiều Thứ Năm Tuần Thánh**, kéo dài qua Thứ Sáu Tuần Thánh, Thứ Bảy Tuần Thánh và kết thúc bằng kinh chiều Chúa Nhật Phục Sinh.";
      }
      if (q.id === 'L04_071') {
        q.question = "Tuần Cửu Nhật (Novena) đầu tiên trong lịch sử Giáo hội diễn ra trong hoàn cảnh nào?";
        q.opt_a = "Trước Lễ Phục Sinh";
        q.opt_b = "9 ngày các Tông Đồ cầu nguyện chờ đợi Chúa Thánh Thần Hiện Xuống";
        q.opt_c = "9 ngày trước Lễ Giáng Sinh";
        q.opt_d = "9 ngày suy niệm sự Thương Khó";
        q.correct_ans = 1;
        q.explanation = "Sau khi Chúa Giêsu lên trời, Đức Mẹ và các Tông đồ đã cầu nguyện trong **9 ngày để chờ đợi Chúa Thánh Thần hiện xuống** — nguồn gốc truyền thống cầu nguyện 9 ngày (Novena).";
      }
      if (q.id === 'L04_101') {
        q.question = "Tại sao Chúa Giêsu tha tội cho người bại liệt TRƯỚC khi chữa lành thể xác?";
        q.opt_a = "Vì thể xác không quan trọng";
        q.opt_b = "Để chứng tỏ Ngài có quyền tha tội — điều chỉ Thiên Chúa mới làm được";
        q.opt_c = "Vì Ngài quên chữa bệnh";
        q.opt_d = "Vì cha mẹ anh xin tha tội trước";
        q.correct_ans = 1;
        q.explanation = "Chúa tha tội trước để chứng minh **quyền tha tội thuộc về Thiên Chúa** — điều các luật sĩ cho là phạm thượng. Sau đó Ngài chữa bệnh như bằng chứng (Mc 2:9-11).";
      }

      for (const field of ['question', 'opt_a', 'opt_b', 'opt_c', 'opt_d', 'explanation', 'category']) {
        if (q[field]) {
          const original = q[field];
          q[field] = replaceNames(q[field]);
          if (q[field] !== original) modifiedData = true;
        }
      }
    }
  } else if (data && typeof data === 'object') {
     // Handle crossword_puzzles.json
     // It is an object with { [id]: questionObj }
     for (const key of Object.keys(data)) {
         const q = data[key];
         for (const field of ['question', 'answer', 'explanation']) {
             if (q[field]) {
                 const original = q[field];
                 q[field] = replaceNames(q[field]);
                 if (q[field] !== original) modifiedData = true;
             }
         }
     }
  }

  const stringified = JSON.stringify(data, null, 4);
  if (stringified !== content) {
    fs.writeFileSync(filePath, stringified + "\n", 'utf8');
    modifiedFilesCount++;
    console.log('Successfully updated: ' + file);
  }
}

console.log('Finished updating ' + modifiedFilesCount + ' files.');
