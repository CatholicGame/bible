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
  "Giuđêa": "Giu-dơ",
  "Giuĝê": "Giu-dơ",
  "Cana": "Ca-na",
  "Golgotha": "Gôn-gô-tha",
  "Ghếtsêmani": "Gết-sê-ma-ni",
  "Èmmau": "Em-mau",
  "Sinai": "Xi-nai",
  "Canaan": "Ca-na-an",
  "Jordan": "Gio-đan",
  "Giođan": "Gio-đan",
  "Ninivê": "Ni-ni-vê",
  "Roma": "Rô-ma",
  "Antiôkia": "An-ti-ô-khi-a",
  "Ñphêsô": "Ê-phê-xô",
  
  // OT
  "Đavít": "Đa-vít",
  "Salômôn": "Sa-lô-môn",
  "Môsê": "Mô-sê",
  "Êlia": "Ê-li-a",
  "ÊLisêô": "Ê-li-sê-ô",
  "Ábraham": "Áp-ra-ham",
  "Samuel": "Sa-mu-en",
  "Giôna": "Giô-na",
  "Isaia": "I-sai-a",
  "Giêrêmia": "Giê-rê-mi-a",
  "Batseba": "Bát-sê-ba",
  "N0o*ê": "Nô-ê",
  "Israel": "�-t-ra-en",
  
  // NT
  "Pilate": "Phi-la-tô",
  "Philatô": "Phi-la-tô",
  "Stephen": "Tê-pha-nô",
  "Têphanô": "Tê-pha-nô",
  "Máccô": "Mác-cô",
  "Mátthêu": "Mát-thêu",
  "Lazarô": "La-da-rá",
  "Giakê�": "Gia-kêu",
  "Mankhô": "Man-khô",
  "Saul": "Sao-lô",
  "Saolô": "Sao-lô",
  "Phaolô": "Phao-lô",
  "Phêrá": "Phê-ré",
  "Tôma": "Tô-ma",
  "Mácta": "Mác-ta",
  "Simê
