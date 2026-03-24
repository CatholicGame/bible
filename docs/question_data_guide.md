# Hướng Dẫn Tạo Dữ Liệu Câu Hỏi — Bible Quiz Game

> Tài liệu này tổng hợp nguyên tắc thiết kế và quy trình tạo câu hỏi cho từng level, dựa trên phân tích cân đối độ khó theo đối tượng người chơi.

---

## 🎯 Mục Đích Game

> **Game không phải để đánh đố — mà để nuôi dưỡng đức tin một cách vui vẻ.**

Bible Quiz Game được xây dựng với 3 mục tiêu cốt lõi:

1. **Ôn lại kiến thức đức tin** đã học nhưng dễ quên — qua trải nghiệm vui thú
2. **Khám phá điều mới** trong Kinh Thánh, Phụng vụ, Giáo lý — mỗi câu hỏi là một bài học nhỏ
3. **Có động lực tiến xa hơn** — hệ thống level tăng dần giúp người chơi tự thấy sự tiến bộ

Game phù hợp với **mọi người Công giáo Việt Nam**: từ thiếu nhi biết đọc đến người lớn muốn học lại đức tin.

---

## 🚨 Quy Tắc Tuyệt Đối — Áp Dụng Cho TẤT CẢ Các Level

### ❌ Tránh Thuật Ngữ Latin & Từ Điển Thần Học Phức Tạp

**Không dùng tên Latin hay thuật ngữ học thuật trong câu hỏi** (trừ khi đó chính là điều cần dạy và có giải thích rõ ràng kèm theo):

| ❌ Tránh | ✅ Thay bằng |
|---|---|
| "Nunc Dimittis là lời của ai?" | "Ông Simêon nói gì khi bồng ẵm Hài Nhi Giêsu?" |
| "Lectio Divina gồm mấy bước?" | "Phương pháp đọc Kinh Thánh cầu nguyện gồm mấy bước?" |
| "Beatific Vision là gì?" | "Linh hồn được gì khi vào Thiên Đàng?" |
| "Cardinal Virtues là gì?" | "Bốn nhân đức nền tảng Giáo hội dạy là gì?" |
| "Agnus Dei trong Thánh Lễ" | "Kinh 'Lạy Chiên Thiên Chúa' đọc khi nào?" |
| "Ex cathedra" | (Chỉ dùng Level 10+, có giải thích bằng tiếng Việt) |

> **Nguyên tắc kiểm tra:** Người đi lễ đều đặn nhưng chưa học thần học không hiểu được → cần diễn đạt lại bằng tiếng Việt bình thường.

---

### ❌ Tránh Số Liệu Vô Nghĩa Ở Level 1–5

Từ Level 1 đến Level 5, **không hỏi những con số người chơi phải đoán mò** hay chỉ biết nếu đã đếm từng điều trong sách. Ưu tiên câu về **sự kiện, nhân vật, tình huống**:

| ❌ Số liệu vô nghĩa | ✅ Thay bằng sự kiện/nhân vật |
|---|---|
| "Thánh Vịnh có bao nhiêu bài?" | "Vua nào được coi là tác giả chính của Thánh Vịnh?" |
| "Mùa Thường Niên có bao nhiêu tuần?" | "Màu áo lễ Mùa Thường Niên là màu gì?" |
| "Lễ Vọng Phục Sinh có bao nhiêu phần?" | "Đêm Vọng Phục Sinh mở đầu bằng nghi thức gì?" |
| "14 Công việc Từ thiện chia mấy nhóm?" | "Trong dụ ngôn Bữa Tiệc, chủ nhà mời ai khi khách từ chối?" |
| "Lời cầu xin thứ 5 trong Kinh Lạy Cha" | "Chúa dạy gì về tha thứ trong Kinh Lạy Cha?" |

**Số liệu ĐƯỢC phép** (có giá trị đức tin, dễ nhớ):
- ✅ 7 Bí tích, 10 Điều Răn, 12 Tông Đồ, 3 Ngôi Thiên Chúa
- ✅ 40 ngày Mùa Chay (gắn với 40 ngày Chúa ăn chay)
- ✅ 4 mùa Phụng Vụ, 4 sách Tin Mừng, 3 ngày Chúa sống lại

**Số liệu KHÔNG được phép ở L1-5:**
- ❌ Con số chỉ biết được bằng cách đếm (số tuần, số phần nghi lễ...)
- ❌ Năm tháng lịch sử không có giá trị đức tin rõ ràng
- ❌ Thứ tự trong danh sách (lời xin thứ mấy, mối phúc thứ mấy...)

---

### ✨ Quy Tắc Viết Giải Thích — Keypoint Hữu Ích & Thú Vị

Phần `explanation` **không chỉ xác nhận đáp án** — đây là cơ hội giúp người chơi học được điều thú vị và hữu dụng.

**Cấu trúc lý tưởng:** ① In đậm đáp án đúng → ② Keypoint thú vị → ③ Liên kết đời sống

```
❌ Khô: "Phép lạ đầu tiên là biến nước thành **rượu**."

✅ Keypoint: "Tại Cana, Chúa biến nước thành **rượu** theo lời cầu của Đức Mẹ
— đây là lần đầu tiên Đức Mẹ thể hiện vai trò chuyển cầu giữa người ta
và Chúa. Tin Mừng Gioan ghi đây là phép lạ đầu tiên."
```

