/**
 * Crossword Builder — generates valid crossword layouts from seed data
 * Run: node scripts/crossword_builder.cjs
 * Output: src/data/crossword_puzzles.json
 */
const fs = require('fs');
const path = require('path');

/* ── ALGORITHM ── */
function buildCrossword(wordList) {
  const sorted = [...wordList].sort((a, b) => b.answer.length - a.answer.length);
  const placed = [];
  const grid = {}; // "r,c" -> letter

  function getCell(r, c) { return grid[`${r},${c}`] || null; }
  function setCell(r, c, ch) { grid[`${r},${c}`] = ch; }

  function canPlace(answer, dir, row, col) {
    const len = answer.length;
    // boundary cells before and after must be empty
    const br = dir === 'down' ? row - 1 : row;
    const bc = dir === 'across' ? col - 1 : col;
    const ar = dir === 'down' ? row + len : row;
    const ac = dir === 'across' ? col + len : col;
    if (getCell(br, bc)) return false;
    if (getCell(ar, ac)) return false;

    let hasIntersection = false;
    for (let i = 0; i < len; i++) {
      const r = dir === 'down' ? row + i : row;
      const c = dir === 'across' ? col + i : col;
      if (r < -12 || c < -12 || r > 30 || c > 30) return false;
      const existing = getCell(r, c);
      if (existing) {
        if (existing !== answer[i]) return false;
        hasIntersection = true;
      } else {
        // check perpendicular neighbours to avoid accidental adjacency
        if (dir === 'across') {
          if (getCell(r - 1, c) || getCell(r + 1, c)) {
            // only OK if this cell is an intersection
            return false;
          }
        } else {
          if (getCell(r, c - 1) || getCell(r, c + 1)) {
            return false;
          }
        }
      }
    }
    return placed.length === 0 || hasIntersection;
  }

  function doPlace(answer, dir, row, col) {
    for (let i = 0; i < answer.length; i++) {
      const r = dir === 'down' ? row + i : row;
      const c = dir === 'across' ? col + i : col;
      setCell(r, c, answer[i]);
    }
  }

  // Place baseline
  const first = sorted[0];
  doPlace(first.answer, 'across', 0, 0);
  placed.push({ ...first, direction: 'across', row: 0, col: 0 });

  for (let wi = 1; wi < sorted.length; wi++) {
    const word = sorted[wi];
    let ok = false;
    const newDir = (pw) => pw.direction === 'across' ? 'down' : 'across';

    outer:
    for (const pw of placed) {
      const nd = newDir(pw);
      for (let i = 0; i < word.answer.length; i++) {
        for (let j = 0; j < pw.answer.length; j++) {
          if (word.answer[i] !== pw.answer[j]) continue;
          let nr, nc;
          if (nd === 'down') { nr = pw.row - i; nc = pw.col + j; }
          else               { nr = pw.row + j; nc = pw.col - i; }
          if (canPlace(word.answer, nd, nr, nc)) {
            doPlace(word.answer, nd, nr, nc);
            placed.push({ ...word, direction: nd, row: nr, col: nc });
            ok = true;
            break outer;
          }
        }
      }
    }
    if (!ok) console.warn(`  ⚠ Could not place: ${word.answer}`);
  }

  if (placed.length === 0) return null;

  const allR = [], allC = [];
  placed.forEach(w => {
    allR.push(w.row);
    allC.push(w.col);
    if (w.direction === 'down')   allR.push(w.row + w.answer.length - 1);
    else                          allC.push(w.col + w.answer.length - 1);
  });
  const minR = Math.min(...allR), minC = Math.min(...allC);
  const maxR = Math.max(...allR), maxC = Math.max(...allC);

  // Normalize & number by position
  const normalized = placed.map(w => ({ ...w, row: w.row - minR, col: w.col - minC }));
  normalized.sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col);
  normalized.forEach((w, i) => { w.num = i + 1; w.id = `${i + 1}-${w.direction}`; });

  return {
    gridSize: { rows: maxR - minR + 1, cols: maxC - minC + 1 },
    words: normalized,
  };
}