������K[p�[0�����X��1$p�p�����KX��q$p�[p�����]q'H0�]�\�xn�]����]Kq$XH0�]X�K\�Kxn�]����]q$XH����]Kq$H����\��X�ꈎ���K[�KX�H���[p�0�����K[p�]0ꈋ��\�\��H���K\�K\��H���p��XH���p�\�KXH����p��H����p�\�H���X\�XH���XK\�KXH����]\�H����]K\�H����[�[�����[�X[����X�H���KX�H����[\�X��]����[K\�KX��]������Z[��[�X�����[�^KX�����$[Z[����$K[Z[����[ۚX�H���p�[�KX�H����꛰�$ZX�0�����xn�ۈ1$8n�Xȋ��]Y�\�[�������K][�",
  "Inhaxiô": "I-nhã",
  "Têrênsa": "Tê-rê-xa",
  "Máctinô": "Mác-ti-nô",
  "Gotfroa": "Gốt-phờ-roa",
  "Giouse": "Giu-se",
  "Lazaros": "La-da-ré"	
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
        q.question = "10 tai ương xảy ra xở đãu trong Kinh Thánh?";
      }

      if (q.id === 'L03_049') {
        q.question = "Trong Mùa Phục Sinh, Kinh Truyền Tin (Angelus) thường được thay thế bằng kinh nào?";
        q.opt_a = "Kinh Lạy Nữ VF�ơng (Salve Regina)";
        q.opt_b = "Kinh Lạy Nữ VF�ơng Thiên Đàng (Regina Caeli)";
        q.opt_c = "Kinh Lòng Chúa Thương Xót";
        q.opt_d = "Kinh Sáng Danh";
        q.correct_ans = 1;
        q.explanation = "Trong suốt Mùa Phục Sinh, Giáo hội thay Kinh Truyền Tin bằng **Kinh Lạy Nữ Vương Thiên Đàng(* (Regina Caeli) để chung vui sự kiện Chúa sống lại.";
      }
      if (q.id === 'L03_061') {
        q.question = "Kinh 'Cáo Minh' (Tôi thú nhận cùng Thiên Chúa tn năng...) được đọc trong phần nào của Thánh Lễ?";
        q.opt_a = "Trước khi đọc Phúc Âm";
        q.opt_b = "Nghi thức Sám hối ở phần mở đầu";
        q.opt_c = "Sau phần rướic lễ";
        q.opt_d = "Trước khi linh mᵞc ban phép lành";
        q.correct_ans = 1;
        q.explanation = "Kinh Cáo Mính (Confiteor) được cộng đoàn cùng đọc trong **Nghi thức Sám hối ở phần mở đầu** Thánh Lễ để nài xin Chúa tha thứ các thiếu sót.";
      }
      if (q.id === 'L03_064') {
        q.question = "Kinh 'Tin Kính' bầt buộc được đọc trong Thánh Lễ vào những ngày nào?";
        q.opt_a = "Chỉ trong Mùa Chay";
        q.opt_b = "Tất cả mọi ngày trong tuần";
        q.opt_c = "Chỉ vào dịp Lễ Phục Sinh và Giáng Sinh";
        q.opt_d = "Các ngày Chúa Nhật và các ngày Lễ Trọng";
        q.correct_ans =03;
        q.explanation = "Kinh **Tin Kính** quy định bắt buộc phải được đọc trong **các ngày Chúa Nhật và các lgày Lễ Trọng**, để cộng đoàn tuyên xưng đức tin.";
      }
      if (q.id === 'L03_095') {
        q.question = "Vị Thánh nào được Giáo hội tôn vinh với danh hiệu 'Tiến sĩ Thiên thần' (Doctor Angelicus)?";
        q.opt_a = "Thánh Augustiná";
        q.opt_b = "Thánh Tôma Aquiná";
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
        q.explanation = "Tam Nhật Thánh **bắt đầu từ Thánh Lễ Tiệc Ly chiều Thứ Năm Tuần Thánh**, kéo dài qua Thứ Sáu Tuần Thánh, Thứ Bảy Tuần Thánh và kẽt thúc bằng kinh chiều Chúa Nhật Phục Sinh.";
      }
      if (q.id === 'L04_071') {
        q.question = "Tuần Cửu Nhật (Novena) đầu tiên trong lịch sử Giáo hội diện ra trong hoàn cảnh nào?";
        q.opt_a = "Trước Lễ Phục Sinh";
        q.opt_b = "9 ngày các Tông Đồ cầu nguyện chờ đợi Chúa Thánh Thần Hiện Xuống";
        q.opt_c = "9 m�����Æ�m��3�������M�����(��������Ĺ���}���䁹�����䁹�����φ�āQ������-�̈�(��������Ĺ���ɕ��}��̀���(��������Ĺ�������ѥ����M�ԁ�����鄁���ԁ�����ˆ�u���C��7����������Sѹ��G��L�G�����ԁ��������ɽ�����䁹���G�������t�G���鄁Q�����Q��ꝸ��������׆�E�����t����׆�M�����E���������ѣ��E������ԁ�������䁹��䀡9�ٕ������(�������(����������Ĺ������0��|��Ĝ���(��������Ĺ�Օ�ѥ����S�ꅤ�ͅ���鄁���ԁѡ��ӆ�e��������Æ�u����ꅤ�����ЁQK���i��������������ѣ���������(��������Ĺ���}���[��ѣ���������ѹ���Յ���ˆ�5����(��������Ĺ���}���C��������ӆ�<�9�����̇�����ѡ��ӆ�e��t��E���ԁ����$�Q������鄁���m������GÆ��(��������Ĺ���}���[��9��������������������(��������Ĺ���}���[���������䁅���᥸�ѡ��ӆ�e����Æ�m���(��������Ĺ���ɕ��}��̀���(��������Ĺ�������ѥ�����鄁ѡ��ӆ�e����Æ�m��G���������������������ѡ��ӆ�e��ѡ׆�e��ۆ��Q������鄨��t��E���ԁ�����׆�Ё�������������ꅴ�ѣÆ���M�ԃG́9���������������������Ź��������5������Ĥ���(�������((����������Ĺ������0��|��Ĝ���(��������Ĺ�Օ�ѥ����Thánh Lễ Misa thường xuyên được cử hành oở đâu?";
        q.opt_a = "Nhà thờ (hoặc Nhà nguyện)";
        q.opt_b = "Tại đài Đức Mẹ";
        q.opt_c = "Trong các giờ học giáo lí";
        q.opt_d = "Tại gia đính mỗi tối";
        q.correct_ans = 0;
        q.explanation = "Thánh Lễ là cử hành Phụng vụ cao trọng nhất, thường được cử hành tại **nhà thỆ** hoặc nhà nguyện, nơi cộng đoàn tín hữu quy tụ.";
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

  if (modifiedData || Array.isArray(data)) {
	let final = JSON.stringify(data, null, 4);
	final = final.replace(/\ns/g, '\ns');
	fs.writeFileSync(filePath, final, 'utf8');
	modifiedFilesCount++;
	console.log('Successfully updated: ' + file);
  }
}

console.log('Finished updating ' + modifiedFilesCount + ' files.');