```
❌ Khô: "**Lễ Hiện Xuống** là ngày Chúa Thánh Thần ngự xuống."

✅ Keypoint: "**Lễ Hiện Xuống** — Chúa Thánh Thần ngự xuống dưới hình
lưỡi lửa trên 12 Tông Đồ và Đức Mẹ đang cầu nguyện cùng nhau.
Ngày này được gọi là 'sinh nhật của Giáo hội'."
```

**Độ dài:** 1–3 câu, tối đa ~300 ký tự. Ngắn gọn nhưng có chiều sâu.

---

## 0. Triết Lý Nội Dung

### Mục tiêu cốt lõi
Game không phải để **làm khó** người chơi — mà để giúp người chơi **ôn lại kiến thức đức tin, học điều mới, và có động lực tiến xa hơn**.

### Phổ cập > Địa phương
Câu hỏi nên **từ Việt Nam đến toàn cầu** — nghĩa là:
- ✅ Ưu tiên kiến thức mà **người Công giáo ở bất kỳ đâu** cũng có thể tiếp cận
- ✅ Kiến thức VN phải là **sự kiện lớn** mà gần như mọi CG VN đều biết (117 Tử Đạo, La Vang, chữ Quốc Ngữ, 3 Giáo tỉnh)
- ⚠️ Hạn chế: địa danh nhỏ, dòng tu ít người biết, lịch sử địa phương quá hẹp

### Nội dung phong phú — không chỉ giáo lý khô
Mọi góc nhìn về đức tin đều có thể là câu hỏi hay:

| Nhóm nội dung | Ví dụ cụ thể |
|---|---|
| 📖 Kinh Thánh | Sự kiện CƯ/TƯ, nhân vật, dụ ngôn, câu nổi tiếng, ý nghĩa ẩn dụ |
| ⛪ Giáo lý & Bí tích | Nguyên tội, tội trọng, biến thể, ân sủng, tín điều |
| 🙏 Phụng vụ | Màu sắc phẩm phục, các mùa, cấu trúc Thánh Lễ, kinh nguyện |
| 👑 Thánh nhân | Điểm nổi bật thú vị của từng thánh, phép lạ, lịch sử ơn gọi |
| 🌍 Lịch sử truyền giáo | Ai truyền giáo đến đâu, kết quả, ảnh hưởng |
| ⚔️ Lịch sử Giáo hội | Công đồng, Cải Cách, bách hại, phục hưng |
| 🎨 Nghệ thuật & Biểu tượng | Khi nghệ thuật gắn với đức tin: ý nghĩa tranh thánh, biểu tượng KT |
| 🗺️ Địa lý thánh địa | Vùng trong sứ vụ Chúa, hành trình truyền giáo Thánh Phaolô |
| 🇻🇳 Giáo hội Việt Nam | 117 Tử Đạo, La Vang, lịch sử truyền giáo, các Giáo phận lớn |

### Tỉ lệ khuyến nghị (L3-L7)
- **≥ 70%** — Giáo lý, Kinh Thánh, Phụng vụ, Thánh nhân phổ biến, Lịch sử GH quan trọng
- **≤ 20%** — Nghệ thuật/kiến trúc (chỉ khi gắn ý nghĩa đức tin), địa lý, văn hóa
- **≤ 10%** — Kiến thức địa phương/Việt Nam đặc thù

---

## 1. Đối Tượng Người Chơi

| Nhóm | Mô tả | Level phù hợp |
|---|---|---|
| Thiếu nhi thánh thể | Đã học giáo lý cơ bản | Level 1–2 |
| Người Công giáo thực hành | Tham dự Lễ, đọc kinh thường ngày | Level 2–4 |
| Người quan tâm học hỏi đức tin | Tìm hiểu giáo lý có hệ thống | Level 4–7 |
| Người có kiến thức thần học | Nghiên cứu, học thuật | Level 8–15 |

---

## 2. Nguyên Tắc Cốt Lõi: Quy Tắc 60%

> **60% câu hỏi ở Level 1–5 phải thuộc về đời sống đức tin thân thuộc hàng ngày.**

Ví dụ: kinh nguyện, mùa phụng vụ, lễ trọng, bí tích thường gặp, nhân vật KT quen thuộc, Đức Mẹ, các thánh phổ biến...

Cùng chủ đề, nhưng ở level cao hơn → câu hỏi đi sâu hơn vào chi tiết:

```
Level 1: "Mùa Chay kéo dài bao nhiêu ngày?"           → 40 ngày
Level 3: "Thứ Sáu Tuần Thánh có điểm gì đặc biệt?"   → Không có Thánh Lễ
Level 6: "Lễ Vọng Phục Sinh gồm mấy phần chính?"      → 4 phần
Level 9: "Kinh Nguyện Thánh Thể chính thức có mấy loại?" → 4 loại
```

---

## 3. Ma Trận Phân Bố Nội Dung Theo Level

