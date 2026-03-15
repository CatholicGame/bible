# Crossword (Ô Chữ Công Giáo)

## 1. Luật Chơi

- Người chơi được cung cấp một **bảng ô chữ** với các từ giao nhau theo chiều **Ngang (→)** và **Dọc (↓)**.
- Mỗi từ có một **số thứ tự** và **gợi ý** (clue) tương ứng — tất cả theo chủ đề Công giáo.
- Click vào một **ô trống** để chọn, nhập chữ cái bằng bàn phím ảo hoặc bàn phím vật lý.
- Click lại **ô đang chọn** để chuyển hướng nhập (Ngang ↔ Dọc).
- Click vào **gợi ý** trong danh sách clue để nhảy thẳng đến từ tương ứng trên bảng.
- Nhấn nút **"Kiểm tra"** để kiểm tra tất cả các từ đã điền đầy đủ:
  - Từ **đúng** → chuyển sang màu xanh lá ✓
  - Từ **sai** → chuyển sang màu đỏ (cho phép sửa lại)
- Từ sẽ **tự động được đánh dấu đúng** ngay khi tất cả các ô của từ đó được điền chính xác.
- **Thời gian**: 5 phút. Hết thời gian → game kết thúc tự động.
- **Hoàn thành 100%** tất cả các từ → game kết thúc sớm với hiệu ứng ăn mừng.

### Gợi ý (Solo mode)

| Loại gợi ý   | Chi phí | Mô tả                        |
|---------------|---------|-------------------------------|
| Mở 1 chữ cái | 20 🪙   | Hiện đáp án cho ô đang chọn  |
| Mở cả từ     | 50 🪙   | Hiện toàn bộ đáp án của 1 từ |

- Chi phí hint bị **trừ ngay lập tức** khi sử dụng (không chờ kết thúc game).

---

## 2. Cơ Chế Thưởng (Solo Mode)

### ⭐ XP

| Nguồn                | Giá trị             | Điều kiện             |
|----------------------|----------------------|-----------------------|
| Mỗi từ đúng         | +3 XP / từ           | Luôn tính             |
| Hoàn thành puzzle    | +20 XP               | Luôn tính             |
| Không dùng hint      | +10 XP               | Không dùng hint nào   |
| Tốc độ nhanh         | +10 XP               | Hoàn thành trong < 2 phút |

**Ví dụ**: 12 từ đúng, không hint, hoàn thành trong 1:30  
→ `(12 × 3) + 20 + 10 + 10` = **76 XP**

### 🪙 Coin

| Nguồn                | Giá trị             | Điều kiện               |
|----------------------|----------------------|-------------------------|
| Mỗi từ đúng         | +5 🪙 / từ           | Luôn tính               |
| Hoàn thành puzzle    | +20 🪙               | Luôn tính               |
| Bonus hoàn hảo       | +20 🪙               | Đúng 100% tất cả các từ |
| Chi phí hint         | −20 hoặc −50 🪙      | Đã trừ live khi dùng    |

**Tổng Coin nhận** = (coin thưởng) − (hint đã dùng)

**Ví dụ**: 12 từ đúng (100%), dùng 1 hint mở chữ (20🪙)  
→ `(12 × 5) + 20 + 20 − 20` = **80 🪙**

### Điểm số (Score)

```
Score = (số từ đúng × 10) + floor(thời gian còn lại / 10)
```

---

## 3. Chơi Lại & Chơi Mới

| Hành động | Puzzle | XP | Coin |
|-----------|--------|-----|------|
| **Chơi Lại** | Cùng puzzle | **0 XP** | +2 🪙 / từ đúng (không có completion/perfect bonus) |
| **Chơi Mới** | Puzzle khác ngẫu nhiên | **Full rewards** (xem bảng trên) | **Full rewards** |

- Chơi Lại giữ nguyên chi phí hint (20/50 🪙)
- Chơi Mới quay về màn intro với puzzle mới