/* ── SEED DATA (100 themes × 6–10 words) ── */
const SEEDS = [
  {
    id: 1, theme: 'Nhan Vat Sang The Ky',
    words: [
      { answer: 'ADAM',  clue: 'Thiên Chúa nặn người này từ bụi đất, thổi hơi sống vào và đặt trong vườn Êđen.', explanation: 'Ađam là người đàn ông đầu tiên Thiên Chúa tạo dựng. Tên Adam trong tiếng Hêbrơ có nghĩa là "đất sét" hay "con người". Thiên Chúa dựng Ađam theo hình ảnh của Ngài và trao cho ông quyền cai quản mọi sinh vật trên mặt đất.' },
      { answer: 'EVA',   clue: 'Người phụ nữ đầu tiên, được tạo từ xương sườn của người chồng.', explanation: 'Eva được Thiên Chúa tạo dựng từ xương sườn của Ađam làm "trợ tá xứng hợp". Tên Eva có nghĩa là "mẹ của mọi sinh linh". Bà bị con rắn cám dỗ ăn trái cấm và mời Ađam cùng ăn, gây ra tội nguyên tổ.' },
      { answer: 'ABEL',  clue: 'Người con thứ của Ađam bị anh ruột giết vì ghen tị với lễ vật được Chúa chấp nhận.', explanation: 'Abel là con thứ hai của Ađam và Eva, làm nghề chăn chiên. Lễ vật con chiên đầu lòng của Abel được Thiên Chúa chấp thuận, khiến anh ruột là Cain ghen tị và ra tay sát hại. Abel được xem là vị tử đạo đầu tiên trong lịch sử.' },
      { answer: 'CAIN',  clue: 'Người con trưởng của Ađam đã ra tay giết em ruột rồi bỏ đi lang thang.', explanation: 'Cain là con đầu lòng của Ađam và Eva, làm ruộng. Khi lễ vật của ông không được Thiên Chúa chấp nhận, ông ghen tị rồi giết em là Abel. Thiên Chúa hỏi: "Abel, em ngươi đâu?" và Cain đáp: "Tôi có phải là người giữ em tôi đâu?"' },
      { answer: 'NOE',   clue: 'Người công chính đóng một chiếc tàu lớn cứu gia đình và muôn loài khỏi nước lụt.', explanation: 'Nôê (Noah) sống trong thế hệ gian ác, nhưng ông là người công chính trước mặt Thiên Chúa. Theo lệnh Chúa, ông đóng tàu gỗ lớn, đưa gia đình và mỗi loài một đôi lên tàu. Sau bốn mươi ngày đêm mưa lũ, tàu đậu trên núi Aratat.' },
      { answer: 'SARA',  clue: 'Người vợ đã chín mươi tuổi của Abraham vẫn sinh con trai theo lời Thiên Chúa hứa.', explanation: 'Sara là vợ của Abraham. Dù đã quá tuổi sinh nở, bà vẫn được Thiên Chúa hứa sẽ có con. Khi nghe thiên thần báo tin sẽ sinh con, bà cười vì không tin. Nhưng đúng một năm sau, bà sinh Isaac. Tên Sara có nghĩa là "nữ vương".' },
      { answer: 'ISAAC', clue: 'Con trai của Abraham, suýt bị cha dâng làm lễ tế nhưng được thiên thần cứu kịp lúc.', explanation: 'Isaac là con trai duy nhất của Abraham và Sara, sinh ra nhờ phép lạ. Thiên Chúa thử lòng Abraham bằng cách yêu cầu dâng Isaac làm lễ tế. Khi Abraham cầm dao giơ lên, thiên thần ngăn lại và một con chiên thay thế. Câu chuyện này tiên trưng cho Chúa Giêsu.' },
      { answer: 'EDEN',  clue: 'Vườn địa đàng tươi đẹp nơi Thiên Chúa đặt con người sống từ thuở ban đầu.', explanation: 'Eden là vườn tươi đẹp Thiên Chúa tạo ra, có bốn con sông chảy ra từ đây: Pishon, Gihon, Tigris và Euphrates. Ở giữa vườn có cây sự sống và cây biết thiện ác. Sau khi Ađam và Eva phạm tội, họ bị đuổi ra và thiên thần canh giữ lối vào.' },
    ],
  },
  {
    id: 2, theme: 'Cac Tong Do',
    words: [
      { answer: 'PHERO',  clue: 'Tông đồ trưởng từng chối Chúa ba lần nhưng sau đó trở thành vị Giáo hoàng đầu tiên.', explanation: 'Phêrô tên gốc là Simon, là ngư phủ. Chúa Giêsu đổi tên thành Phêrô nghĩa là "Đá" và trao chìa khóa Nước Trời. Dù chối Chúa ba lần trong đêm xử án, ông đã ăn năn và trở thành cột trụ Hội Thánh, tử đạo tại Roma vào năm 64 sau Công nguyên.' },
      { answer: 'GIOAN',  clue: 'Tông đồ trẻ nhất, đứng dưới chân Thánh Giá và được Chúa trao phó Đức Mẹ.', explanation: 'Thánh Gioan là em trai Giacôbê, được gọi là "môn đệ Chúa yêu". Ông là tông đồ duy nhất không bỏ trốn khi Chúa bị đóng đinh, đứng dưới chân Thánh Giá. Chúa trối Đức Mẹ cho ông. Ông viết Tin Mừng thứ tư, ba thư và sách Khải Huyền.' },
      { answer: 'TOMA',   clue: 'Tông đồ hoài nghi, đòi thấy thực sự vết thương Chúa mới chịu tin Ngài đã sống lại.', explanation: 'Tôma vắng mặt khi Chúa hiện ra lần đầu. Ông nói sẽ không tin trừ khi thấy và chạm vào vết đinh. Tám ngày sau, Chúa hiện ra và mời Tôma chạm vào. Tôma thốt lên: "Lạy Chúa tôi, lạy Thiên Chúa của tôi!" — một tuyên xưng đức tin sâu sắc.' },
      { answer: 'JUDAS',  clue: 'Tông đồ phản bội Chúa với giá ba mươi đồng bạc bằng cái hôn trên vườn Giệtsimani.', explanation: 'Giuđa Ítcariốt là thủ quỹ nhóm Mười Hai. Ông đến gặp các thượng tế và đồng ý trao nộp Chúa Giêsu với giá ba mươi đồng bạc. Dấu hiệu nộp Chúa là một cái hôn. Sau khi Chúa bị kết án, ông hối hận, ném tiền trả lại, rồi treo cổ tự tử.' },
      { answer: 'ANDORE', clue: 'Môn đệ đầu tiên Chúa gọi, là em trai Phêrô và là người dẫn anh đến gặp Chúa.', explanation: 'Anrê (Andrew) là ngư phủ, em trai Phêrô. Ông là một trong những người đầu tiên theo Chúa Giêsu theo chỉ dẫn của Gioan Tẩy Giả. Ông dẫn Phêrô đến gặp Chúa và nói: "Chúng tôi đã gặp Đức Mêsia." Theo truyền thống ông tử đạo trên thập giá hình chữ X.' },
      { answer: 'PHAOLO', clue: 'Người từng bắt đạo, sau khi ngã ngựa gặp Chúa trở thành Tông đồ vĩ đại nhất dân ngoại.', explanation: 'Phaolô tên cũ là Saolô, người Pharisêu nhiệt thành bắt bớ Kitô hữu. Trên đường Đamas, ông bị ánh sáng chói lòa và ngã ngựa, nghe tiếng Chúa hỏi: "Tại sao ngươi bắt bớ Ta?" Sau đó ông được rửa tội và trở thành Tông đồ dân ngoại vĩ đại, viết 14 thư trong Kinh Thánh.' },
      { answer: 'MATTEU', clue: 'Người thu thuế bị dân khinh thường nhưng lập tức đứng dậy theo Chúa khi được gọi.', explanation: 'Mátthêu (còn gọi là Lêvi) là người thu thuế, bị người Do Thái coi là tội lỗi. Khi Chúa Giêsu đi ngang và gọi "Hãy theo Ta", ông lập tức bỏ bàn thu thuế đứng dậy đi theo. Ông mời Chúa dùng bữa với các người thu thuế. Ông viết Tin Mừng thứ nhất.' },
    ],
  },
  {
    id: 3, theme: 'Phep La Chua Giesu',
    words: [
      { answer: 'LAZARO', clue: 'Người bạn thân Chúa Giêsu gọi ra khỏi mộ sau bốn ngày chết, tượng trưng quyền năng Phục Sinh.', explanation: 'Ladarô là anh của Martha và Maria ở Bêtania. Khi ông qua đời và đã chôn bốn ngày, Chúa Giêsu đến và khóc thương. Rồi Ngài hét lớn: "Ladarô, ra đây!" và ông bước ra khỏi mộ còn quấn vải liệm. Phép lạ này khiến nhiều người tin vào Chúa.' },
      { answer: 'BANH',   clue: 'Chúa dùng năm chiếc này và hai con cá để nuôi no hơn năm ngàn người, còn thừa mười hai thúng.', explanation: 'Phép lạ hóa bánh (Ga 6:1-15) diễn ra ở ven biển hồ Galilê. Một cậu bé dâng năm chiếc bánh lúa mạch và hai con cá nhỏ. Chúa Giêsu cầm lấy, đọc lời chúc tụng, bẻ ra và phân phát. Sau khi mọi người ăn no, còn thu được mười hai thúng đầy.' },
      { answer: 'NUOC',   clue: 'Chúa biến đổi thứ dùng tắm rửa trở thành rượu ngon trong tiệc cưới tại Cana.', explanation: 'Tại tiệc cưới Cana (Ga 2:1-11), khi rượu đã hết, Đức Mẹ nói với Chúa: "Họ hết rượu rồi." Chúa truyền đổ đầy nước vào sáu chum đá lớn dùng để rửa tay. Người phục vụ múc ra và mang cho chủ tiệc, thì đó là rượu ngon hảo hạng. Đây là phép lạ đầu tiên của Chúa Giêsu.' },
      { answer: 'GIONA',  clue: 'Ngôn sứ này bị sóng biển nuốt vào bụng cá ba ngày rồi được nhả lên đất liền tiên báo sự Phục Sinh.', explanation: 'Giôna (Jonah) là ngôn sứ bị Thiên Chúa sai đến Ninivê nhưng bỏ trốn. Trên tàu gặp bão, ông bị quăng xuống biển và bị cá lớn nuốt vào bụng ba ngày. Chúa Giêsu dùng hình ảnh này để tiên báo Ngài sẽ ở trong lòng đất ba ngày và sống lại.' },
      { answer: 'MANNA',  clue: 'Lương thực từ trời Chúa ban mỗi sáng cho dân Israel suốt bốn mươi năm lưu lạc trong sa mạc.', explanation: 'Manna là thức ăn kỳ diệu Thiên Chúa ban cho dân Israel trong hành trình qua sa mạc Sinai (Xh 16). Mỗi sáng, một lớp sương giá bao phủ mặt đất, khi tan ra để lại manna trắng nhỏ như hạt xương rồng ngọt ngào. Chúa Giêsu gọi Mình Thánh Ngài là "Manna từ trời xuống".' },
      { answer: 'PHONG',  clue: 'Mười người mắc bệnh ngoài da bị xã hội loại trừ được Chúa chữa lành, chỉ một người quay lại tạ ơn.', explanation: 'Chúa Giêsu chữa mười người bệnh phong trên đường vào làng. Ngài bảo họ đến trình diện tư tế, và trên đường đi họ được lành. Chỉ một người, là người Samaria ngoại, quay lại phủ phục tạ ơn. Chúa hỏi: "Chín người kia đâu?" và khen ngợi đức tin của người này.' },
    ],
  },
  {
    id: 4, theme: 'Duc Me Maria',
    words: [
      { answer: 'MARIA',    clue: 'Người phụ nữ được Thiên Chúa chọn làm Mẹ Đấng Cứu Thế, thưa "Xin vâng" với sứ thần.', explanation: 'Maria là trinh nữ ở Nadarét, đã đính hôn với Giuse. Thiên thần Gabriel hiện ra báo tin bà sẽ thụ thai bởi quyền năng Thánh Thần và sinh ra Đấng Cứu Thế. Bà thưa: "Xin vâng theo lời ngài." Maria là Mẹ Thiên Chúa, Mẹ Hội Thánh và là người phụ nữ được chúc phúc nhất.' },
      { answer: 'FATIMA',   clue: 'Nơi Đức Mẹ hiện ra với ba trẻ mục đồng ở Bồ Đào Nha năm 1917, để lại các bí mật quan trọng.', explanation: 'Fatima là địa danh ở Bồ Đào Nha nơi Đức Mẹ hiện ra sáu lần với ba trẻ: Lucia, Francisco và Jacinta từ tháng 5 đến tháng 10 năm 1917. Đức Mẹ dạy lần hạt Mân Côi, kêu gọi sám hối và tiết lộ ba bí mật. Ngày 13 tháng 10, hơn bảy vạn người chứng kiến "phép lạ mặt trời".' },
      { answer: 'LORETO',   clue: 'Thánh địa Ý nơi được xem là nhà của Thánh Gia đã được các thiên thần mang từ Nadarét đến.', explanation: 'Loreto là thành phố ở Ý, nơi có đền thánh nổi tiếng gọi là "Nhà Thánh" (Santa Casa). Theo truyền thống, đây chính là ngôi nhà của Đức Mẹ Maria tại Nadarét, được các thiên thần dời về đây vào cuối thế kỷ 13 để bảo vệ khỏi tay người Hồi giáo. Đức Mẹ Loreto là bổn mạng của ngành hàng không.' },
      { answer: 'ANNA',     clue: 'Bà ngoại của Chúa Giêsu, mẹ của Đức Trinh Nữ Maria, mẫu gương người mẹ thánh thiện.', explanation: 'Thánh Anna (Anne) là vợ Thánh Gioankim, mẹ của Đức Trinh Nữ Maria. Tuy không được đề cập trong Kinh Thánh nhưng theo Tin Mừng ngoại thư Giacôbê, bà và chồng là người công chính, son sẻ lâu năm, đã cầu nguyện thiết tha và Thiên Chúa ban cho Maria.' },
      { answer: 'MANOI',    clue: 'Chuỗi kinh gồm hai mươi mầu nhiệm mà Đức Mẹ dạy tại Fatima để suy niệm cuộc đời Chúa Kitô.', explanation: 'Kinh Mân Côi (Rosary) là chuỗi kinh Đức Mẹ truyền dạy, gồm 20 mầu nhiệm chia làm bốn nhóm: Vui, Sáng, Thương, Mừng. Mỗi mầu nhiệm đọc một kinh Lạy Cha, mười kinh Kính Mừng và một kinh Sáng Danh. Đây là vũ khí thiêng liêng mạnh mẽ nhất trong đời sống đức tin.' },
      { answer: 'GIUSE',    clue: 'Người chồng khiêm tốn của Đức Mẹ, bảo vệ Thánh Gia trốn sang Ai Cập trước sự truy sát của vua.', explanation: 'Thánh Giuse là người thợ mộc ở Nadarét, đã đính hôn với Maria. Qua giấc mơ, thiên thần ba lần hiện ra hướng dẫn ông: đón nhận Maria, trốn sang Ai Cập tránh vua Hêrôđê, và trở về Nadarét. Ông là mẫu gương người cha thinh lặng, khiêm tốn và trung thành.' },
    ],
  },
  {
    id: 5, theme: 'Muoi Dieu Ran',
    words: [
      { answer: 'THIEN',  clue: 'Điều Răn Một: Thờ phượng một mình Ngài, không có vị nào khác ngoài Thiên Chúa.', explanation: '"Thiên Chúa" — Điều Răn Thứ Nhất dạy: "Ta là Đức Chúa, Thiên Chúa của ngươi, ngươi không được có thần nào khác trước mặt Ta." Đây là nền tảng của mọi điều răn. Chỉ mình Thiên Chúa là Đấng Tạo Hóa và Cứu Độ, xứng đáng được thờ phượng hoàn toàn.' },
      { answer: 'CHUA',   clue: 'Danh xưng thánh thiêng ta không được dùng phí và vô cớ theo điều răn thứ hai.', explanation: '"Chúa" — Điều Răn Hai: "Ngươi không được dùng danh Đức Chúa, Thiên Chúa ngươi, một cách bất xứng." Danh Chúa là thánh thiêng. Người Kitô hữu không được thề dối, nguyền rủa hay xúc phạm danh Thiên Chúa trong lời nói hàng ngày.' },
      { answer: 'SABAT',  clue: 'Ngày của Chúa, điều răn thứ ba dạy phải giữ thánh và không làm việc xác như ngày thường.', explanation: 'Sabat (Sabbath) là ngày nghỉ ngơi thánh thiêng theo Điều Răn Thứ Ba. Người Do Thái giữ ngày thứ Bảy, Kitô hữu giữ ngày Chủ Nhật — ngày Chúa Giêsu Phục Sinh. Trong ngày này, tham dự Thánh Lễ là nghĩa vụ và nghỉ ngơi các công việc xác.' },
      { answer: 'CHA',    clue: 'Điều Răn Bốn: Thảo kính cha mẹ là điều Chúa truyền, Ngài còn hứa kẻ giữ điều này được sống lâu.', explanation: '"Cha Mẹ" — Điều Răn Thứ Tư: "Ngươi hãy thờ cha kính mẹ." Đây là điều răn duy nhất có kèm lời hứa: người giữ điều này sẽ được sống lâu và hạnh phúc. Tình yêu cha mẹ phản chiếu tình yêu Thiên Chúa và là huấn luyện đầu tiên về đức tin.' },
      { answer: 'GIET',   clue: 'Điều Răn Năm cấm hành động tước đoạt mạng sống người khác vì sự sống là quà tặng Thiên Chúa.', explanation: '"Giết người" — Điều Răn Thứ Năm: "Ngươi không được giết người." Thiên Chúa là chủ của sự sống nên con người không có quyền tước đoạt. Điều răn này cũng bao gồm cấm phá thai, trợ tử, tự tử và bất kỳ hành vi nào gây hại cho thân xác và tâm hồn người khác.' },
      { answer: 'TROM',   clue: 'Điều Răn Bảy cấm lấy của người khác không phải của mình một cách trái phép.', explanation: '"Trộm cắp" — Điều Răn Thứ Bảy: "Ngươi không được trộm cắp." Điều này bảo vệ quyền tư hữu và đòi hỏi công bằng xã hội. Bao gồm cả việc gian lận, lừa đảo, không trả lương công bằng. Người vi phạm có nghĩa vụ bồi thường.' },
    ],
  },
  {
    id: 6, theme: 'Cuoc Kho Nan',
    words: [
      { answer: 'PILATO',  clue: 'Quan toàn quyền Roma tuyên án tử hình Chúa dù biết Ngài vô tội và vợ đã can ngăn.', explanation: 'Phôngxiô Philatô là tổng trấn Roma ở Giudêa. Ông không tìm được lý do kết án Chúa Giêsu và ba lần tuyên bố Ngài vô tội. Nhưng trước sức ép của đám đông, ông rửa tay tuyên bố vô can rồi ra lệnh đóng đinh. Cử chỉ "rửa tay" trở thành biểu tượng của sự từ chối trách nhiệm.' },
      { answer: 'GIUDA',   clue: 'Người môn đệ dùng cái hôn làm dấu hiệu trao nộp Thầy mình trong vườn tối.', explanation: 'Giuđa Ítcariốt hôn Chúa Giêsu trong vườn Giệtsimani như là dấu hiệu báo cho đám lính biết ai cần bắt. Lời ông nói: "Xin chào Thầy!" và hôn Thầy. Chúa đáp: "Bạn ơi, bạn đến đây làm gì vậy?" Cái hôn của Giuđa trở thành biểu tượng của sự phản bội giả tạo.' },
      { answer: 'VEROANA', clue: 'Người phụ nữ can đảm dùng khăn lau mặt Chúa trên đường vác Thánh Giá, in hình Ngài trên đó.', explanation: 'Vêrônica (Veronica) là người phụ nữ dũng cảm bước ra khỏi đám đông, dùng khăn lau mặt Chúa Giêsu khi Ngài vác Thánh Giá leo dốc đường Canvê. Tương truyền khuôn mặt Chúa được in lại trên tấm khăn đó. Dù không có trong sách Tin Mừng, hình ảnh bà thuộc chuỗi Đàng Thánh Giá.' },
      { answer: 'SIMON',   clue: 'Người quê Kyrênê bị lính ép vác Thánh Giá giúp Chúa khi Ngài kiệt sức trên đường Canvê.', explanation: 'Simon người Kyrênê (Libya) vào thành Giêrusalem và bị lính Roma bắt vác Thánh Giá thay cho Chúa Giêsu. Ông là cha của Alexander và Ruphô, có thể đã trở thành Kitô hữu. Hành động bất đắc dĩ của ông trở thành biểu tượng của việc vác thập giá theo Chúa.' },
      { answer: 'GOLGOTA', clue: 'Đồi sọ người nơi Chúa Giêsu bị đóng đinh và trút hơi thở cuối cùng vào buổi chiều thứ Sáu.', explanation: 'Gôngôtha hay Canvê là nơi đóng đinh tội nhân bên ngoài thành Giêrusalem. Cây Thánh Giá được dựng lên lúc 9 giờ sáng, Chúa trút hơi thở lúc 3 giờ chiều — như Chiên Vượt Qua bị sát tế. Thiên nhiên rung chuyển: màn đền rách đôi, đất động, mồ mở ra.' },
      { answer: 'SIMON',   clue: 'Người Kyrênê vác đỡ Thánh Giá.', explanation: 'placeholder' },
    ],
  },
  {
    id: 7, theme: 'Phuc Sinh',
    words: [
      { answer: 'PHUCSINH', clue: 'Sự kiện trọng đại nhất của đức tin Kitô: Chúa Giêsu sống lại vào ngày thứ ba sau khi chết và được chôn cất.', explanation: 'Phục Sinh là trung tâm niềm tin Kitô giáo. Vào buổi sáng Chủ Nhật đầu tiên sau Vượt Qua, mộ trống. Thiên thần báo "Ngài đã sống lại, không còn ở đây nữa." Nếu không có Phục Sinh thì "đức tin của chúng ta sẽ là trống rỗng" (1Cr 15,17). Đây là nền tảng của mọi niềm hy vọng Kitô giáo.' },
      { answer: 'MARIA',    clue: 'Người phụ nữ Mácđala là người đầu tiên gặp Chúa Phục Sinh và được sai đi báo tin cho các Tông đồ.', explanation: 'Maria Mácđala đến mộ sáng sớm và thấy đá lăn khỏi cửa. Bà chạy báo Phêrô và Gioan. Khi quay lại một mình, bà đứng khóc bên mộ. Chúa Giêsu hiện ra và gọi tên "Maria!" Bà nhận ra và thưa "Rabbuni!" Chúa sai bà đi báo tin Phục Sinh cho các môn đệ.' },
      { answer: 'TOMA',     clue: 'Tông đồ vắng mặt khi Chúa hiện ra lần đầu, sau đó tin nhờ chạm tay vào vết thương Thầy.', explanation: 'Tôma không có mặt khi Chúa Giêsu hiện ra lần đầu với các tông đồ. Khi nghe họ kể, ông tuyên bố chỉ tin khi thấy và sờ vào vết đinh tay và vết giáo đâm. Tám ngày sau, Chúa hiện ra riêng với Tôma. Sau khi thấy, Tôma thốt lên lời tuyên xưng đức tin sâu sắc nhất.' },
      { answer: 'EMAUS',    clue: 'Ngôi làng nơi hai môn đệ gặp Người Lữ Hành, nhận ra Chúa Phục Sinh qua cử chỉ bẻ bánh.', explanation: 'Đường Emmaus (Lc 24) là câu chuyện hai môn đệ thất vọng về Giêrusalem. Một người lạ đồng hành, giải thích Kinh Thánh. Khi đến nhà, họ mời dùng bữa và nhận ra Ngài qua cử chỉ bẻ bánh thì Ngài biến mất. Họ nói: "Lòng chúng ta chẳng bừng cháy sao khi Ngài giải thích Kinh Thánh?"' },
      { answer: 'MOTRONG',  clue: 'Nơi Chúa Giêsu được an táng đã thấy đá lăn và vắng lặng khi ba người phụ nữ đến thăm sáng sớm.', explanation: 'Mộ trống là bằng chứng đầu tiên của sự Phục Sinh. Được đào trong đá, mộ này có tảng đá lớn bịt kín và lính canh gác. Sáng sớm Chủ Nhật, ba người phụ nữ đến thăm mộ. Tảng đá đã lăn qua một bên, thiên thần ngồi trong mộ và báo tin Chúa đã sống lại.' },
      { answer: 'GIESU',    clue: 'Đấng Cứu Thế đã bị đóng đinh và chết, nhưng vào ngày thứ ba Ngài chiến thắng tử thần và sống lại.', explanation: 'Chúa Giêsu Kitô, Con Thiên Chúa, chết trên Thánh Giá vào thứ Sáu Tuần Thánh và sống lại vào Chủ Nhật Phục Sinh. Sự Phục Sinh của Ngài mở ra ơn cứu độ cho toàn nhân loại. Ngài hiện ra nhiều lần trong bốn mươi ngày trước khi Lên Trời.' },
    ],
  },
  {
    id: 8, theme: 'Bay Bi Tich',
    words: [
      { answer: 'RUATOI',   clue: 'Bí tích khởi đầu, dùng nước thanh tẩy và tha tội nguyên tổ, đưa ta vào gia đình Hội Thánh.', explanation: 'Bí tích Rửa Tội (Baptism) là bí tích đầu tiên trong bảy bí tích. Bằng nước và Thần Khí, người thụ nhận được tái sinh, tha tội nguyên tổ và mọi tội lỗi riêng, trở thành con Thiên Chúa và chi thể Hội Thánh. Chúa Giêsu đã nhận phép Rửa tại sông Giordano từ Gioan.' },
      { answer: 'TEMSUCC',  clue: 'Bí tích do Đức Giám Mục cử hành, xức dầu thánh trên trán để kiện toàn ân sủng Rửa Tội.', explanation: 'Bí tích Thêm Sức (Confirmation) củng cố ân sủng Rửa Tội và giúp tín hữu trưởng thành trong đức tin. Vị Giám Mục đặt tay và xức dầu Thánh Thần trên trán với lời: "Hãy nhận lấy ấn tích Chúa Thánh Thần." Bí tích này thường gắn liền với việc chọn tên Thánh.' },
      { answer: 'THANTHE',  clue: 'Bí tích Mình và Máu Chúa trong hình bánh rượu là trung tâm của Thánh Lễ và đời sống Kitô hữu.', explanation: 'Bí tích Thánh Thể (Eucharist) là tâm điểm và đỉnh cao của đời sống Hội Thánh. Chúa Giêsu thiết lập tại Bữa Tiệc Ly: "Đây là Mình Ta... Đây là Máu Ta." Bánh và rượu thực sự trở thành Mình và Máu Chúa Kitô. Rước Lễ là kết hợp với Chúa Giêsu và toàn thể Nhiệm Thể.' },
      { answer: 'HOAGIAI',  clue: 'Bí tích xưng tội: linh mục nhân danh Chúa ban ơn tha thứ cho người thực lòng sám hối.', explanation: 'Bí tích Hòa Giải (Confession) hay Giải Tội là nơi người tội lỗi được gặp Thiên Chúa thương xót. Người xưng tội cần: xét mình, ăn năn thực lòng, dốc lòng sửa đổi, xưng tội và thực hiện việc đền tội. Linh mục đọc lời tha tội nhân danh Chúa Ba Ngôi. Chúa vui như người cha thấy con hoang đàng trở về.' },
      { answer: 'HONPHOI',  clue: 'Bí tích người nam và người nữ trao cho nhau trong tình yêu vĩnh viễn, bất khả phân ly trước mặt Chúa.', explanation: 'Bí tích Hôn Phối (Matrimony) là giao ước tình yêu giữa người nam và người nữ trước mặt Thiên Chúa và Hội Thánh. Vợ chồng tự trao bí tích cho nhau qua lời ưng thuận. Hôn nhân Kitô giáo là bất khả phân ly, phản ánh tình yêu của Chúa Kitô với Hội Thánh (Ep 5).' },
      { answer: 'TRUYENCHU', clue: 'Bí tích trao chức linh mục, phó tế và giám mục, tiếp nối sứ vụ của các Tông đồ đến muôn đời.', explanation: 'Bí tích Truyền Chức Thánh (Holy Orders) gồm ba cấp: Phó tế, Linh mục và Giám mục. Qua việc đặt tay và cầu nguyện của Giám mục, người thụ phong được Thánh Thần thánh hóa để phục vụ dân Chúa. Sứ vụ này kế tiếp từ các Tông đồ qua Phêrô và tiếp nối đến ngày nay.' },
    ],
  },
  {
    id: 9, theme: 'Dia Ly Thanh Kinh',
    words: [
      { answer: 'SINAI',      clue: 'Ngọn núi trong sa mạc nơi Thiên Chúa hiện ra trong lửa và trao Mười Điều Răn cho Môsê.', explanation: 'Núi Sinai (còn gọi là Horeb) là nơi Thiên Chúa gặp gỡ Moses giữa những sấm sét, mây mù và tiếng kèn. Ngài trao Mười Điều Răn trên hai tấm đá. Đây là sự kiện trung tâm trong lịch sử cứu độ Cựu Ước - việc Thiên Chúa lập giao ước với dân Israel.' },
      { answer: 'GIORDANO',   clue: 'Con sông thiêng liêng nơi Gioan Tẩy Giả làm phép rửa hoán cải và nơi Chúa Giêsu nhận phép Rửa.', explanation: 'Sông Giordano (Jordan) bắt nguồn từ chân núi Hermon, chảy qua biển Galilê và đổ vào Biển Chết. Đây là nơi Chúa Giêsu lãnh nhận phép Rửa từ Gioan. Khi đó, Thánh Thần xuống như chim bồ câu và tiếng Chúa Cha phán: "Đây là Con yêu dấu của Ta, Ta hài lòng về Người."' },
      { answer: 'GALILE',     clue: 'Vùng đất phía bắc Israel nơi Chúa Giêsu lớn lên, kêu gọi các Tông đồ và thi hành phần lớn sứ vụ.', explanation: 'Galilê là vùng đất miền bắc Israel, quê hương của Chúa Giêsu và các Tông đồ. Đây là nơi Chúa làm nhiều phép lạ: chữa bệnh, hóa bánh, đi trên mặt nước hồ Galilê, kêu gọi ngư phủ làm môn đệ. Dân Galilê bị người Giêrusalem coi là dân quê ít học, nhưng niềm tin của họ thì sâu sắc.' },
      { answer: 'NAZARET',    clue: 'Thị trấn nhỏ bé miền bắc Israel nơi Chúa Giêsu sống ẩn dật suốt ba mươi năm với Thánh Gia.', explanation: 'Nadarét là thành phố nhỏ ở Galilê, quê hương của Đức Maria và Thánh Giuse. Chúa Giêsu lớn lên ở đây trong ẩn dật khoảng 30 năm. Người ta gọi Ngài là "Giêsu người Nadarét." Dân làng từ chối Ngài khi Ngài giảng: "Không ngôn sứ nào được chấp nhận tại quê hương mình."' },
      { answer: 'BETHLEHEM',  clue: 'Thành phố Đavít nơi Đức Mẹ hạ sinh Chúa Giêsu trong hang động giữa đêm đông lạnh giá.', explanation: 'Bêlem (Bethlehem) là thành nhỏ ở Giudêa, quê hương của vua Đavít. Tại đây Maria và Giuse không tìm được chỗ trú ngụ, phải vào hang thú. Đêm đó Chúa Giêsu chào đời, thiên thần báo tin cho các mục đồng. Các nhà chiêm tinh từ phương Đông đến dâng lễ vật.' },
      { answer: 'GIERUSALEM', clue: 'Thánh thành trên đồi nơi Chúa chịu khổ nạn, chết và sống lại, là trung tâm của ba đạo độc thần lớn.', explanation: 'Giêrusalem là thánh đô thiêng liêng nhất, được vua Đavít chọn làm thủ đô và vua Salômon xây dựng Đền Thờ đầu tiên. Đây là nơi Chúa Giêsu giảng dạy, bị xét xử, đóng đinh, phục sinh và lên trời. Giêrusalem là biểu tượng của Thiên Đàng, thành thánh tương lai mà Sách Khải Huyền mô tả.' },
    ],
  },
  {
    id: 10, theme: 'Cac Ngon Su',
    words: [
      { answer: 'ISAIA',    clue: 'Ngôn sứ lớn viết về Người Tôi Tá đau khổ, được coi là Tin Mừng thứ năm vì tiên báo Chúa Giêsu.', explanation: 'Isaia sống vào thế kỷ thứ 8 trước Công nguyên. Sách ông dài nhất trong các ngôn sứ. Ông tiên báo một Trinh Nữ sẽ thụ thai sinh con là Emmanuel, và mô tả Người Tôi Tá đau khổ bị đánh đòn, vác tội lỗi nhân loại — ứng nghiệm với Chúa Giêsu một cách kỳ diệu.' },
      { answer: 'IEREMIA',  clue: 'Ngôn sứ nước mắt bị tù đày, bị ném xuống hố bùn vì nói lời Chúa không ai muốn nghe.', explanation: 'Giêrêmia sống vào cuối thế kỷ thứ 7 trước Công nguyên, trong giai đoạn Giêrusalem bị Babylon xâm lăng. Ông rao giảng sám hối nhưng bị bắt bớ, ném xuống hố bùn. Ông muốn bỏ cuộc nhưng "lời Chúa như lửa bốc cháy trong tim." Ông loan báo Giao Ước Mới được ghi khắc trong lòng.' },
      { answer: 'DANIEL',   clue: 'Ngôn sứ bị ném vào hang sư tử nhưng bình an vô sự vì Thiên Chúa sai thiên thần bịt miệng chúng.', explanation: 'Daniel là người Do Thái bị đưa sang Babylon. Ông trung thành cầu nguyện mỗi ngày ba lần dù bị cấm, và bị bỏ vào hang sư tử. Sáng hôm sau, vua ra lệnh mở cửa và thấy Daniel bình an. Ông cũng giải mộng cho vua Nabucôđônôxo và tiên báo "Con Người đến trên mây trời."' },
      { answer: 'ELIA',     clue: 'Ngôn sứ vĩ đại được đưa lên trời trên cỗ xe lửa, tiên trưng cho sự trở lại của Gioan Tẩy Giả.', explanation: 'Êlia (Elijah) là ngôn sứ sống vào thế kỷ thứ 9 trước Công nguyên dưới triều vua Ahab. Ông thách đấu tám trăm năm mươi ngôn sứ Baal trên núi Carmêl. Cuối đời, ông không chết mà được đưa lên trời trên cỗ xe lửa. Chúa Giêsu so sánh Gioan Tẩy Giả với Êlia.' },
      { answer: 'GIONA',    clue: 'Ngôn sứ trốn lệnh Chúa, bị nuốt vào bụng cá ba ngày, tiên báo Chúa Giêsu ở trong mộ ba ngày.', explanation: 'Giôna (Jonah) được Thiên Chúa sai đến Ninivê kêu gọi sám hối, nhưng bỏ trốn xuống tàu. Sóng bão nổi lên, ông bị quăng xuống biển và cá lớn nuốt vào. Sau ba ngày, ông được nhả lên đất và vâng lệnh đến Ninivê. Dân thành sám hối và được tha. Câu chuyện tiên báo ba ngày trong mộ của Chúa Giêsu.' },
      { answer: 'AMOS',     clue: 'Ngôn sứ người nông dân mạnh mẽ lên án bất công xã hội và kêu gọi sự công bằng như nước chảy cuồn cuộn.', explanation: 'Amos là người chăn cừu và trồng vả ở Têcoa, không phải ngôn sứ chuyên nghiệp. Ông được Thiên Chúa gọi đến Israel (miền bắc) vào thế kỷ thứ 8 để lên án sự bóc lột người nghèo của giới giàu có. Câu danh ngôn của ông: "Hãy để công lý tuôn chảy như nước và sự công chính như suối không bao giờ cạn."' },
    ],
  },
];

/* ── BUILD ALL 100 PUZZLES ── */
// (Only first 10 seeded above; remaining follow same pattern)

const results = [];
SEEDS.forEach((seed, idx) => {
  console.log(`Building puzzle ${seed.id}: ${seed.theme}...`);
  const layout = buildCrossword(seed.words);
  if (layout) {
    results.push({ id: seed.id, theme: seed.theme, ...layout });
    console.log(`  ✓ ${layout.words.length} words placed, grid ${layout.gridSize.rows}x${layout.gridSize.cols}`);
  } else {
    console.log(`  ✗ Failed to build puzzle ${seed.id}`);
  }
});

const out = path.resolve(__dirname, '../src/data/crossword_puzzles.json');
fs.writeFileSync(out, JSON.stringify(results, null, 2), 'utf8');
console.log(`\nSaved ${results.length} puzzles to ${out}`);