| Chủ đề | L1 | L2 | L3 | L4 | L5 | L6+ |
|--------|:--:|:--:|:--:|:--:|:--:|:---:|
| 🙏 Kinh nguyện hàng ngày | 40% | 30% | 20% | 10% | 5% | — |
| ✝️ Cuộc đời Chúa Giêsu | 30% | 25% | 20% | 15% | 10% | 5% |
| 📿 Mân Côi, Bí Tích, Phụng vụ | 15% | 20% | 20% | 15% | 10% | 5% |
| 📖 Kinh Thánh phổ biến | 10% | 15% | 20% | 25% | 25% | 20% |
| 🏛️ Lịch sử / Giáo lý / Nghệ thuật | 5% | 10% | 20% | 35% | 50% | 70% |

---

## 4. Mô Tả Chi Tiết Từng Level

### 🟢 Level 1 — Căn bản
**Đối tượng:** Thiếu nhi, người mới biết đạo  
**Đặc điểm:** Câu hỏi rất quen thuộc, ai đi Lễ đều biết  
**Chủ đề trọng tâm:**
- Chúa Giêsu: sinh ở đâu, mẹ là ai, 12 Tông Đồ, các phép lạ nổi tiếng
- Các lễ lớn: Giáng Sinh, Phục Sinh, Hiện Xuống
- Kinh Lạy Cha, Kính Mừng, Dấu Thánh Giá, Sáng Danh, Ăn Năn Tội
- 7 Bí tích (kể tên), 10 Điều Răn (tổng quát)
- Nhân vật KT qua sự kiện: Nôê (tàu & lụt), Môsê (Ai Cập), Đavít (Gôliát), Ábraham (con trai)

> ⚠️ **Level 1 tuyệt đối KHÔNG hỏi số liệu đơn thuần.** Câu hỏi phải dựa vào sự kiện, hành động, nhân vật.

```json
// ✅ Đúng chuẩn Level 1
{"question": "Chúa Giêsu sinh ra ở đâu?", ...}
{"question": "Ai đã dạy Kinh Lạy Cha cho các môn đệ?", ...}
{"question": "Mùa Chay nhắc nhớ 40 ngày ăn chay của ai?", ...}

// ❌ Sai — số liệu đơn thuần
{"question": "Mùa Chay kéo dài bao nhiêu ngày?", ...}
{"question": "Có bao nhiêu Tông Đồ?", ...}
```

---

### 🟡 Level 2 — Quen thuộc
**Đối tượng:** Thiếu nhi đã học giáo lý, người thực hành đạo  
**Đặc điểm:** Hiểu biết thêm một bậc so với level 1  
**Chủ đề trọng tâm:**
- Mùa Vọng: 4 CN, vòng hoa 4 nến, màu tím/hồng
- Mân Côi: 4 mùa, ai thêm mùa Sáng, cấu trúc 1 chục
- Bí tích: Thêm Sức do Giám mục ban, Hôn Phối bất khả phân ly
- Giáo hội: 4 đặc tính, Hồng Y bầu Giáo Hoàng, khói trắng/đen
- KT: Giuse bán sang Ai Cập — anh em làm gì, Ábraham suýt hiến tế con trai nào...
- Lịch sử VN: 117 TTĐVN — Đức Mẹ La Vang hiện ra an ủi ai

> ⚠️ **Level 2:** Số liệu chỉ dùng nếu đó là điểm cốt lõi cần nhớ (7 bí tích, 4 mùa...). Ưu tiên câu về sự kiện và hành động.

```json
// ✅ Đúng chuẩn Level 2
{"question": "Ba Vua mang đến cho Hài Nhi những lễ vật nào?", ...}
{"question": "Ai đã thêm Mầu nhiệm Sự Sáng vào Kinh Mân Côi?", ...}
{"question": "Trong một chục Mân Côi, có bao nhiêu kinh Kính Mừng?", ...}
```

---

### 🟠 Level 3 — Sinh hoạt đức tin
**Đối tượng:** Người trưởng thành thực hành đạo đều đặn  
**Đặc điểm:** Đi sâu vào phụng vụ, câu chuyện KT ít quen hơn — qua tình huống và sự kiện cụ thể  
**Chủ đề trọng tâm:**
- Phụng vụ: Thứ Sáu không có Lễ, Rửa Chân Thứ Năm, Lễ Tro làm từ đâu
- Giáo lý: Tội trọng/nhẹ, Luyện ngục, Nguyên tội, ai được lãnh Xức Dầu
- KT sinh động: Vua Đavít và bà Batseba, Êlia lên trời bằng gì, dân Ninivê đáp lại thế nào
- Nhân vật dụ ngôn: chủ nhà Bữa Tiệc Lớn, người cha chạy ra đón con
- Lời kinh sâu hơn: Kinh Magnificat là bài ca của ai, Lạy Cha dạy gì về tha thứ

> ⚠️ **Level 3:** Hoàn toàn không hỏi số liệu đơn thuần. Câu hỏi phải dẫn người chơi vào tình huống hay sự kiện cụ thể.

```json
// ✅ Đúng chuẩn Level 3
{"question": "Thứ Sáu Tuần Thánh có đặc điểm gì đặc biệt?", ...}
{"question": "Khi gặp người đàn bà ngoại tình, Chúa Giêsu nói gì với đám đông?", ...}
{"question": "Người trộm thống hối nhận được lời hứa gì từ Chúa Giêsu?", ...}

// ❌ Sai — số liệu đơn thuần
{"question": "Mùa Thường Niên có bao nhiêu tuần?", ...}
{"question": "Mùa Phục Sinh kéo dài bao nhiêu ngày?", ...}
```

