const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'data');
const filePath = path.join(dir, 'level_09.json');

const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(raw);

// ============================================================
// REPLACEMENTS: pure-number/weak → theological, reduce VN %
// Strategy: 
//  - Replace 8 VN questions: L09_034, L09_035, L09_036, L09_037, L09_040, L09_043, L09_044, L09_097
//  - Replace 4 genuine pure-number: L09_018 (73 chaps), L09_021 (year 1226), L09_054 (0.44km²), L09_076 (3M catechists)
//  - Upgrade 4 thin explanations: L09_035→already replaced, L09_043→already replaced, L09_073, L09_096
//  - Fix L09_066 (Gloria) - NOT a duplicate since L03 is level 3; but L09_066 & L03_016 are near-dups → change L09_066 to different phung_vu topic
// ============================================================

const replacements = {
  // --- REPLACING VN (18→10%) ---
  'L09_034': {
    question: 'Thánh Augustinô được mệnh danh là gì trong lịch sử thần học?',
    opt_a: 'Tiến Sĩ Thần Bí',
    opt_b: 'Tiến Sĩ Ân Sủng (Doctor Gratiae) — cha đẻ thần học Tây phương',
    opt_c: 'Tiến Sĩ Thiên Thần',
    opt_d: 'Tiến Sĩ Kinh Thánh',
    correct_ans: 1,
    explanation: 'Augustinô = **Tiến Sĩ Ân Sủng** (Doctor Gratiae) — thần học về ân sủng và tội nguyên tổ của ngài tạo nền tảng cho TH Tây phương. Đối thủ: Pelagius (con người tự cứu). Ngài thắng nhờ công đồng.',
    category: 'thanh_nhan'
  },
  'L09_035': {
    question: 'Linh đạo "Ora et Labora" (Cầu nguyện và Lao động) gắn với trường phái tu trì nào?',
    opt_a: 'Dòng Phanxicô',
    opt_b: 'Đan viện Biển Đức (Benedictine)',
    opt_c: 'Dòng Tên',
    opt_d: 'Dòng Đa Minh',
    correct_ans: 1,
    explanation: '"**Ora et Labora**" là châm ngôn của **Đan viện Biển Đức** — cân bằng cầu nguyện và lao động chân tay. Quy luật Biển Đức tổ chức ngày theo **8 giờ Kinh Phụng Vụ** (Kinh Nhật Tụng).',
    category: 'doi_song'
  },
  'L09_036': {
    question: 'Trong lịch sử GH, "Ly Giáo Đông-Tây" (Great Schism) xảy ra năm nào và do nguyên nhân gì?',
    opt_a: '1054 — tranh chấp quyền tối thượng Giáo Hoàng và Filioque',
    opt_b: '1517 — Luther phản đối',
    opt_c: '325 — Công đồng Nicêa',
    opt_d: '800 — Charlemagne lên ngôi',
    correct_ans: 0,
    explanation: '**Ly Giáo 1054**: Rôma và Constantinople tuyệt thông lẫn nhau vì tranh chấp **quyền tối thượng Giáo Hoàng** và **Filioque** (Chúa Thánh Thần xuất phát từ Chúa Con). Vết nứt đã có từ nhiều thế kỷ trước.',
    category: 'lich_su'
  },
  'L09_037': {
    question: 'Phong trào Cải Cách Tin Lành (Protestant Reformation) bắt đầu khi nào và bởi ai?',
    opt_a: 'Luther năm 1517 — đăng 95 Luận đề tại Wittenberg',
    opt_b: 'Calvin năm 1536 tại Geneva',
    opt_c: 'Henry VIII năm 1534 tại Anh',
    opt_d: 'Zwingli năm 1520 tại Zürich',
    correct_ans: 0,
    explanation: '**Luther 1517**: đăng **95 Luận đề** phản đối lạm dụng ân xá tại cổng nhà thờ Wittenberg. Dù Luther, Calvin, Zwingli đều có vai trò, **Luther 1517** là điểm bắt đầu phong trào Cải Cách.',
    category: 'lich_su'
  },
  'L09_040': {
    question: 'Hội nghị Trent (Council of Trent, 1545-1563) là phản ứng của GH CG trước điều gì?',
    opt_a: 'Thập Tự Chinh',
    opt_b: 'Phong trào Cải Cách Tin Lành — định nghĩa lại và canh tân GH CG',
    opt_c: 'Ly Giáo Đông-Tây',
    opt_d: 'Cách mạng Pháp',
    correct_ans: 1,
    explanation: '**Trent (1545-1563)**: Phản Cải cách của GH CG — xác định lại **Kinh Thánh + Truyền Thống**, **7 bí tích**, ân sủng, Luyện Ngục. Cũng cải cách nội bộ: chủng viện, kỷ luật giáo sĩ. Định hình GH suốt 400 năm.',
    category: 'lich_su'
  },
  'L09_043': {
    question: 'Phong trào Ánh Sáng (Enlightenment, TK 18) ảnh hưởng thế nào đến GH CG?',
    opt_a: 'Giúp GH phát triển mạnh hơn',
    opt_b: 'Đặt câu hỏi về thẩm quyền tôn giáo, dẫn đến tục hóa và xung đột với Nhà nước',
    opt_c: 'Không có ảnh hưởng gì',
    opt_d: 'Dẫn đến Vatican II',
    correct_ans: 1,
    explanation: 'Ánh Sáng đề cao **lý trí và khoa học** — thách thức thẩm quyền GH. Dẫn đến **tục hóa** (laïcité ở Pháp), **Cách mạng Pháp** (1789) tịch thu tài sản GH, xử tử linh mục. GH phải thích nghi dần.',
    category: 'lich_su'
  },
  'L09_044': {
    question: 'Từ "Pontifex" (nguồn gốc danh hiệu Đức Giáo Hoàng) nghĩa là gì trong tiếng Latin?',
    opt_a: 'Người chăn chiên',
    opt_b: 'Người xây cầu (bridge-builder)',
    opt_c: 'Người đứng đầu',
    opt_d: 'Người giữ chìa khóa',
    correct_ans: 1,
    explanation: '"**Pontifex**" = người xây **cầu (pons + facere)**. Nguyên là chức tư tế La Mã xây cầu thiêng. GH CG tiếp nhận danh hiệu này: **GH là cầu nối** giữa Thiên Chúa và nhân loại, trời và đất.',
    category: 'giao_ly'
  },
  'L09_097': {
    question: '"Inculturation" (hội nhập văn hóa) trong truyền giáo nghĩa là gì?',
    opt_a: 'Từ bỏ văn hóa bản địa để theo văn hóa phương Tây',
    opt_b: 'Tin Mừng thấm nhập và biến đổi văn hóa từ bên trong, giữ nguyên sắc thái địa phương',
    opt_c: 'Phiên dịch Kinh Thánh sang ngôn ngữ địa phương',
    opt_d: 'Xây nhà thờ theo kiến trúc bản địa',
    correct_ans: 1,
    explanation: '**Hội nhập văn hóa**: Tin Mừng không xóa bỏ mà **thấm nhập và biến đổi** văn hóa từ bên trong. Mô hình: cha Matteo Ricci ở Trung Quốc, Đắc Lộ ở VN. Vatican II khẳng định: GH không đồng hóa với văn hóa nào cụ thể.',
    category: 'giao_ly'
  },

  // --- REPLACING PURE-NUMBER (no theological significance) ---
  'L09_018': {
    question: 'Linh đạo của Thánh Biển Đức được tóm trong khái niệm nào?',
    opt_a: 'Chiêm niệm trong hành động',
    opt_b: '"Ora et Labora" — cân bằng cầu nguyện và lao động trong cộng đồng',
    opt_c: 'Nghèo khó tuyệt đối',
    opt_d: 'Truyền giáo khắp thế giới',
    correct_ans: 1,
    explanation: 'Linh đạo Biển Đức: **"Ora et Labora"** (Cầu nguyện và Lao động) + **"Ora et Lege"** (Cầu nguyện và Đọc). Ngày đan sĩ chia theo 8 giờ Kinh (Kinh Nhật Tụng). Từ "hospitality" (hiếu khách) cũng là giá trị Biển Đức.',
    category: 'doi_song'
  },
  'L09_021': {
    question: 'Thánh Phanxicô Assisi chọn sống nghèo khó triệt để vì lý do thần học nào?',
    opt_a: 'Để bắt chước người nghèo trong xã hội',
    opt_b: 'Để nên đồng hình với Chúa Giêsu nghèo khó — "Lady Poverty" là hôn thê thiêng liêng',
    opt_c: 'Vì GH lúc đó quá giàu có',
    opt_d: 'Vì bị cha từ chối tài sản',
    correct_ans: 1,
    explanation: 'Phanxicô xem **nghèo khó** là "hôn thê thiêng liêng" (Lady Poverty) — cách nên đồng hình với **Chúa Giêsu không có nơi gối đầu**. Đây là nền tảng thần học, không chỉ là thực hành xã hội.',
    category: 'thanh_nhan'
  },
  'L09_054': {
    question: 'Vatican là quốc gia có chủ quyền nhỏ nhất thế giới. Điều gì bảo đảm chủ quyền đó?',
    opt_a: 'Hiến chương LHQ',
    opt_b: 'Hiệp ước Lateran 1929 giữa Vatican và Vương quốc Ý',
    opt_c: 'Lực lượng quân đội Thụy Sĩ',
    opt_d: 'Hiệp ước ngầm với các cường quốc',
    correct_ans: 1,
    explanation: '**Hiệp ước Lateran 1929**: Mussolini và Vatican ký kết — Ý công nhận **chủ quyền Vatican** (0,44km²) đổi lấy GH từ bỏ yêu sách lãnh thổ lớn. Chấm dứt "vấn đề La Mã" kéo dài từ 1870.',
    category: 'lich_su'
  },
  'L09_076': {
    question: '"Giáo lý viên" (Catechist) có vai trò gì đặc biệt trong lịch sử truyền giáo Á châu?',
    opt_a: 'Chỉ dạy trẻ em trong giáo xứ',
    opt_b: 'Là trụ cột truyền giáo — thay linh mục duy trì đức tin khi thiếu linh mục',
    opt_c: 'Chỉ phiên dịch cho linh mục',
    opt_d: 'Chức năng mới từ Vatican II',
    correct_ans: 1,
    explanation: 'Tại VN và Á châu, **giáo lý viên** (thầy giảng) đóng vai trò **trụ cột**: dạy đạo, cử hành Phụng Vụ Lời Chúa, duy trì cộng đoàn khi thiếu linh mục. Nhiều người đã **tử đạo** cùng linh mục — trong đó có các vị trong 117 TĐVN.',
    category: 'giao_ly'
  },

  // --- FIX THIN EXPLANATIONS ---
  'L09_073': {
    question: 'Trong Bí tích Xức Dầu Bệnh Nhân, linh mục xức dầu ở đâu trên cơ thể?',
    opt_a: 'Chỉ trán',
    opt_b: 'Trán và hai bàn tay',
    opt_c: 'Toàn thân',
    opt_d: 'Chỉ tay',
    correct_ans: 1,
    explanation: 'Linh mục xức dầu **trán và hai bàn tay**. Trán = nơi suy nghĩ và ý thức; bàn tay = nơi hành động. Dầu thánh **Oleum Infirmorum** — được làm phép bởi GM vào **Thứ 5 Tuần Thánh** (Lễ Dầu).',
    category: 'giao_ly'
  },

  // --- FIX DUPLICATE L09_066 (Gloria) - already in L03 ---
  'L09_066': {
    question: 'Nghi thức "Sám Hối và Thứ Tha" (Penitential Rite / Confiteor) trong Thánh Lễ diễn ra khi nào?',
    opt_a: 'Sau bài giảng',
    opt_b: 'Đầu Thánh Lễ — trước khi bước vào Phụng vụ Lời Chúa',
    opt_c: 'Trước khi rước lễ',
    opt_d: 'Cuối Thánh Lễ',
    correct_ans: 1,
    explanation: '**Sám Hối** diễn ra **đầu Thánh Lễ** (Nghi thức Mở đầu) để chuẩn bị tâm hồn. Bao gồm: **Kinh Cáo Mình (Confiteor)** hoặc phép rảy nước thánh. Nhờ đó mới bước vào **Phụng vụ Lời Chúa** với tâm hồn trong sạch.',
    category: 'phung_vu'
  }
};

let changed = 0;
data.forEach(q => {
  if (replacements[q.id]) {
    const r = replacements[q.id];
    q.question = r.question;
    q.opt_a = r.opt_a;
    q.opt_b = r.opt_b;
    q.opt_c = r.opt_c;
    q.opt_d = r.opt_d;
    q.correct_ans = r.correct_ans;
    q.explanation = r.explanation;
    q.category = r.category;
    changed++;
  }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('level_09.json: replaced', changed, 'questions');

// Show final stats
const cats = {};
data.forEach(q => { cats[q.category]=(cats[q.category]||0)+1; });
console.log('\nFinal category distribution:');
Object.entries(cats).sort((a,b)=>b[1]-a[1]).forEach(([c,n])=>console.log(n+'\t'+c));
