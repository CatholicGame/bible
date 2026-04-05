import os
import json

root = "e:/Projects/bible/src/data"

replacements = {
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
    "Phanxicô": "Phan-xi-cô",
    "Đaminh": "Đa-minh",
    "Monica": "Mô-ni-ca",
    "Bênêđictô": "Biển Đức",
    "Augustinô": "Âu-tinh",
    "Inhaxiô": "I-nhã",
    "Têrêsa": "Tê-rê-xa",
    "Máctinô": "Mác-ti-nô"
}

import io
keys = sorted(replacements.keys(), key=lambda x: len(x), reverse=True)

def replace_text(text):
    if not isinstance(text, str):
        return text
    new_text = text
    for k in keys:
        new_text = new_text.replace(k, replacements[k])
    return new_text.replace('Chúa Giê-su', 'Chúa Giê-su')

count = 0

for file in os.listdir(root):
    if file.endswith('.json') and 'backup' not in file:
        path = os.path.join(root, file)
        try:
            with io.open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print("Failed to load", file, e)
            continue
        
        modified = False
        
        if isinstance(data, list):
            for q in data:
                # restore L02_013 Kazn fix
                if q.get('id') == 'L02_013':
                    q['question'] = '10 tai ương xảy ra ở đâu trong Kinh Thánh?'
                    modified = True
                    
                # restore L03 duplicate fixes
                if q.get('id') == 'L03_049':
                    q['question'] = "Trong Mùa Phục Sinh, Kinh Truyền Tin (Angelus) thường được thay thế bằng kinh nào?"
                    q['opt_a'] = "Kinh Lạy Nữ Vương (Salve Regina)"
                    q['opt_b'] = "Kinh Lạy Nữ Vương Thiên Đàng (Regina Caeli)"
                    q['opt_c'] = "Kinh Lòng Chúa Thương Xót"
                    q['opt_d'] = "Kinh Sáng Danh"
                    q['correct_ans'] = 1
                    q['explanation'] = "Trong suốt Mùa Phục Sinh, Giáo hội thay Kinh Truyền Tin bằng **Kinh Lạy Nữ Vương Thiên Đàng** (Regina Caeli) để chung vui sự kiện Chúa sống lại."
                    modified = True
                if q.get('id') == 'L03_061':
                    q['question'] = "Kinh 'Cáo Mình' (Tôi thú nhận cùng Thiên Chúa toàn năng...) được đọc trong phần nào của Thánh Lễ?"
                    q['opt_a'] = "Trước khi đọc Phúc Âm"
                    q['opt_b'] = "Nghi thức Sám hối ở phần mở đầu"
                    q['opt_c'] = "Sau phần rước lễ"
                    q['opt_d'] = "Trước khi linh mục ban phép lành"
                    q['correct_ans'] = 1
                    q['explanation'] = "Kinh Cáo Mình (Confiteor) được cộng đoàn cùng đọc trong **Nghi thức Sám hối ở phần mở đầu** Thánh Lễ để nài xin Chúa tha thứ các thiếu sót."
                    modified = True
                if q.get('id') == 'L03_064':
                    q['question'] = "Kinh 'Tin Kính' bắt buộc được đọc trong Thánh Lễ vào những ngày nào?"
                    q['opt_a'] = "Chỉ trong Mùa Chay"
                    q['opt_b'] = "Tất cả mọi ngày trong tuần"
                    q['opt_c'] = "Chỉ vào dịp Lễ Phục Sinh và Giáng Sinh"
                    q['opt_d'] = "Các ngày Chúa Nhật và các ngày Lễ Trọng"
                    q['correct_ans'] = 3
                    q['explanation'] = "Kinh **Tin Kính** quy định bắt buộc phải được đọc trong **các ngày Chúa Nhật và các ngày Lễ Trọng**, để cộng đoàn tuyên xưng đức tin."
                    modified = True
                if q.get('id') == 'L03_095':
                    q['question'] = "Vị Thánh nào được Giáo hội tôn vinh với danh hiệu 'Tiến sĩ Thiên thần' (Doctor Angelicus)?"
                    q['opt_a'] = "Thánh Augustinô"
                    q['opt_b'] = "Thánh Tôma Aquinô"
                    q['opt_c'] = "Thánh Phanxicô Assisi"
                    q['opt_d'] = "Thánh Đa Minh"
                    q['correct_ans'] = 1
                    q['explanation'] = "**Thánh Tôma Aquinô** được tôn vinh là Tiến sĩ Thiên thần nhờ sự uyên bác thần học sâu sắc và đời sống trinh khiết tuyệt vời."
                    modified = True
                if q.get('id') == 'L04_016':
                    q['question'] = "Tam Nhật Thánh (Paschal Triduum) bắt đầu từ khi nào?"
                    q['opt_a'] = "Sáng Thứ Năm Tuần Thánh"
                    q['opt_b'] = "Thánh Lễ Tiệc Ly chiều Thứ Năm Tuần Thánh"
                    q['opt_c'] = "Nghi thức chiều Thứ Sáu Tuần Thánh"
                    q['opt_d'] = "Đêm Vọng Phục Sinh"
                    q['correct_ans'] = 1
                    q['explanation'] = "Tam Nhật Thánh **bắt đầu từ Thánh Lễ Tiệc Ly chiều Thứ Năm Tuần Thánh**, kéo dài qua Thứ Sáu Tuần Thánh, Thứ Bảy Tuần Thánh và kết thúc bằng kinh chiều Chúa Nhật Phục Sinh."
                    modified = True
                if q.get('id') == 'L04_071':
                    q['question'] = "Tuần Cửu Nhật (Novena) đầu tiên trong lịch sử Giáo hội diễn ra trong hoàn cảnh nào?"
                    q['opt_a'] = "Trước Lễ Phục Sinh"
                    q['opt_b'] = "9 ngày các Tông Đồ cầu nguyện chờ đợi Chúa Thánh Thần Hiện Xuống"
                    q['opt_c'] = "9 ngày trước Lễ Giáng Sinh"
                    q['opt_d'] = "9 ngày suy niệm sự Thương Khó"
                    q['correct_ans'] = 1
                    q['explanation'] = "Sau khi Chúa Giêsu lên trời, Đức Mẹ và các Tông đồ đã cầu nguyện trong **9 ngày để chờ đợi Chúa Thánh Thần hiện xuống** — nguồn gốc truyền thống cầu nguyện 9 ngày (Novena)."
                    modified = True
                if q.get('id') == 'L04_101':
                    q['question'] = "Tại sao Chúa Giê-su tha tội cho người bại liệt TRƯỚC khi chữa lành thể xác?"
                    q['opt_a'] = "Vì thể xác không quan trọng"
                    q['opt_b'] = "Để chứng tỏ Ngài có quyền tha tội — điều chỉ Thiên Chúa mới làm được"
                    q['opt_c'] = "Vì Ngài quên chữa bệnh"
                    q['opt_d'] = "Vì cha mẹ anh xin tha tội trước"
                    q['correct_ans'] = 1
                    q['explanation'] = "Chúa tha tội trước để chứng minh **quyền tha tội thuộc về Thiên Chúa** — điều các luật sĩ cho là phạm thượng. Sau đó Ngài chữa bệnh như bằng chứng (Mc 2:9-11)."
                    modified = True
                    
                # Fix L01_021 distill
                if q.get('id') == 'L01_021':
                    q['question'] = "Thánh Lễ Misa thường xuyên được cử hành ở đâu?"
                    q['opt_a'] = "Nhà thờ (hoặc Nhà nguyện)"
                    q['opt_b'] = "Tại đài Đức Mẹ"
                    q['opt_c'] = "Trong các giờ học giáo lý"
                    q['opt_d'] = "Tại gia đình mỗi tối"
                    q['correct_ans'] = 0
                    q['explanation'] = "Thánh Lễ là cử hành Phụng vụ cao trọng nhất, thường được cử hành tại **nhà thờ** hoặc nhà nguyện, nơi cộng đoàn tín hữu quy tụ."
                    modified = True

                for field in ['question', 'opt_a', 'opt_b', 'opt_c', 'opt_d', 'explanation']:
                    if field in q:
                        orig = q[field]
                        q[field] = replace_text(orig)
                        if q[field] != orig:
                            modified = True
        elif isinstance(data, dict):
            for k, q in data.items():
                if isinstance(q, dict):
                    for field in ['question', 'answer', 'explanation']:
                        if field in q:
                            orig = q[field]
                            q[field] = replace_text(orig)
                            if q[field] != orig:
                                modified = True
                                
        if modified or True:
            with io.open(path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
            count += 1
            print("Updated", file)

print("Total files modified:", count)