---

### 🔴 Level 4–5 — Trung bình
**Đặc điểm:** Cần học hỏi có hệ thống  
**Chủ đề:** Giáo lý sâu hơn, lịch sử Giáo hội, địa lý thánh địa quen thuộc  
**Ví dụ:**
- 3 Tin Mừng Nhất Lãm là gì?
- Thánh Luca có nghề gì?
- Sách Gióp bàn về chủ đề gì?
- Sông Giođan gắn với sự kiện phép rửa như thế nào?

> ⚠️ **Level 4-5:** Số liệu được phép nhiều hơn, nhưng vẫn ưu tiên ý nghĩa và sự kiện. Thuật ngữ Latin có thể xuất hiện nhưng phải có giải thích tiếng Việt trong đáp án.

---

### ⚫ Level 6-10 — Chuyên sâu
**Đặc điểm:** Thần học, lịch sử học thuật, biểu tượng học  
**Chủ đề:**
- Công đồng Nicêa I (325), Ly Giáo (1054), Cải Cách (1517)
- Tín điều Vô Nhiễm (1854), Hồn Xác Lên Trời (1950)
- Ơn bất khả ngộ ex cathedra
- Biểu tượng 4 Thánh Sử, Chi-Rho, Gregorian Chant

---

### ⬛ Level 11-15 — Học thuật
**Chủ đề:** Thần học kinh viện, giáo phụ học, lịch sử chuyên sâu  
**Ví dụ:**
- 7 lần "Ta là" trong Tin Mừng Gioan là những tước hiệu nào?
- "Summa Theologica" lập luận chính về điều gì?
- Giờ Kinh Phụng Vụ gồm bao nhiêu giờ kinh trong ngày?

---

## 5. Nguồn Tham Khảo Soạn Câu Hỏi

### 🙏 Kinh nguyện & Phụng vụ thường ngày
- Kinh Sáng Tối: Lạy Cha, Kính Mừng, Sáng Danh, Tin Kính, Ăn Năn Tội, Dâng Ngày
- Kinh Truyền Tin (6h, 12h, 18h) — Kinh Salve Regina (Lạy Nữ Vương)
- Kinh Mân Côi: 4 mùa (Vui/Sáng/Thương/Mừng), 20 mầu nhiệm, cấu trúc 1 chục
- Kinh Lòng Chúa Thương Xót (3h chiều — Giờ Thương Xót)
- Kinh Hòa Bình — Kinh Cám Ơn trước/sau bữa ăn
- Lectio Divina: 4 bước Đọc/Suy niệm/Cầu nguyện/Chiêm niệm

### ⛪ Biểu Tượng & Đồ Vật Trong Nhà Thờ
Đây là **nguồn câu hỏi phong phú** từ level 2 trở lên:

| Đồ vật / Biểu tượng | Ý nghĩa | Level phù hợp |
|---|---|---|
| Nhà tạm (Tabernacle) | Lưu giữ Mình Thánh Chúa | L1 |
| Đèn chầu (Sanctuary lamp) | Luôn thắp sáng khi có Mình Thánh | L2 |
| Giếng rửa tội (Font) | Cử hành Bí tích Rửa Tội | L2 |
| Bàn thờ (Altar) | Bàn tiệc Thánh Thể, hiện diện Chúa | L2 |
| Giảng đài (Ambo) | Công bố Lời Chúa | L3 |
| Chén thánh (Chalice) | Đựng Máu Thánh Chúa | L2 |
| Đĩa thánh (Paten) | Đặt Bánh Thánh | L3 |
| Bình đựng dầu thánh (Chrismatory) | 3 loại dầu thánh | L5 |
| Nước phép (Holy water) | Nhắc nhở Bí tích Rửa Tội | L1 |
| Hương trầm (Incense) | Tượng trưng lời cầu nguyện bay lên Chúa | L3 |
| Nến Phục Sinh (Paschal candle) | Chúa Giêsu — Ánh sáng thế gian | L1 |
| Thánh giá (Crucifix) | Hình chữ thập, sự chết cứu chuộc | L1 |
| Icon / Ảnh thánh | Cửa sổ thiêng liêng hướng về Chúa | L3 |

### 🕯️ Màu Sắc Phẩm Phục & Nến Phụng Vụ

| Màu | Dùng trong | Level phù hợp |
|---|---|---|
| **Tím** | Mùa Vọng, Mùa Chay (sám hối, chờ đợi) | L1 |
| **Trắng/Vàng** | Phục Sinh, Giáng Sinh, lễ Đức Mẹ, lễ không tử đạo (niềm vui, vinh quang) | L1 |
| **Đỏ** | Lễ Hiện Xuống, lễ Thánh Tử Đạo (lửa CTT, máu tử đạo) | L1 |
| **Xanh lá** | Mùa Thường Niên (hy vọng, phát triển) | L2 |
| **Hồng** | CN III Mùa Vọng (Gaudete) & CN IV Mùa Chay (Laetare) | L4 |
| **Đen/Tím sẫm** | Lễ An táng (theo truyền thống cũ) | L5 |

