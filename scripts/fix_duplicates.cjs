const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'data');

// Map: id -> new question object (replacing the higher-level duplicate)
const replacements = {
  'L05_026': {
    question: 'Trong 117 Thánh Tử Đạo Việt Nam, thành phần gồm những ai?',
    opt_a: 'Chỉ linh mục và giám mục',
    opt_b: 'Đủ mọi thành phần: giám mục, linh mục, tu sĩ, và giáo dân nam nữ',
    opt_c: 'Toàn bộ là người ngoại quốc',
    opt_d: 'Chỉ giáo dân',
    correct_ans: 1,
    explanation: '117 TĐVN gồm: **8 giám mục, 50 linh mục, 59 giáo dân** (cả nam lẫn nữ). Trong đó **11 người Tây Ban Nha, 10 người Pháp, 96 người Việt Nam** — tử đạo trong nhiều thời kỳ bách hại khác nhau.',
    category: 'viet_nam'
  },
  'L05_097': {
    question: 'Ai được phép ban Bí tích Xức Dầu Bệnh Nhân?',
    opt_a: 'Bất kỳ giáo dân nào',
    opt_b: 'Chỉ linh mục hoặc giám mục',
    opt_c: 'Phó tế',
    opt_d: 'Chỉ giám mục',
    correct_ans: 1,
    explanation: 'Chỉ **linh mục hoặc giám mục** được ban Bí tích Xức Dầu Bệnh Nhân (GLCG 1516). Phó tế và giáo dân không có quyền này — khác với Rửa Tội có thể do giáo dân ban khi khẩn cấp.',
    category: 'giao_ly'
  },
  'L06_036': {
    question: 'Thánh Gioan Bosco (Don Bosco) qua đời năm nào và được phong thánh khi nào?',
    opt_a: 'Qua đời 1870, phong thánh 1890',
    opt_b: 'Qua đời 1888, phong thánh 1934',
    opt_c: 'Qua đời 1900, phong thánh 1950',
    opt_d: 'Qua đời 1888, phong thánh 1950',
    correct_ans: 1,
    explanation: 'Don Bosco qua đời **31/1/1888** tại Turin, Ý. Được **ĐGH Piô XI phong thánh năm 1934**. Lễ kính ngài mừng 31 tháng 1 mỗi năm.',
    category: 'thanh_nhan'
  },
  'L06_067': {
    question: 'Chúa Giêsu biến đổi nước thành rượu tại tiệc cưới ở đâu?',
    opt_a: 'Jerusalem',
    opt_b: 'Cana xứ Galilê',
    opt_c: 'Bêlem',
    opt_d: 'Capharnaum',
    correct_ans: 1,
    explanation: 'Phép lạ đầu tiên của Chúa: biến nước thành rượu tại **tiệc cưới Cana** (Ga 2:1-11). Đức Mẹ cầu bầu: "Người bảo gì, các anh cứ làm theo". Đây là **dấu lạ đầu tiên** mở đầu sứ vụ công khai.',
    category: 'kinh_thanh'
  },
  'L06_076': {
    question: 'Đền thờ Đức Mẹ Pompei (Ý) nổi tiếng gắn với việc đạo đức nào?',
    opt_a: 'Kinh Mân Côi — một trong những trung tâm hành hương Mân Côi lớn nhất thế giới',
    opt_b: 'Kinh Lòng Chúa Thương Xót',
    opt_c: 'Kinh Angelus',
    opt_d: 'Kinh Taizé',
    correct_ans: 0,
    explanation: 'Đền thờ **Đức Mẹ Pompei** là trung tâm hành hương **Kinh Mân Côi** nổi tiếng. Gắn với Chân phước **Bartolo Longo** — từng là thủ lĩnh ngũ quỷ, trở thành tông đồ Mân Côi, xây dựng đền thờ này cuối TK 19.',
    category: 'lich_su'
  },
  'L08_026': {
    question: 'Thánh Tôma Aquinô được gọi là "Tiến Sĩ" gì trong Giáo Hội?',
    opt_a: 'Tiến Sĩ Thần Bí',
    opt_b: 'Tiến Sĩ Thiên Thần (Doctor Angelicus)',
    opt_c: 'Tiến Sĩ Ân Sủng',
    opt_d: 'Tiến Sĩ Kinh Thánh',
    correct_ans: 1,
    explanation: 'Tôma Aquinô là **Tiến Sĩ Thiên Thần (Doctor Angelicus)** — trí tuệ sâu sắc như thiên thần. So sánh: Thánh Bonaventura = Tiến Sĩ Sốt Mến, Thánh Augustinô = Tiến Sĩ Ân Sủng, Thánh Têrêsa Lisieux = Tiến Sĩ Tình Yêu.',
    category: 'thanh_nhan'
  },
  'L10_040': {
    question: 'Thông điệp trung tâm của ĐHY Oscar Romero — điều ông thường nhấn mạnh nhất là gì?',
    opt_a: 'Phục hồi kinh tế El Salvador',
    opt_b: 'Giáo Hội phải đứng về phía người nghèo và tố giác bất công xã hội',
    opt_c: 'Mở rộng ảnh hưởng Dòng Tên',
    opt_d: 'Thống nhất các giáo phái Kitô giáo',
    correct_ans: 1,
    explanation: 'Romero nhấn mạnh GH phải **đứng về người nghèo** và **tố giác bất công**: "Ai chạm đến người nghèo, chạm đến Thiên Chúa." Ngài phản đối bạo lực nhà nước và bị ám sát ngay trên bàn thờ — trở thành biểu tượng **thần học giải phóng** trong thực hành.',
    category: 'thanh_nhan'
  },
  'L13_043': {
    question: 'Mẹ Têrêsa Calcutta trải qua "đêm tối tâm hồn" kéo dài trong bao lâu?',
    opt_a: '3 tháng',
    opt_b: 'Gần 50 năm — từ khi bắt đầu sứ vụ đến qua đời',
    opt_c: '10 năm',
    opt_d: 'Không có — ngài luôn vui mừng',
    correct_ans: 1,
    explanation: 'Thư riêng của Mẹ Têrêsa (tiết lộ năm 2007): Bà trải qua **"đêm tối" gần 50 năm** — không cảm thấy sự hiện diện của Chúa. Điều này làm phong phú thêm sự hiểu biết: **đức tin không dựa vào cảm xúc** mà vào sự trung thành.',
    category: 'thanh_nhan'
  },
  'L14_047': {
    question: 'Thư Do Thái (Hebrews) trong Tân Ước áp dụng khái niệm nào từ Cựu Ước để giải thích công trình của Chúa Giêsu?',
    opt_a: 'Ngôn sứ',
    opt_b: 'Thượng Tế vĩnh cửu theo phẩm trật Melkisêđê',
    opt_c: 'Vua Đavít',
    opt_d: 'Con Chiên Vượt Qua',
    correct_ans: 1,
    explanation: 'Thư Do Thái mô tả Chúa Giêsu là **Thượng Tế vĩnh cửu theo phẩm trật Melkisêđê** (Dt 5-7) — vượt trội hàng tư tế Lêvi. Ngài vào Nơi Cực Thánh thật (thiên đàng) với máu của chính mình, không phải máu bò hay dê.',
    category: 'kinh_thanh'
  },
  'L14_067': {
    question: 'Thánh Agnes (Anê) tử đạo La Mã là bổn mạng của ai và có biểu tượng gì?',
    opt_a: 'Nhạc sĩ — biểu tượng là đàn hạc',
    opt_b: 'Thiếu nữ và trinh nữ — biểu tượng là con cừu (agnus)',
    opt_c: 'Bác sĩ — biểu tượng là cây thập giá',
    opt_d: 'Thủy thủ — biểu tượng là ngôi sao',
    correct_ans: 1,
    explanation: 'Thánh **Agnes (Anê)** tử đạo khoảng 12-13 tuổi vì bảo vệ đức trinh tiết (khoảng 304 SCN). Bổn mạng **thiếu nữ và trinh nữ**. Biểu tượng: **con cừu** (Latin: agnus = cừu, gần âm với Agnes). Lễ kính 21/1.',
    category: 'thanh_nhan'
  },
  'L14_061': {
    question: 'Nhà thờ Lớn Hà Nội (St. Joseph Cathedral) được xây dựng theo phong cách kiến trúc nào?',
    opt_a: 'Baroque',
    opt_b: 'Gothic — lấy cảm hứng từ Notre-Dame Paris',
    opt_c: 'Romanesque',
    opt_d: 'Á Đông kết hợp Phương Tây',
    correct_ans: 1,
    explanation: 'Nhà thờ Lớn Hà Nội (1886) xây theo phong cách **Gothic** lấy cảm hứng từ **Notre-Dame Paris** — với 2 tháp chuông, cửa sổ hoa thị, cuốn nhọn. Một trong số ít công trình kiến trúc Gothic lớn tại Đông Nam Á.',
    category: 'nghe_thuat'
  },
  'L15_071': {
    question: 'Câu "Extra Ecclesiam nulla salus" được hiểu thế nào trong thần học Công giáo hiện đại?',
    opt_a: 'Chỉ người Công giáo chính thức mới được cứu rỗi',
    opt_b: 'GH là bí tích phổ quát của ơn cứu độ, nhưng Thiên Chúa không bị giới hạn bởi các bí tích hữu hình',
    opt_c: 'Tất cả mọi người đều được cứu rỗi tự động',
    opt_d: 'Người không rửa tội đều bị hỏa ngục',
    correct_ans: 1,
    explanation: 'Vatican II (LG 16): GH là bí tích cứu độ phổ quát, nhưng **Thiên Chúa không bị giới hạn bởi các bí tích** (Piô XII, Mystici Corporis). Ơn cứu độ có thể đến với người thành tâm dù họ không biết GH hữu hình.',
    category: 'giao_ly'
  },
  'L15_047': {
    question: 'Điều gì phân biệt "ơn thánh hóa" và "ơn cảm hóa" trong thần học Công giáo?',
    opt_a: 'Ơn cảm hóa là vĩnh cửu; ơn thánh hóa là tạm thời',
    opt_b: 'Ơn thánh hóa là sự hiện diện thường hằng của Chúa trong linh hồn; ơn cảm hóa là tác động nhất thời giúp làm điều lành',
    opt_c: 'Chỉ linh mục mới có ơn thánh hóa',
    opt_d: 'Đây là hai tên gọi cho cùng một thực tại',
    correct_ans: 1,
    explanation: '**Ơn thánh hóa** (sanctifying grace) = sự hiện diện thường hằng của Thiên Chúa Ba Ngôi trong linh hồn người đang trong ân sủng. **Ơn cảm hóa** (actual grace) = tác động nhất thời giúp thực hiện hành vi siêu nhiên cụ thể.',
    category: 'giao_ly'
  }
};

// Apply replacements to each file
const fileMap = {
  'level_05.json': ['L05_026', 'L05_097'],
  'level_06.json': ['L06_036', 'L06_067', 'L06_076'],
  'level_08.json': ['L08_026'],
  'level_10.json': ['L10_040'],
  'level_13.json': ['L13_043'],
  'level_14.json': ['L14_047', 'L14_067', 'L14_061'],
  'level_15.json': ['L15_071', 'L15_047']
};

let totalFixed = 0;
Object.entries(fileMap).forEach(([file, ids]) => {
  const filePath = path.join(dir, file);
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const data = JSON.parse(raw);
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
      totalFixed++;
    }
  });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(file + ': replaced ' + changed + ' questions (' + ids.join(', ') + ')');
});

console.log('\nTotal duplicates fixed:', totalFixed);
