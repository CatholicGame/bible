# Game Economy — Hệ Thống Kinh Tế

## Tổng quan

Game sử dụng **2 đơn vị** riêng biệt:

| | ⭐ XP (Kinh Nghiệm) | 🪙 Coins (Đồng Vàng) |
|---|---|---|
| Mục đích | Đo kinh nghiệm → xếp Rank | Tiền tệ bet P2P |
| Hướng đi | **Chỉ tăng**, không bao giờ mất | **Lên xuống** khi bet |
| Quyết định | Rank, mở khóa nội dung | Sức mạnh tài chính |

---

## ⭐ XP — Quy Tắc

### Nguồn XP

| Nguồn | XP | Ghi chú |
|-------|-----|---------|
| Hoàn thành trận Solo | +30 | Cố định |
| Mỗi câu đúng (Solo) | +8 | Max 15 câu = 120 XP |
| Hoàn thành trận P2P | +40 | Cả thắng lẫn thua |
| Thắng P2P | +25 bonus | |
| Mỗi câu đúng (P2P) | +5 | |
| Streak 3 câu đúng | x1.3 | Áp dụng cho XP câu đúng |
| Streak 5 câu đúng | x1.5 | |
| Game đầu tiên ngày | +15 | |

### Ví dụ thực tế
```
Solo (10/15 đúng):  30 + 80 ≈ 110 XP
Solo perfect:       30 + 120 + streak ≈ 195 XP
P2P thắng (8/15):   40 + 25 + 40 ≈ 105 XP
P2P thua (5/15):    40 + 25 ≈ 65 XP
```

---

## 🪙 Coins — Quy Tắc

| Nguồn | Coins | Ghi chú |
|-------|-------|---------|
| Tân user | +500 🪙 | Vốn khởi đầu |
| Hoàn thành solo | +10 🪙 | |
| Solo perfect | +30 🪙 bonus | |
| Thắng bet P2P | +bet 🪙 | Lấy từ đối thủ |
| Thua bet P2P | -bet 🪙 | Trả cho đối thủ |
| Daily login | +20 🪙 | |
| Login streak 7 ngày | +100 🪙 | |
| Lên rank mới | +100 🪙 | |

---

## 📊 Bảng Rank

| Lv | Tên | XP cần | Ước tính |
|----|-----|--------|----------|
| 1 | Người Tìm Hiểu | 0 | Bắt đầu |
| 2 | Dự Tòng | 1,000 | ~10 trận |
| 3 | Chiên Con | 3,000 | ~30 trận |
| 4 | Thiên Thần Nhỏ | 6,000 | ~1 tháng casual |
| 5 | Thiếu Nhi Thánh Thể | 10,000 | ~3 tháng |
| 6 | Lên Đường | 16,000 | ~2 tháng |
| 7 | Người Phục Vụ | 25,000 | ~3 tháng |
| 8 | Môn Đệ | 40,000 | ~6 tháng |
| 9 | Chứng Nhân | 60,000 | ~9 tháng |
| 10 | Người Gieo Hạt | 85,000 | ~1 năm |
| 11 | Sứ Giả Tin Mừng | 120,000 | ~1.5 năm |
| 12 | Tông Đồ | 200,000 | ~2.5 năm |

> Casual = 2-3 trận/ngày (~110 XP/trận)

---

## 🎲 Bảng Bet (Coins)

| Rank | 🕯️ Nhẹ | ⚔️ Vừa | 🔥 Nặng |
|------|---------|---------|---------|
| Lv1 | 10 | 25 | 50 |
| Lv2 | 15 | 40 | 80 |
| Lv3 | 20 | 50 | 100 |
| Lv4 | 30 | 75 | 150 |
| Lv5 | 40 | 100 | 200 |
| Lv6 | 60 | 150 | 300 |
| Lv7 | 80 | 200 | 400 |
| Lv8 | 120 | 300 | 600 |
| Lv9 | 180 | 450 | 850 |
| Lv10 | 250 | 600 | 1,200 |
| Lv11 | 350 | 800 | 1,800 |
| Lv12 | 500 | 1,200 | 2,500 |

### Quy tắc bet
- **Private Room**: Host chọn mức → Guest đồng ý hoặc rời
- **Auto Match**: Chọn tier → match ai cùng tier → bet = MIN(2 bên)
- Cả 2 phải đủ coins mới cho phép