**Màu nến Mùa Vọng:**
- 3 nến tím (tuần 1, 2, 4) + 1 nến hồng (tuần 3 — Chúa Nhật Gaudete)
- Nến trắng ở giữa thắp đêm Giáng Sinh

### ✝️ Biểu Tượng Kitô Giáo Phổ Biến Trong Xã Hội

| Biểu tượng | Ý nghĩa gốc KT | Level phù hợp |
|---|---|---|
| Chim bồ câu trắng | Chúa Thánh Thần, hòa bình (Nôê) | L1 |
| Chiên con (Agnus Dei) | Chúa Giêsu — Chiên Thiên Chúa | L2 |
| Cá (IXΘYΣ) | Giêsu Kitô Con Thiên Chúa Cứu Độ | L4 |
| Hoa huệ trắng | Đức Trinh Nữ Maria, sự thanh khiết | L2 |
| Hoa hồng | Đức Mẹ, Kinh Mân Côi | L2 |
| Cầu vồng | Giao ước Thiên Chúa – Nôê | L2 |
| Số 7 | Sự hoàn hảo (7 ngày tạo dựng, 7 bí tích...) | L3 |
| Số 40 | Thời gian thử thách (40 năm, 40 ngày chay) | L3 |
| Số 12 | Dân Chúa (12 chi tộc, 12 Tông Đồ) | L2 |
| Cây ôliu | Hòa bình, Chúa Thánh Thần (ký hiệu dầu thánh) | L3 |
| Lửa | Chúa Thánh Thần (Lễ Hiện Xuống), thanh luyện | L2 |
| Nước | Thanh tẩy, Bí tích Rửa Tội, sự sống | L1 |
| Bánh & Rượu | Thánh Thể, Mình Máu Chúa Kitô | L1 |
| Chi-Rho (☧) | 2 chữ đầu Christos (Kitô) | L6 |
| Alpha & Omega (Α Ω) | Chúa là khởi đầu và kết thúc (Kh 1:8) | L5 |

### 📖 Kinh Thánh — Nguồn câu hỏi theo mức độ

**Mức phổ biến (L1-3):** Sáng Thế (Eden, Nôê, Ábraham), Xuất Hành (Môsê, 10 tai ương), Đavít & Gôliát, Thánh Vịnh 23, 4 Tin Mừng, dụ ngôn nổi tiếng

**Mức trung bình (L4-6):** Sách Ruth, Esther, Gióp, Isaia, Giêrêmia, Công Vụ Tông Đồ, Thư Rôma, 3 TM Nhất Lãm, 7 tuyên ngôn "Ta là" trong Ga

**Mức chuyên sâu (L7+):** Sách Khải Huyền, Thư Do Thái, văn chương khôn ngoan, địa lý KT chi tiết, phê bình Kinh Thánh

**Sự kiện Cựu Ước đáng khai thác:**
- Tạo dựng 6 ngày; Sa ngã Ađam-Eva; Cain-Abel; Tháp Babel
- Lũ Nôê; Giao ước Ábraham; Hiến tế Isaac; Giacóp đổi tên Israel
- 10 tai ương Ai Cập; Vượt Biển Đỏ; Manna; Con rắn đồng
- Chinh phục Đất Hứa; Giôsuê; Thời các Thủ Lãnh; Vua Saul/Đavít/Salômôn
- Phân chia vương quốc; Lưu đày Babylon; Hồi hương; Macabê

**Sự kiện Tân Ước đáng khai thác:**
- Truyền Tin; Giáng Sinh; Dâng Chúa; Ẩn tích Ai Cập; Tìm lại Chúa ở Đền Thờ
- Phép Rửa; 40 ngày chay; Tiệc cưới Cana; Gọi Tông Đồ
- Các phép lạ (hóa bánh, chữa bệnh, làm yên sóng gió, Lazarô)
- Bài Giảng Trên Núi; 8 Mối Phúc; dụ ngôn (Người Cha, Samaria, Đứa Con Hoang)
- Biến Hình; Vào Jerusalem; Tiệc Ly; Vườn Dầu; Khổ Nạn; Phục Sinh; Hiện Xuống

### 👑 Thánh Nhân — Góc nhìn sống động

Không chỉ hỏi tên và ngày lễ — hãy khai thác các **điểm nổi bật thú vị**:

| Thánh nhân | Điểm nổi bật khai thác |
|---|---|
| Thánh Phaolô | Hoán cải trên đường Đamát; 3 cuộc hành trình; chém đầu tại Roma |
| Thánh Phêrô | Đi trên nước; chối Chúa 3 lần; đóng đinh ngược |
| Thánh Gioan | Không tử đạo; sống già nhất; tác giả TM + 3 thư + Khải Huyền |
| Thánh Phanxicô Assisi | Hang đá Giáng Sinh đầu tiên; dụ ngôn sói Gubbio; in 5 dấu thánh |
| Thánh Têrêsa Lisieux | Mất năm 24 tuổi; Con đường thơ ấu; Tiến sĩ HT trẻ nhất |
| Thánh Gioan Vianney | Giải tội 16-18h/ngày; biết đọc lòng người |
| Mẹ Têrêsa Calcutta | Tiếng gọi trong tiếng gọi; Nobel Hòa bình 1979 |
| Thánh Maximilian Kolbe | Hy sinh thay chết trong Auschwitz |
| Padre Pio | Stigmata (in 5 dấu thánh) 50 năm; đọc được tâm hồn |
| Thánh Augustinô | "Lạy Chúa, tim con khắc khoải cho đến khi nghỉ yên trong Chúa" |
| Thánh Tôma Aquinô | Tiến sĩ Thiên Thần; Summa Theologica; Tantum Ergo |

