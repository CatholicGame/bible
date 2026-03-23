const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'data');
const filePath = path.join(dir, 'level_11.json');
const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(raw);

// TARGET: viet_nam 19→10 (-9), giao_ly 6→16 (+10), kinh_thanh 22→29 (+7), doi_song 0→2 (+2)
// Strategy: replace 9 VN + 5 pure-number + replace 4 phung_vu/lich_su/tn → achieve target

const replacements = {

  // ========= 9 VN → mixed theology =========

  'L11_042': { // GP Nha Trang tỉnh nào → giao_ly HÔN NHÂN
    question: 'Theo Giáo Lý, điều kiện nào làm cho Bí tích Hôn Phối trở nên vô hiệu (null)?',
    opt_a: 'Không mặc áo trắng',
    opt_b: 'Thiếu tự do ưng thuận, thiếu hình thức hợp luật, hay có ngăn trở tiêu hôn',
    opt_c: 'Không cử hành trong nhà thờ',
    opt_d: 'Không có phép của cha mẹ',
    correct_ans: 1,
    explanation: 'Hôn Phối vô hiệu khi: (1) **thiếu ưng thuận tự do** (bị ép), (2) **ngăn trở tiêu hôn** (già, bà con, đã hôn phối), (3) **thiếu hình thức hợp lệ**. Vô hiệu ≠ ly dị: hôn phối chưa bao giờ thực sự tồn tại về mặt bí tích.',
    category: 'giao_ly'
  },

  'L11_043': { // NT Nha Trang đồi nào → giao_ly HÔN NHÂN
    question: '"Forma canonica" trong Hôn Phối Công giáo là gì?',
    opt_a: 'Mẫu giấy đăng ký hôn nhân dân sự',
    opt_b: 'Hình thức cử hành bắt buộc trước thừa tác viên GH và hai nhân chứng',
    opt_c: 'Trang phục cô dâu chú rể',
    opt_d: 'Nghi thức trao nhẫn',
    correct_ans: 1,
    explanation: '"**Forma canonica**": người CG phải kết hôn trước **thừa tác viên GH** (linh mục/phó tế được ủy quyền) và **2 nhân chứng**. Không có forma → hôn phối vô hiệu. Có thể xin miễn chuẩn khi kết hôn với người ngoài CG.',
    category: 'giao_ly'
  },

  'L11_044': { // Nhạc sĩ Cát Biển Sao Trời → kinh_thanh
    question: 'Sách Diễm Ca (Song of Songs) trong GH CG được hiểu theo nghĩa gì ngoài tình yêu đôi lứa?',
    opt_a: 'Lịch sử Israel',
    opt_b: 'Tình yêu giữa Thiên Chúa và Israel / Chúa Kitô và GH / Chúa và linh hồn con người',
    opt_c: 'Tiên tri về Chúa Giêsu',
    opt_d: 'Không có nghĩa ẩn dụ',
    correct_ans: 1,
    explanation: 'GH đọc Diễm Ca theo **3 tầng ẩn dụ**: (1) Thiên Chúa - Israel (CƯ), (2) **Chúa Kitô - Giáo Hội** (TƯ), (3) Chúa - linh hồn (tu đức). Thánh Gioan Thánh Giá dùng Diễm Ca để mô tả **huyền bí tình yêu Thiên Chúa**.',
    category: 'kinh_thanh'
  },

  'L11_046': { // GP Thái Bình giáo tỉnh → giao_ly HÔN NHÂN
    question: '"Annulment" (tuyên bố vô hiệu hôn nhân) khác với "ly dị" như thế nào?',
    opt_a: 'Annulment là ly dị CG — nghĩa tương đương',
    opt_b: 'Annulment tuyên bố hôn phối chưa bao giờ hợp lệ về mặt bí tích; ly dị chấm dứt hôn nhân đã có',
    opt_c: 'Annulment chỉ áp dụng cho người không CG',
    opt_d: 'Ly dị được GH cho phép trong trường hợp đặc biệt',
    correct_ans: 1,
    explanation: '**Annulment**: tuyên bố hôn phối **chưa bao giờ hợp lệ** (vì thiếu ưng thuận, ngăn trở...). GH không "giải hôn phối đã có" — GH tuyên bố bí tích chưa xảy ra. **Ly dị dân sự** chỉ về hệ quả pháp lý, không ảnh hưởng đến bí tích.',
    category: 'giao_ly'
  },

  'L11_049': { // Phát Diệm sau 1954 → kinh_thanh
    question: 'Trong Tin Mừng Gioan, "Người Bảo Trợ" (Paraclete/Thánh Thần) sẽ làm gì sau khi Chúa Giêsu về trời?',
    opt_a: 'Thay thế Chúa Giêsu hoàn toàn',
    opt_b: 'Dẫn vào sự thật toàn vẹn, làm chứng về Chúa Giêsu, và bào chữa cho các môn đệ',
    opt_c: 'Chỉ an ủi những ai đau khổ',
    opt_d: 'Cai quản GH thay Phêrô',
    correct_ans: 1,
    explanation: '"**Paraclete**" (Đấng Bảo Trợ) trong Ga 14-16: (1) **dẫn vào sự thật toàn vẹn**, (2) **làm chứng** về Chúa Giêsu, (3) **bào chữa** cho môn đệ trước thế gian, (4) **nhớ lại** mọi điều Chúa dạy. Đây là nền tảng thần học Chúa Thánh Thần.',
    category: 'kinh_thanh'
  },

  'L11_051': { // Long Xuyên tỉnh nào → kinh_thanh
    question: 'Sách Rút (Ruth) trong Cựu Ước chứa đựng bài học thần học nào nổi bật nhất?',
    opt_a: 'Sức mạnh quân sự của Israel',
    opt_b: '"Hesed" — lòng trung thành nhân từ vượt ranh giới tộc người: Ruth (dân ngoại) làm mẫu mực',
    opt_c: 'Tiên tri về Đền Thờ Jerusalem',
    opt_d: 'Luật lệ thanh tẩy của Israel',
    correct_ans: 1,
    explanation: 'Ruth = tuyệt tác về "**Hesed**" (lòng trung thành tình yêu/nhân từ). Ruth — người **Moabite** (dân ngoại) — chọn trung thành với Naomi và Thiên Chúa Israel. GH đọc: Thiên Chúa đón nhận **mọi người trung thành**, không phân biệt dân tộc. Ruth là tổ mẫu Đavít.',
    category: 'kinh_thanh'
  },

  'L11_052': { // Cần Thơ tỉnh nào → kinh_thanh
    question: 'Trong Khải Huyền (Revelation), "Con Chiên" (Arnion/Lamb) được nhắc đến bao nhiêu lần và biểu tượng cho ai?',
    opt_a: 'Ít hơn 10 lần — biểu tượng Israel',
    opt_b: '29 lần — biểu tượng tuyệt vời về Chúa Giêsu vừa bị giết vừa đang trị vì',
    opt_c: '7 lần — biểu tượng 7 GH',
    opt_d: 'Chỉ lần Ga 1:29 — cùng hình ảnh Gioan Tẩy Giả',
    correct_ans: 1,
    explanation: '"**Con Chiên**" trong Kh: xuất hiện **29 lần** — điểm nhấn thần học: Chúa Giêsu là Chiên **bị giết** (hy tế) nhưng đang **đứng** (Phục Sinh) và **trị vì**. Nghịch lý: yếu đuối nhất = mạnh nhất. Nền tảng thần học Thập Giá trong Kh.',
    category: 'kinh_thanh'
  },

  'L11_054': { // NT Thủ Đức phong cách → giao_ly
    question: '"Forma ordinaria" và "Forma extraordinaria" của Thánh Lễ khác nhau thế nào?',
    opt_a: 'Ordinary = ngắn, Extraordinary = dài',
    opt_b: 'Ordinary = Novus Ordo (sau 1970, tiếng bản ngữ); Extraordinary = Tridentine (Latin, trước Vatican II)',
    opt_c: 'Chỉ khác về ngôn ngữ',
    opt_d: 'Extraordinary chỉ dành cho tu sĩ',
    correct_ans: 1,
    explanation: '**Forma Ordinaria** = Novus Ordo Missae (1970, sau Vatican II) — **tiếng bản địa**, linh mục quay về phía giáo dân. **Forma Extraordinaria** = Tridentine/Latin Mass (1570 Trent) — **tiếng Latin**, bàn thờ quay về phía Đông. ĐGH Bênêđictô XVI cho phép cả hai năm 2007.',
    category: 'giao_ly'
  },

  'L11_082': { // GP Mỹ Tho tỉnh nào → kinh_thanh
    question: 'Văn học khải huyền (Apocalyptic) trong Kinh Thánh có đặc điểm gì nổi bật?',
    opt_a: 'Viết trong thời bình, mô tả lịch sử tương lai',
    opt_b: 'Viết trong thời bách hại, dùng ký hiệu và số tượng trưng để truyền hy vọng cho người bị áp bức',
    opt_c: 'Chỉ có trong sách Khải Huyền',
    opt_d: 'Mang tính chính trị thuần túy',
    correct_ans: 1,
    explanation: 'Văn học **Khải Huyền (Apocalyptic)**: viết trong **thời bách hại** (Đanien: Antiochos IV; Khải Huyền: Domitian) — dùng **ký hiệu và số** để tránh kiểm duyệt, truyền sứ điệp: **Thiên Chúa đang trị vì, ác sẽ bại**. Không phải tiên tri lịch sử theo nghĩa đen.',
    category: 'kinh_thanh'
  },

  // ========= 5 PURE-NUMBER → meaningful =========

  'L11_016': { // Đền Thờ bị phá năm nào
    question: 'Đền Thờ Jerusalem bị phá hủy lần 2 (70 SCN) để lại hậu quả thần học gì với Do Thái giáo và Kitô giáo?',
    opt_a: 'Không có hậu quả lớn',
    opt_b: 'Do Thái giáo: chuyển từ hy tế sang Kinh Torah/cầu nguyện; Kitô giáo: xác nhận Chúa Giêsu là Đền Thờ mới',
    opt_c: 'Cả hai tôn giáo bị xóa bỏ',
    opt_d: 'Dẫn đến thành lập GH Công giáo',
    correct_ans: 1,
    explanation: 'Đền Thờ bị phá **70 SCN** (Tướng Titus): (1) Do Thái giáo chuyển sang **Rabbinic Judaism** (kinh Torah, cầu nguyện thay hy tế); (2) Kitô giáo xem đây là ứng nghiệm: **Chúa Giêsu là Đền Thờ mới** (Ga 2:19). Mốc lịch sử định hình cả hai tôn giáo.',
    category: 'kinh_thanh'
  },

  'L11_021': { // "Đừng sợ" bao nhiêu lần
    question: '"Đừng sợ" (Fear not) là thông điệp KT gửi đến con người trong hoàn cảnh gặp Thiên Chúa. Điều gì thường xảy ra sau đó?',
    opt_a: 'Thần hiển (theophany) rồi thường đi kèm lời kêu gọi sứ mạng',
    opt_b: 'Không có gì xảy ra tiếp theo',
    opt_c: 'Thiên Chúa giải thích lý do mình xuất hiện',
    opt_d: 'Người nghe ngất xỉu',
    correct_ans: 0,
    explanation: '"**Đừng sợ**" trong KT thường đi sau **thần hiển** (God appears) và trước **sứ mạng**: Thiên sứ gặp Abraham, Môsê tại bụi cháy, Gideon, Đức Mẹ (Lc 1:30), môn đệ trên biển (Mt 14:27), Phục Sinh (Mt 28:5). Cầu trúc: **Gặp Chúa → Đừng sợ → Sứ mạng**.',
    category: 'kinh_thanh'
  },

  'L11_055': { // Giuse bổn mạng năm nào
    question: 'Tại sao ĐGH Piô IX (1870) chọn Thánh Giuse làm bổn mạng GH hoàn vũ?',
    opt_a: 'Vì Giuse là thánh được nhiều người biết nhất',
    opt_b: 'Trong bối cảnh GH mất quyền lực thế gian, Giuse — người lặng lẽ bảo vệ Thánh Gia — là mẫu mực bảo trợ',
    opt_c: 'Vì Piô IX là người tên Giuse',
    opt_d: 'Theo yêu cầu của Công đồng Vatican I',
    correct_ans: 1,
    explanation: 'Năm 1870 — GH mất **Lãnh thổ Giáo Hoàng** (Ý thống nhất). Piô IX chọn **Giuse**: người lặng lẽ, không có lời nào trong KT, nhưng **bảo vệ Thánh Gia** trong gian khó. Thông điệp: GH không cần quyền lực thế gian — **chỉ cần trung thành trong thinh lặng**.',
    category: 'giao_ly'
  },

  'L11_072': { // Index bãi bỏ năm nào
    question: 'Vatican bãi bỏ "Index Librorum Prohibitorum" (1966). Điều đó có ý nghĩa gì?',
    opt_a: 'GH cho phép mọi sách bây giờ',
    opt_b: 'GH chuyển từ kiểm duyệt pháp lý sang giáo dục lương tâm — vẫn khuyến khích đọc sách lành mạnh',
    opt_c: 'Sách trước đây cấm nay là bắt buộc đọc',
    opt_d: 'Không có ý nghĩa thực tiễn gì',
    correct_ans: 1,
    explanation: 'Index bị bãi bỏ năm **1966** sau Vatican II. GH chuyển hướng: không kiểm duyệt pháp lý mà **hướng dẫn lương tâm** — khuyến khích đọc sách có giá trị thiêng liêng. Phản ánh tinh thần Vatican II: **đối thoại với thế giới hiện đại** thay vì kiểm soát.',
    category: 'lich_su'
  },

  'L11_086': { // bao nhiêu Công đồng Chung
    question: 'Công đồng Chung (Ecumenical Council) cần điều kiện gì để được công nhận là có thẩm quyền?',
    opt_a: 'Ít nhất 100 giám mục',
    opt_b: 'Do Giáo Hoàng triệu tập (hoặc phê chuẩn), quy tụ tất cả GM GH, và được GH phê chuẩn kết quả',
    opt_c: 'Thống nhất tuyệt đối của mọi GM',
    opt_d: 'Tổ chức tại Roma',
    correct_ans: 1,
    explanation: '3 điều kiện **Công đồng Chung**: (1) **GH triệu tập hoặc phê chuẩn**, (2) **quy tụ toàn bộ GM** GH (ecumenical = toàn thể), (3) **GH phê chuẩn kết quả**. GH CG nhận 21 Công đồng — GH Đông phương chỉ nhận 7 CĐ đầu tiên.',
    category: 'giao_ly'
  },

  // ========= +6 THÊM MỚI: từ điển CG + kinh_thanh + hôn phối =========

  // Replace some weak phung_vu/lich_su/thanh_nhan for giao_ly and kinh_thanh
  // Need to find weak candidates — will replace L11_012, L11_045, L11_047, L11_048 (vn), L11_053(vn), L11_080(vn), L11_081(vn)

  'L11_045': { // Nhạc sĩ Hải Linh → doi_song
    question: '"Ex opere operato" trong thần học bí tích nghĩa là gì?',
    opt_a: 'Bí tích hiệu quả nhờ sự thánh thiện của linh mục',
    opt_b: 'Bí tích hiệu quả do chính hành vi được thực hiện — không phụ thuộc vào phẩm chất của thừa tác viên',
    opt_c: 'Bí tích chỉ có giá trị nếu người lãnh nhận xứng đáng',
    opt_d: 'Bí tích cần đức tin tuyệt đối mới có hiệu quả',
    correct_ans: 1,
    explanation: '"**Ex opere operato**" (do hành vi được thực hiện): bí tích truyền ơn do **chính dấu hiệu thánh thiêng** — không phụ thuộc thánh thiện của linh mục. Phòng thủ chống thuyết Donatist. Nhưng hiệu quả cũng phụ thuộc **thái độ người lãnh nhận** (ex opere operantis).',
    category: 'giao_ly'
  },

  'L11_047': { // GP Hưng Hóa đặc điểm → kinh_thanh
    question: 'Khái niệm "Imago Dei" (Hình Ảnh Thiên Chúa) trong Sáng Thế 1:26-27 bao hàm điều gì?',
    opt_a: 'Con người giống Chúa về hình thức thể xác',
    opt_b: 'Con người phản chiếu bản tính Thiên Chúa: lý trí, tự do, khả năng yêu thương, làm chủ tạo dựng',
    opt_c: 'Chỉ áp dụng cho Adam và Eva',
    opt_d: 'Hình ảnh đã bị mất hoàn toàn do tội nguyên tổ',
    correct_ans: 1,
    explanation: '"**Imago Dei**" (St 1:26): con người là hình ảnh Chúa — có **lý trí, tự do, tình yêu, sáng tạo, và phẩm giá bất khả xâm phạm**. Tội nguyên tổ làm **méo mó** (không xóa hoàn toàn) hình ảnh này. Nền tảng cho quyền con người và phẩm giá con người trong GH.',
    category: 'kinh_thanh'
  },

  'L11_048': { // Di cư 1954 → keep (too important), replace L11_053 instead
    question: 'Trong thư Ephêsô (5:21-33), Phaolô so sánh hôn nhân vợ chồng với điều gì?',
    opt_a: 'Giao ước giữa Thiên Chúa và Israel',
    opt_b: 'Tình yêu giữa Chúa Kitô và Giáo Hội — Chúa Kitô yêu GH đến mức trao mình',
    opt_c: 'Tình bạn lý tưởng',
    opt_d: 'Hợp đồng công bằng',
    correct_ans: 1,
    explanation: 'Ep 5:32 — Phaolô gọi đây là "**mầu nhiệm lớn**": hôn nhân là **hình ảnh tình yêu Chúa Kitô-Giáo Hội**. Chồng yêu vợ như Chúa Kitô yêu GH "đến mức trao mình" — đây là nền tảng thần học bí tích hôn phối, giải thích tại sao GH xem hôn phối là bất khả ly.',
    category: 'kinh_thanh'
  },

  'L11_053': { // Pottier đóng góp → giao_ly
    question: '"Kerygma" trong thần học truyền giáo nghĩa là gì?',
    opt_a: 'Giáo lý chi tiết cho người đã tin',
    opt_b: 'Loan báo cốt yếu đầu tiên: Chúa Giêsu chết, sống lại, là Chúa — mời gọi tin và hoán cải',
    opt_c: 'Phụng vụ bí tích',
    opt_d: 'Lời cầu nguyện cộng đồng',
    correct_ans: 1,
    explanation: '"**Kerygma**" (từ Hy Lạp: công bố): **loan báo Tin Mừng cốt lõi đầu tiên** — Chúa Giêsu chết-Phục Sinh-là-Chúa (Cv 2:14-36). Phân biệt: Kerygma (loan báo đầu) → **Didachê** (giáo lý chi tiết) → **Koinonia** (cộng đồng) → **Leitourgia** (phụng tự). Đây là mô hình truyền giáo đầu.',
    category: 'giao_ly'
  },

  'L11_080': { // Trường La San → kinh_thanh
    question: '"Koinonia" (Hiệp Thông) trong thần học GH mô tả điều gì?',
    opt_a: 'Hội nghị của các GM',
    opt_b: 'Sự hiệp thông chia sẻ thực sự: với Thiên Chúa Ba Ngôi, giữa các tín hữu, qua Thánh Thể',
    opt_c: 'Luật pháp GH',
    opt_d: 'Đối thoại đại kết',
    correct_ans: 1,
    explanation: '"**Koinonia**" (Hy Lạp: chia sẻ/hiệp thông): 3 chiều: (1) **với Chúa Ba Ngôi** qua đức tin và bí tích, (2) **giữa tín hữu** với nhau, (3) đặc biệt **qua Thánh Thể** (1Cr 10:16). LG 1 dùng: GH là bí tích "hiệp nhất nhân loại với Thiên Chúa và với nhau".',
    category: 'giao_ly'
  },

  'L11_081': { // Salêdiêng năm nào → kinh_thanh
    question: '"Parousia" trong thần học Kitô giáo chỉ điều gì?',
    opt_a: 'Cái chết của Chúa Giêsu',
    opt_b: 'Việc Chúa Giêsu trở lại lần thứ hai trong vinh quang — cuối thời gian',
    opt_c: 'Lễ Hiện Xuống',
    opt_d: 'Sự hiện diện của Chúa trong Thánh Thể',
    correct_ans: 1,
    explanation: '"**Parousia**" (Hy Lạp: sự hiện diện/trở lại): **Chúa Giêsu đến lần 2** trong vinh quang để phán xét và hoàn tất lịch sử cứu độ. Giáo Hội sơ khai chờ đợi sốt sắng (1Tx 4:16). Mỗi Thánh Lễ loan báo: "Chúng ta loan truyền sự chết... **cho tới khi Chúa lại đến**."',
    category: 'kinh_thanh'
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

// Also upgrade 4 thin explanations that remain
const fixes = {
  'L11_007': 'Lễ **Đức Mẹ Hồn Xác Lên Trời**: **15/8** — lễ buộc. Tín điều định tín bởi Piô XII (1950). Giáo Hội Đông phương gọi là lễ **Koimesis** (ngủ thiên). Lễ lớn nhất kính Đức Mẹ trong năm phụng vụ.',
  'L11_015': 'Trên **núi Sinai**, **Môsê nhận 10 Điều Răn** từ Thiên Chúa (Xh 19-20). Sinai = nơi Giao Ước — Israel từ "nô lệ" thành "dân riêng của Chúa". Đây là trung tâm thần học CƯ: **giao ước + luật = nền tảng quốc gia dân Chúa**.',
  'L11_031': '**Nero** đổ tội **vụ cháy Roma** (64 SCN) cho Kitô hữu. Cuộc bách hại đầu tiên có tổ chức — Phêrô và Phaolô tử đạo tại Roma. Tacitus ghi: Kitô hữu bị "ghét vì những trò xấu xa" — phản ánh sự hiểu lầm về GH sơ khai.',
  'L11_092': 'Tam Nhật bắt đầu **chiều tối Thứ 5** (Thánh Lễ Tiệc Ly) — không phải sáng. Lý do: phụng vụ Do Thái tính ngày từ hoàng hôn (St 1: "có chiều, có sáng"). **Thứ 5 chiều → Thứ 6 → Thứ 7 → CN Phục Sinh** = 3 ngày theo cách tính Do Thái.'
};
let fixCount = 0;
data.forEach(q => {
  if (fixes[q.id]) { q.explanation = fixes[q.id]; fixCount++; }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('level_11.json: replaced', changed, 'questions,', fixCount, 'explanations upgraded');

const cats = {};
data.forEach(q => { cats[q.category] = (cats[q.category] || 0) + 1; });
console.log('\nCategory distribution:');
Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(n, '\t' + c));
