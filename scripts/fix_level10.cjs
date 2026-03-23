const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'data');
const filePath = path.join(dir, 'level_10.json');
const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(raw);

const replacements = {

  // ======= 18 VN → THEOLOGY =======

  'L10_028': {
    question: '"Hypostatic Union" theo Công đồng Chalcedon (451) nghĩa là gì?',
    opt_a: 'Chúa Giêsu có 2 ngôi vị riêng biệt',
    opt_b: 'Chúa Giêsu có 2 bản tính (thần và nhân) trong 1 Ngôi Vị duy nhất',
    opt_c: 'Chúa Giêsu chỉ có bản tính thần linh',
    opt_d: 'Chúa Giêsu chỉ có bản tính con người',
    correct_ans: 1,
    explanation: '**Hypostatic Union**: Chúa Kitô có **2 bản tính** (thần và nhân) trong **1 Ngôi Vị**. Kết hợp mà không lẫn lộn, không chia cắt (Chalcedon 451). Đây là nền tảng Ki-tô học — sai lầm về điều này sẽ dẫn đến lạc thuyết.',
    category: 'giao_ly'
  },

  'L10_029': {
    question: '"Communicatio idiomatum" trong Ki-tô học nghĩa là gì?',
    opt_a: 'Chúa Giêsu nói nhiều thứ tiếng',
    opt_b: 'Các thuộc tính của 2 bản tính được quy về cùng 1 Ngôi Vị — nên Đức Maria là Mẹ Thiên Chúa',
    opt_c: 'Thiên Chúa truyền thông qua Kinh Thánh',
    opt_d: 'Bí tích truyền thông ơn thánh',
    correct_ans: 1,
    explanation: '"**Communicatio idiomatum**": vì Chúa Giêsu là 1 Ngôi Vị, mọi hành động đều quy về Ngài. Nên có thể nói: "Thiên Chúa đã chết" và "Đức Maria là **Mẹ Thiên Chúa** (Theotokos)" — điều này bảo vệ tín lý Ki-tô học.',
    category: 'giao_ly'
  },

  'L10_030': {
    question: '"Babylonian Captivity of the Church" là thời kỳ nào trong lịch sử GH?',
    opt_a: 'Khi GH bị người Babylon chiếm đóng',
    opt_b: 'GH Giáo Hoàng đóng đô tại Avignon (Pháp) 1309-1377, dưới ảnh hưởng của vua Pháp',
    opt_c: 'Thời bách hại La Mã',
    opt_d: 'Cuộc ly giáo Tin Lành',
    correct_ans: 1,
    explanation: '**"Babylonian Captivity"** (1309-1377): 7 GH người Pháp liên tiếp đóng đô tại **Avignon** — bị coi là "tù nhân" của vua Pháp. Luther sau này cũng dùng cụm từ này để chỉ trích bí tích. Chấm dứt khi GH Grêgôriô XI trở về Roma.',
    category: 'lich_su'
  },

  'L10_032': {
    question: '"Schism của phương Tây" (Western Schism, 1378-1417) là cuộc khủng hoảng gì?',
    opt_a: 'Ly giáo với Chính Thống',
    opt_b: 'Có 2-3 người cùng tự xưng là Giáo Hoàng hợp pháp cùng một lúc',
    opt_c: 'Luther tách khỏi Roma',
    opt_d: 'GH Anh ly khai',
    correct_ans: 1,
    explanation: '**Western Schism** (1378-1417): đỉnh điểm có **3 người tự xưng GH** cùng lúc (Roma, Avignon, Pisa). Công đồng Constance (1414-1418) giải quyết bằng cách buộc cả 3 từ chức và bầu GH mới — **Martinô V**.',
    category: 'lich_su'
  },

  'L10_034': {
    question: 'Thánh Giuse được ĐGH Phanxicô thêm vào Kinh Nguyện Thánh Thể năm 2013. Điều này có ý nghĩa gì?',
    opt_a: 'Không có ý nghĩa đặc biệt',
    opt_b: 'Lần đầu tiên trong lịch sử tên Giuse được đọc trong tất cả 4 Kinh Nguyện Thánh Thể chính',
    opt_c: 'GH phong thêm cho Giuse danh hiệu mới',
    opt_d: 'Chỉ thêm vào lễ kính Thánh Giuse',
    correct_ans: 1,
    explanation: 'Năm **2013**, ĐGH Phanxicô cho thêm tên **Thánh Giuse** vào **4 Kinh Nguyện Thánh Thể** chính. Trước đó tên Giuse không có trong KNTT — sự thay đổi mang tính biểu tượng lớn: Đấng bảo trợ GH hiện diện trong trái tim phụng vụ.',
    category: 'phung_vu'
  },

  'L10_035': {
    question: '"Perichoresis" (hay Circumincessio) trong Ba Ngôi học mô tả điều gì?',
    opt_a: 'Sự cầu nguyện của Ba Ngôi',
    opt_b: 'Ba Ngôi cùng hiện diện lẫn nhau — "sự xuyên thấu nhau" của Cha, Con, Thánh Thần',
    opt_c: 'Ngôi Hai nhập thể',
    opt_d: 'Chúa Thánh Thần phái xuống',
    correct_ans: 1,
    explanation: '"**Perichoresis**": Ba Ngôi không tách biệt mà **cùng hiện diện và xuyên thấu lẫn nhau** — Cha trong Con, Con trong Cha, Thánh Thần trong cả hai. Đây là nền tảng thần học về **Thiên Chúa là tình yêu** (1Ga 4:8).',
    category: 'giao_ly'
  },

  'L10_045': {
    question: 'Trong Kinh Nhật Tụng (Liturgy of the Hours), "Lauds" và "Vespers" đặc biệt quan trọng vì sao?',
    opt_a: 'Vì chỉ dành cho linh mục',
    opt_b: 'Được gọi là "hai trụ cột" của Kinh Nhật Tụng — nối giữa đêm và ngày, tượng trưng Chết-Phục Sinh',
    opt_c: 'Vì dài nhất',
    opt_d: 'Vì có Thánh Thể',
    correct_ans: 1,
    explanation: '**Lauds** (kinh sáng) và **Vespers** (kinh chiều) là "**hai trụ cột**" của Kinh Nhật Tụng. Lauds = Bình Minh, tượng trưng Phục Sinh; Vespers = Hoàng Hôn, dâng lên Đấng đã chịu chết. GH khuyến khích mọi tín hữu đọc 2 giờ kinh này.',
    category: 'phung_vu'
  },

  'L10_047': {
    question: 'Bí tích nào trong 7 bí tích trao "ấn tín" (character) vĩnh viễn không thể xóa bỏ?',
    opt_a: 'Tất cả 7 bí tích',
    opt_b: 'Rửa Tội, Thêm Sức, Truyền Chức',
    opt_c: 'Chỉ Rửa Tội',
    opt_d: 'Hôn Phối và Truyền Chức',
    correct_ans: 1,
    explanation: '3 bí tích trao **ấn tín** (character sacramentalis) vĩnh viễn: **Rửa Tội, Thêm Sức, Truyền Chức** — không thể lặp lại. Đây là lý do người đã Rửa Tội nhưng bỏ đạo, khi trở lại không cần Rửa Tội lại.',
    category: 'giao_ly'
  },

  'L10_049': {
    question: 'Trong phụng vụ Công giáo, "Epiclesis" là gì?',
    opt_a: 'Bài đọc Cựu Ước',
    opt_b: 'Lời khẩn cầu Chúa Thánh Thần xuống trên bánh rượu trong Kinh Nguyện Thánh Thể',
    opt_c: 'Kinh Lạy Cha',
    opt_d: 'Lời chúc bình an',
    correct_ans: 1,
    explanation: '"**Epiclesis**" (tiếng Hy Lạp: kêu cầu xuống trên): trong KNTT, linh mục **khẩn cầu Chúa Thánh Thần** xuống biến đổi bánh và rượu thành Mình Máu Thánh Chúa. GH Đông phương coi đây là khoảnh khắc truyền phép; Tây phương = lời truyền phép.',
    category: 'phung_vu'
  },

  'L10_068': {
    question: '"Lectio Divina" là phương pháp đọc Kinh Thánh gồm mấy bước cổ điển?',
    opt_a: '2 bước: Đọc và Suy niệm',
    opt_b: '4 bước: Lectio, Meditatio, Oratio, Contemplatio',
    opt_c: '7 bước theo gương Thánh Benedict',
    opt_d: '1 bước: Đọc trong thinh lặng',
    correct_ans: 1,
    explanation: '**Lectio Divina** (Đọc Thánh): **4 bước**: (1) **Lectio** – đọc chăm chú; (2) **Meditatio** – suy gẫm; (3) **Oratio** – cầu nguyện với Chúa; (4) **Contemplatio** – thinh lặng hiệp nhất. Có gốc từ Đan viện Biển Đức, được Vatican II canh tân.',
    category: 'doi_song'
  },

  'L10_069': {
    question: '"Sensus Fidei" (cảm thức đức tin) theo Giáo lý là gì?',
    opt_a: 'Cảm giác tôn giáo cá nhân',
    opt_b: 'Khả năng nhận biết chân lý đức tin nhờ ơn thánh — là dấu hiệu của toàn dân Chúa hiệp thông với GH',
    opt_c: 'Linh cảm của linh mục',
    opt_d: 'Lý trí nhận biết Thiên Chúa',
    correct_ans: 1,
    explanation: '"**Sensus Fidei**" (LG 12): ân sủng đặc biệt giúp toàn dân Chúa **nhận ra chân lý đức tin** không sai lầm — khi hiệp nhất với hàng GM xung quanh GH. Đây là nền tảng để hiểu "đức tin của Hội Thánh" vượt hơn bất kỳ cá nhân nào.',
    category: 'giao_ly'
  },

  'L10_082': {
    question: '"Theosis" hay "divinization" (thần hóa) trong thần học Đông phương nghĩa là gì?',
    opt_a: 'Trở thành Thiên Chúa về bản thể',
    opt_b: 'Con người tham dự vào bản tính Thiên Chúa qua ơn thánh — "Chúa làm người để người thành Chúa"',
    opt_c: 'Trải nghiệm huyền bí với Thiên Chúa',
    opt_d: 'Phong thánh sau khi chết',
    correct_ans: 1,
    explanation: '"**Theosis**": mục đích tối hậu của con người là **tham dự bản tính Thiên Chúa** (2Pr 1:4) — không về bản thể nhưng về ân sủng. Câu kinh điển: "**Chúa làm người để người thành Chúa**" (Athanasius). Trung tâm trong thần học Đông phương, ít nhấn mạnh hơn ở Tây phương.',
    category: 'giao_ly'
  },

  'L10_083': {
    question: 'Họa sĩ Peter Paul Rubens nổi tiếng thuộc trường phái nào và chuyên vẽ chủ đề gì?',
    opt_a: 'Gothic — phong cảnh',
    opt_b: 'Flemish Baroque — các cảnh Kinh Thánh và thần thoại với cơ thể đầy đặn, màu sắc rực rỡ',
    opt_c: 'Ấn tượng — ánh sáng tự nhiên',
    opt_d: 'Phục Hưng Ý — chân dung',
    correct_ans: 1,
    explanation: '**Rubens** (1577-1640): đỉnh cao hội họa **Flemish Baroque**. Phong cách: màu sắc **ấm, rực rỡ**, hình thể **đầy đặn, chuyển động**. Tác phẩm lớn: *Descent from the Cross* tại Antwerp. Ảnh hưởng lớn đến hội họa KTG Tây phương.',
    category: 'nghe_thuat'
  },

  'L10_084': {
    question: '"Ite, missa est" cuối Thánh Lễ dịch sát là gì và có ý nghĩa sứ mạng gì?',
    opt_a: 'Hãy ra đi, bình an',
    opt_b: '"Đi đi, đây là missa" — sai đi thực thi Tin Mừng; chính đây là nguồn gốc từ "missa/Mass"',
    opt_c: 'Chúa đã ở cùng anh chị em',
    opt_d: 'Lễ kết thúc, cảm ơn Chúa',
    correct_ans: 1,
    explanation: '"**Ite, missa est**" = "Đi đi, đây là cuộc sai đi!" Từ "**missa**" (sai đi) → Tiếng Anh: **Mass**, Tiếng Pháp: **Messe**. Thánh Lễ không kết thúc — nó **sai tín hữu ra đi** mang Tin Mừng vào cuộc sống.',
    category: 'phung_vu'
  },

  'L10_085': {
    question: '"Examen" (Xét Mình) của Thánh Inhaxiô Loyola trong Linh Thao gồm mấy bước?',
    opt_a: '3 bước',
    opt_b: '5 bước: tạ ơn, xin ơn soi sáng, xét lại ngày qua, ăn năn, quyết tâm',
    opt_c: '7 bước',
    opt_d: '2 bước: nhìn lại và ăn năn',
    correct_ans: 1,
    explanation: '**Examen** của Inhaxiô: (1) **Tạ ơn** vì ân huệ; (2) **Xin ơn soi sáng**; (3) **Xét lại ngày qua**; (4) **Ăn năn và tha thứ**; (5) **Quyết tâm**. Thực hành 15 phút/ngày — công cụ nhận ra Chúa trong mọi sự.',
    category: 'doi_song'
  },

  'L10_094': {
    question: 'Tông huấn "Evangelii Gaudium" (Niềm Vui Tin Mừng, 2013) của ĐGH Phanxicô nhấn mạnh điều gì?',
    opt_a: 'Kỷ luật phụng vụ nghiêm ngặt',
    opt_b: 'GH "đi ra" — truyền giáo, phục vụ người nghèo, GH như "bệnh viện dã chiến"',
    opt_c: 'Học thuyết xã hội CG',
    opt_d: 'Đối thoại với Hồi giáo',
    correct_ans: 1,
    explanation: '**Evangelii Gaudium**: ĐGH Phanxicô kêu gọi GH **"đi ra" khỏi mình** — truyền giáo, ưu tiên người nghèo. Câu nổi tiếng: "**GH là bệnh viện dã chiến sau trận đánh**" — chữa lành trước khi giảng thuyết.',
    category: 'giao_ly'
  },

  'L10_098': {
    question: 'Bức "Pietà" nổi tiếng nhất của Michelangelo (1498-1499) đang được trưng bày ở đâu?',
    opt_a: 'Bảo tàng Vatican',
    opt_b: 'Đền thờ Thánh Phêrô, Vatican',
    opt_c: 'Bảo tàng Florence',
    opt_d: 'Bảo tàng Anh',
    correct_ans: 1,
    explanation: '**Pietà** của Michelangelo (1498) đặt tại **Đền thờ Thánh Phêrô** (Vương Cung Thánh Đường). Tuyệt tác: Đức Mẹ bế Chúa Giêsu sau khi hạ xuống khỏi Thập Giá. Michelangelo hoàn thành khi mới 24 tuổi — **tác phẩm duy nhất ngài ký tên**.',
    category: 'nghe_thuat'
  },

  'L10_099': {
    question: 'Thánh Louis Marie de Montfort nổi tiếng vì linh đạo nào về Đức Mẹ?',
    opt_a: 'Linh đạo Carmel',
    opt_b: 'Linh đạo "Thánh Hiến cho Đức Mẹ" — dâng hoàn toàn cho Mẹ để đến với Chúa Giêsu',
    opt_c: 'Kinh Mân Côi truyền thống',
    opt_d: 'Đức Mẹ là đồng cộng cứu chuộc',
    correct_ans: 1,
    explanation: 'Montfort sáng lập linh đạo **Thánh Hiến Đức Mẹ** ("True Devotion to Mary"): dâng hoàn toàn bản thân cho Mẹ để **qua Mẹ đến với Chúa**. ĐGH JPII lấy khẩu hiệu "**Totus Tuus**" từ Montfort — ảnh hưởng lớn đến linh đạo Marian thế giới.',
    category: 'thanh_nhan'
  },

  // ======= 5 PURE-NUMBER → THEOLOGY =======

  'L10_009': { // 10 người phong cùi — duplicate with L05_045
    question: 'Chúa Giêsu dùng dụ ngôn nào để mô tả sự bất nhất giữa người Do Thái và người Samaritanô?',
    opt_a: 'Người con hoang đàng',
    opt_b: 'Người Samaritanô nhân hậu — và trong phép chữa 10 người phong, chỉ người Samaritanô quay lại tạ ơn',
    opt_c: 'Người gieo giống',
    opt_d: 'Trinh nữ khôn ngoan',
    correct_ans: 1,
    explanation: 'Chủ đề **người Samaritanô** xuyên suốt Luca: Dụ ngôn Người Nhân Hậu (Lc 10) và phép lạ 10 người phong cùi (Lc 17) — **chỉ người Samaritanô** quay lại tạ ơn. Luca nhấn mạnh: Thiên Chúa đón nhận cả người bị xã hội loại trừ.',
    category: 'kinh_thanh'
  },

  'L10_024': { // GH bao nhiêu tước hiệu
    question: 'Danh hiệu "Pontifex Maximus" của Giáo Hoàng có nguồn gốc từ đâu?',
    opt_a: 'Công đồng Nicêa đặt cho GH đầu tiên',
    opt_b: 'Vay mượn từ chức tư tế tối cao của đế quốc La Mã — người xây cầu thiêng giữa thần và người',
    opt_c: 'Chúa Giêsu đặt cho Phêrô',
    opt_d: 'Từ Công đồng Trent',
    correct_ans: 1,
    explanation: '"**Pontifex Maximus**" ban đầu là tước hiệu của **tư tế tối cao La Mã** (pons = cầu + facere = làm). GH tiếp nhận dần từ TK 4-5. Nghĩa biểu tượng: GH là **cầu nối** giữa Thiên Chúa và nhân loại — giữa trời và đất.',
    category: 'giao_ly'
  },

  'L10_025': { // Giáo Luật năm nào
    question: 'Bộ Giáo Luật 1983 (Code of Canon Law) của GH Công giáo khác Bộ 1917 ở điểm cơ bản nào?',
    opt_a: 'Chỉ thêm một vài điều luật mới',
    opt_b: 'Được canh tân toàn diện theo tinh thần Vatican II — đặt trọng tâm vào GH như Dân Thiên Chúa hơn là thể chế pháp lý',
    opt_c: 'Giảm số điều luật đi',
    opt_d: 'Chỉ áp dụng cho linh mục',
    correct_ans: 1,
    explanation: 'Bộ Giáo Luật **1983** (do JPII ban hành): canh tân theo tinh thần **Vatican II** — GH là **Dân Thiên Chúa** hiệp thông, không chỉ là thể chế pháp lý. Nhiều quyền của giáo dân được bổ sung; vai trò Giáo phụ tăng thêm.',
    category: 'giao_ly'
  },

  'L10_051': { // bao nhiêu Tiến sĩ
    question: 'Điều kiện để được phong danh hiệu "Tiến Sĩ Hội Thánh" (Doctor of the Church) là gì?',
    opt_a: 'Chỉ cần được phong thánh',
    opt_b: 'Phải là thánh + thánh thiện nổi bật + tác phẩm thần học có giá trị phổ quát cho GH',
    opt_c: 'Phải là linh mục hoặc giám mục',
    opt_d: 'Phải có bằng thần học chính thức',
    correct_ans: 1,
    explanation: '3 điều kiện **Tiến Sĩ Hội Thánh**: (1) **Thánh nhân** (đã phong thánh), (2) **Thánh thiện phi thường**, (3) **Giáo lý phong phú và an toàn** có giá trị phổ quát. Thú vị: **Thánh Têrêsa Lisieux** — chưa học thần học chính thức, vẫn được phong năm 1997.',
    category: 'giao_ly'
  },

  'L10_059': { // JPII xin lỗi Galileo năm nào
    question: 'ĐGH Gioan Phaolô II chính thức nhìn nhận sai lầm trong vụ Galileo. Nội dung thừa nhận là gì?',
    opt_a: 'GH đã sai khi tin rằng trái đất quay quanh mặt trời',
    opt_b: 'Các thần học gia TK 17 đã sai khi đặt khoa học dưới hệ thống giải thích KT của họ — không phải KT sai',
    opt_c: 'Galileo là thánh',
    opt_d: 'Tòa Dị Giáo đã kết án oan hoàn toàn',
    correct_ans: 1,
    explanation: 'Năm 1992, JPII thừa nhận: **thần học gia TK 17 đã sai** khi ép KT vào hệ thống địa tâm Ptolemy. Galileo đúng về KH. Bài học: **KT và KH có lĩnh vực khác nhau** — không mâu thuẫn nếu hiểu đúng. "Sai lầm thần học", không phải sai lầm của Kinh Thánh.',
    category: 'giao_ly'
  },

  // ======= UPGRADE 3 THIN EXPLANATIONS =======

  'L10_026': { // tuổi 25 linh mục — thin explanation
    question: 'Giáo Luật quy định tuổi tối thiểu để được phong linh mục là bao nhiêu?',
    opt_a: '21 tuổi',
    opt_b: '25 tuổi',
    opt_c: '30 tuổi',
    opt_d: '18 tuổi',
    correct_ans: 1,
    explanation: 'Giáo Luật: tuổi tối thiểu phong LP = **25 tuổi** (Điều 1031 §1). GM có thể xin phép miễn giảm 1 năm tối đa. Lý do: đảm bảo sự trưởng thành nhân cách và thiêng liêng trước khi đảm nhận sứ vụ.',
    category: 'giao_ly'
  },

  'L10_034old': null, // handled above as L10_034 replacement

  'L10_069old': null, // handled above

};

// Remove null entries
delete replacements['L10_034old'];
delete replacements['L10_069old'];

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
console.log('level_10.json: replaced', changed, 'questions');

const cats = {};
data.forEach(q => { cats[q.category] = (cats[q.category] || 0) + 1; });
console.log('\nFinal category distribution:');
Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(n, '\t' + c));