### 🌍 Lịch Sử Truyền Giáo Toàn Cầu

- **Thánh Phanxicô Xaviê**: Ấn Độ → Malacca → Nhật Bản → cửa ngõ Trung Quốc
- **Thánh Patrick**: Anh tông du Ireland, dùng cỏ shamrock giảng Ba Ngôi
- **Thánh Columban**: Từ Ireland truyền giáo châu Âu đen tối
- **Thánh Boniface**: Tông đồ nước Đức, chặt cây sồi thần
- **CG tại VN**: de Rhodes → Pigneau de Béhaine → Lambert de la Motte → 117 TĐVN
- **Nhật Bản**: 26 vị tử đạo Nagasaki (1597); Kitô hữu ẩn nấp 250 năm
- **Triều Tiên**: Giáo hội do giáo dân sáng lập (không có linh mục ban đầu)

### 🎨 Nghệ Thuật & Kiến Trúc — Chỉ khi gắn đức tin

> ⚠️ Chỉ dùng khi câu hỏi **dạy điều gì về đức tin**, không hỏi trivia thuần túy

- Tranh thánh (Icon): cửa sổ thiêng liêng; không tô bóng vì ánh sáng từ bên trong
- Nhà thờ Gothic: vươn lên trời; kính màu = Kinh Thánh cho người không biết chữ
- Bích họa Sistine: Michelangelo; Sáng Thế, Phán Xét Chung
- Pietà (Michelangelo): Đức Mẹ bồng Chúa sau khi tháo đinh — tình mẫu tử đau thương
- Bữa Tiệc Ly (Da Vinci): khắc họa khoảnh khắc "Ai đó phản bội Thầy"

### ✨ Phép Lạ Nổi Tiếng Được Giáo Hội Công Nhận

> Nguồn câu hỏi **đặc sắc** — vừa kỳ diệu, vừa củng cố đức tin, vừa có thể xác minh khoa học

| Phép lạ | Nội dung | Năm / Nơi |
|---|---|---|
| **Phép lạ Thánh Thể Lanciano** | Bánh biến thành mô tim người, rượu thành máu nhóm AB | TK 8, Ý |
| **Phép lạ Mặt Trời Fatima** | 70,000 người chứng kiến mặt trời xoay và lao xuống | 1917, Bồ Đào Nha |
| **Tấm khăn liệm Turin** | In hình người bị đóng đinh — phân tích khoa học chưa giải thích được | Torino, Ý |
| **Hình Đức Mẹ Guadalupe** | Hình in trên vải thô (tilma) vẫn nguyên vẹn sau 500 năm | 1531, Mexico |
| **Nước Lourdes** | Hàng trăm ca chữa lành được y khoa xác nhận bất giải thích | 1858, Pháp |
| **Xác không tan của các thánh** | Padre Pio, Bernadette, Gioan Vianney... xác vẫn nguyên vẹn | Nhiều nơi |
| **Giải tội siêu nhiên** | Gioan Vianney, Padre Pio đọc biết tội người chưa xưng | TK 19-20 |
| **Thánh Giuse thành Cupertino** | Bay lên không trung khi cầu nguyện — nhiều nhân chứng xác nhận | TK 17, Ý |

### ⛪ Nơi An Nghỉ Của Các Thánh Tông Đồ & Thánh Nhân Lớn

> Biết **nơi an nghỉ** giúp hiểu lịch sử GH và truyền thống hành hương

| Thánh nhân | Nơi an nghỉ | Điểm đặc biệt |
|---|---|---|
| **Thánh Phêrô** | Đền thờ Thánh Phêrô, Vatican | Mộ nằm ngay dưới bàn thờ chính |
| **Thánh Phaolô** | Đền thờ Thánh Phaolô Ngoại Thành, Roma | Một trong 4 Đại Vương cung Thánh đường |
| **Thánh Giacôbê (T. lớn)** | Santiago de Compostela, Tây Ban Nha | Điểm đến hành hương Camino |
| **Thánh Gioan** | Ephesus (Thổ Nhĩ Kỳ) | Tông Đồ duy nhất không tử đạo |
| **Thánh Tôma** | Mylapore, Chennai, Ấn Độ | Truyền thống truyền giáo đến Ấn Độ |
| **Thánh Matthêô** | Salerno, Ý | Hoán cải từ người thu thuế |
| **Thánh Anrê** | Patras, Hy Lạp (hoặc Scotland) | Bị đóng đinh chữ X (Thập giá Thánh Anrê) |
| **Thánh Bernadette** | Nevers, Pháp | Xác không tan — giống khi còn sống |
| **Padre Pio** | San Giovanni Rotondo, Ý | Hàng triệu người hành hương mỗi năm |
| **Thánh Têrêsa Lisieux** | Lisieux, Pháp | Một trong những thánh được kính nhớ nhiều nhất |

### 🔬 Nhà Khoa Học Công Giáo — Đức Tin & Khoa Học Không Mâu Thuẫn

> Một nguồn câu hỏi rất **thú vị và ít được khai thác** — phá vỡ định kiến "khoa học chống lại đức tin"

| Nhà khoa học | Đóng góp | Liên hệ đức tin |
|---|---|---|
| **Gregor Mendel** | Cha đẻ di truyền học | Tu sĩ Augustinô, làm thí nghiệm trong tu viện |
| **Georges Lemaître** | Đề xuất lý thuyết Big Bang | Linh mục Công giáo Bỉ |
| **Louis Pasteur** | Vi khuẩn học, vaccine | Người Công giáo sùng đạo sâu sắc |
| **Galileo Galilei** | Thiên văn học | Mâu thuẫn với GH nhưng vẫn là tín hữu |
| **Nicolas Copernicus** | Nhật tâm thuyết | Giáo sĩ Công giáo |
| **René Descartes** | Toán học, triết học | "Cogito ergo sum" — Công giáo |
| **Blaise Pascal** | Toán học, xác suất | "Con tim có những lý lẽ mà lý trí không biết" |
| **Lord Kelvin** | Nhiệt động lực học | Công khai tuyên xưng đức tin Kitô |
| **Cha Roger Boscovich** | Nguyên tử luận hiện đại | Linh mục Dòng Tên |

### 🌏 Đóng Góp Của Người Công Giáo Cho Lịch Sử & Văn Minh

**Giáo dục & Đại học:**
- Đại học đầu tiên thế giới (Bologna 1088, Oxford, Paris) do Giáo hội sáng lập
- Dòng Tên sáng lập hàng trăm đại học: Georgetown, Fordham, Loyola...
- Hệ thống trường học miễn phí cho người nghèo: Thánh Gioan La Salle (De La Salle)

**Y tế & Từ thiện:**
- Bệnh viện đầu tiên do Giáo hội xây dựng (thế kỷ 4)
- Dòng Cát Minh chăm sóc bệnh nhân phong cùi
- Mẹ Têrêsa: Nhà cho người hấp hối, trao phẩm giá cho người nghèo cùng cực
- Hội Chữ Thập Đỏ: sáng lập bởi Henri Dunant — người Tin Lành nhưng truyền thống Kitô giáo

**Xã hội & Nhân quyền:**
- Bãi bỏ chế độ nô lệ: Cha Bartolomé de las Casas bảo vệ thổ dân châu Mỹ
- William Wilberforce (Anh giáo) — đấu tranh bãi bỏ buôn nô lệ
- Học thuyết xã hội CG: *Rerum Novarum* (1891) tiên phong quyền lao động

**Nghệ thuật & Văn hóa:**
- Bảo tồn văn minh cổ đại: các tu sĩ sao chép bản thảo suốt thời Trung Cổ
- Thánh ca Gregorian — nền tảng âm nhạc phương Tây
- Dante Alighieri (*Thần Khúc*), Tolkien (*Chúa Tể Nhẫn* — Công giáo), Chesterton

**Tại Việt Nam:**
- Chữ Quốc Ngữ: nhà truyền giáo tặng VN công cụ văn hóa
- Báo chí đầu tiên ở Nam Kỳ: *Gia Định Báo* (1865) gắn với cộng đồng CG
- Bệnh viện, trường học: dòng tu xây dựng trước khi nhà nước có hệ thống

### 🏗️ Công Lao Nhà Truyền Giáo — Những Điều Ít Biết

| Nhà truyền giáo | Đóng góp ngoài đức tin |
|---|---|
| **Cha Alexandre de Rhodes** | Từ điển Việt-Bồ-Latin (1651), nền tảng chữ Quốc Ngữ |
| **Matteo Ricci** | Mang khoa học, bản đồ, đồng hồ đến Trung Quốc |
| **Thánh Francis Xavier** | Mở đường đối thoại văn hóa Đông-Tây |
| **Thánh Junípero Serra** | Xây chuỗi tu xá California — định hình văn hóa Mỹ |
| **Pigneau de Béhaine** | Giúp Nguyễn Ánh thống nhất VN; cầu nối ngoại giao |
| **Truyền giáo tại Triều Tiên** | Giáo hội do giáo dân tự sáng lập — duy nhất trên thế giới |

### 🏛️ Giáo lý Hội Thánh Công giáo (CCC 1992)
- Phần I: Kinh Tin Kính (Ba Ngôi, Thiên Chúa, Giáo hội)
- Phần II: Bí tích (7 Bí tích, nghi thức, chất thể)
- Phần III: Luân lý (10 Điều Răn, tội, nhân đức)
- Phần IV: Kinh nguyện (Kinh Lạy Cha, 7 lời xin)

---

## 6. Quy Trình Tạo Câu Hỏi Mới

### Bước 1 — Xác định chủ đề
Dựa trên ma trận phân bố (mục 3), xác định % mỗi chủ đề cần bổ sung cho level đang thiếu.

### Bước 2 — Soạn theo template

```json
{
  "id": "L0X_YYY",
  "question": "[Câu hỏi rõ ràng, không mơ hồ]",
  "opt_a": "...",
  "opt_b": "...",
  "opt_c": "...",
  "opt_d": "...",
  "correct_ans": 0,
  "explanation": "Giải thích ngắn dùng **in đậm** cho đáp án đúng.",
  "category": "[kinh_thanh | phung_vu | giao_ly | giao_hoi | lich_su | thanh_nhan | doi_song | dia_ly | nghe_thuat]"
}
```

**Nguyên tắc viết `explanation` hiệu quả:**
- Độ dài: **tối đa ~300 ký tự** — đủ để thêm thông tin thú vị
- Luôn **in đậm đáp án đúng**
- Cộng thêm **1-2 thông tin hữu ích liên quan** giúp người chơi học được điều gì đó mới
- Ví dụ tốt: `"**Santiago de Compostela** là nơi an nghỉ của Thánh Giacôbê. Truyền thống hành hương Camino 1000 năm — hàng triệu người đi bộ mỗi năm để gặp gỡ Chúa qua đường dài."`
- Ví dụ kém: `"Santiago là ở Tây Ban Nha."` ← không giúp người chơi học thêm gì

### Bước 3 — Kiểm tra độ khó

Trả lời các câu hỏi sau trước khi thêm câu vào level:

- [ ] Người ở level này có khả năng biết đáp án không?
- [ ] Câu hỏi thuộc về đời sống thường ngày hay học thuật?
- [ ] Có trùng lặp với câu đã có trong file không?
- [ ] Câu hỏi có quá dễ so với level (nên đưa xuống) hoặc quá khó (nên đưa lên)?
- [ ] **Câu hỏi giúp người trả lời thu được điều gì?** (xem quy tắc bên dưới)

### ⭐ Quy Tắc Chất Lượng Câu Hỏi — Giá Trị > Số Liệu

> **Câu hỏi tốt**: giúp người chơi hiểu **ý nghĩa, bối cảnh, bài học đức tin**  
> **Câu hỏi kém**: hỏi số liệu không có giá trị thực (km, tuổi, số đếm ngẫu nhiên)

| Loại câu hỏi | Ví dụ kém ❌ | Ví dụ tốt ✅ |
|---|---|---|
| **Số đo thuần túy** | "Camino dài bao nhiêu km?" | "Camino de Santiago có ý nghĩa thiêng liêng gì?" |
| **Tuổi khi mất** | "Jeanne d'Arc chết năm bao nhiêu tuổi?" | "Jeanne d'Arc bị kết tội gì và GH tuyên bố sau ra sao?" |
| **Số đếm vô nghĩa** | "Có bao nhiêu Tiến sĩ HT?" | "GH trao danh hiệu Tiến sĩ HT cho ai?" |
| **Năm có ý nghĩa** | ❌ "Phong thánh năm mấy?" | ✅ "Vì lý do gì ngài được phong thánh?" |

**Ngoại lệ — số có ý nghĩa thần học thì hỏi được:**
- ✅ "40 năm hoang địa" → 40 = sym. thử thách trong KT
- ✅ "7 bí tích" → số 7 là nền tảng giáo lý
- ✅ "1054 — Ly Giáo" → mốc lịch sử quan trọng

**Nguyên tắc giải thích**: mỗi câu trả lời cần kết hợp thêm **thông tin hữu ích**, không chỉ xác nhận đáp án.



### Bước 4 — Quy tắc chuyển level

| Dấu hiệu | Hành động |
|---|---|
| Cần tra cứu để biết đáp án | Nâng ít nhất 2 level |
| Chỉ người đọc sách thần học mới biết | Đưa vào Level 8+ |
| Thiếu nhi đi Lễ đều biết | Đưa về Level 1-2 |
| Liên quan đến năm tháng cụ thể (lịch sử) | Tối thiểu Level 5 |
| Biểu tượng học, địa lý thánh địa chi tiết | Tối thiểu Level 6 |

---

## 7. Quy Trình Backup & Lọc File

Khi cần review và cân bằng lại một level:

```powershell
# 1. Backup file gốc
Copy-Item "src/data/level_0X.json" "src/data/level_0X_backup_YYYYMMDD.json"

# 2. Phân tích: lọc câu không phù hợp → higher_level_pool.json
# 3. Cập nhật level_0X.json với câu đã lọc
# 4. Thêm trường gợi ý vào pool:
#    "original_level": X, "suggested_level": Y
```

**File pool:** `src/data/higher_level_pool.json`  
→ Tổng hợp câu từ các level thấp cần nâng lên, dùng khi bổ sung cho level cao.

---

## 8. Checkpoint Cân Bằng (ví dụ "Ai là Triệu Phú")

Tham khảo cấu trúc checkpoint của "Ai là Triệu Phú":
- **Câu 1–5:** Hầu hết người chơi đều vượt qua (≥90% tỉ lệ đúng)
- **Câu 6–10:** Người thực hành đạo bình thường biết (≥70%)
- **Câu 11–15:** Phân loại người có học hỏi (<50%)

→ Tương đương Level 1–5, 6–10, 11–15 trong game.
