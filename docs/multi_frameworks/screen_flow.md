# Screen Flow — Solo & 2-Player Mode

> Tài liệu này mô tả luồng màn hình người dùng trải qua cho từng game mode.
> Áp dụng chung cho mọi mini-game (crossword, quiz, sorting...).

---

## 1. Tổng quan Navigation

```
LandingScreen
    │
    ├──► [Solo]          ──────────────────────────────────────────► GameScreen ──► ResultScreen
    │
    ├──► [Tạo phòng]    ──► CreateRoomScreen ──► WaitingRoomScreen ──► GameScreen ──► ResultScreen
    │
    ├──► [Vào phòng]    ──► JoinRoomScreen ────► WaitingRoomScreen ──► GameScreen ──► ResultScreen
    │
    ├──► [Phòng đã lưu] ──► SavedRoomsScreen ──► WaitingRoomScreen ──► GameScreen ──► ResultScreen
    │
    └──► [Tìm trận]     ──► MatchmakingScreen
                              ├──► (match người thật) ──► WaitingRoomScreen ──► GameScreen ──► ResultScreen
                              └──► (hết 30s → Bot)    ─────────────────────► GameScreen ──► ResultScreen
```

---

## 2. Solo Mode Flow

```
┌─────────────────┐     chọn game     ┌─────────────────┐
│  LandingScreen  │ ───────────────► │  GameScreen     │
│                 │                   │  (Solo Mode)    │
│  [Chơi Solo]   │                   │                 │
│  [Chơi 2 Người]│                   │  • Không có UI  │
└─────────────────┘                   │    đối thủ      │
                                      │  • Progress chỉ │
                                      │    của mình     │
                                      └────────┬────────┘
                                               │ hoàn thành
                                      ┌────────▼────────┐
                                      │  ResultScreen   │
                                      │  • Điểm số      │
                                      │  • XP gained    │
                                      │  • [Chơi lại]  │
                                      │  • [Về trang chủ]│
                                      └─────────────────┘
```

**Firebase actions — Solo:**
| Bước | Action |
|---|---|
| Bắt đầu | Tạo `rooms/solo_{uid}_{ts}` với `mode: "solo"` |
| Chơi | Update `rooms/.../progress/{uid}` |
| Kết thúc | Ghi `rooms/.../result`, cộng XP vào `users/{uid}` |
| Cleanup | Xóa node `rooms/solo_...` sau 5 phút |

---

## 3. Private 2-Player Flow

### 3a. Luồng Host (Người tạo phòng)

```
┌─────────────────┐
│  LandingScreen  │
│  [Chơi 2 Người]│
└────────┬────────┘
         │
┌────────▼────────┐    Firebase: tạo room
│ CreateRoom      │    sinh mã PIN 6 số
│ Screen          │ ──────────────────────►  DB: rooms/{PIN}
│                 │                              status: "waiting"
│  Chọn game type │
│  [Tạo phòng]   │
└────────┬────────┘
         │ nhận PIN
┌────────▼────────────────────┐
│  WaitingRoom Screen (Host)  │
│                             │
│  Hiển thị PIN: 123456       │
│  [● Gioan 01]  (Bạn - Host)│
│  [○ đang chờ...]            │
│                             │
│              ← Chờ Guest →  │
└────────┬────────────────────┘
         │ guestUid xuất hiện trong DB
         │ cả 2 bấm [Sẵn sàng]
┌────────▼────────┐
│  GameScreen     │
│  (P2P Mode)     │
└────────┬────────┘
         │
┌────────▼────────┐
│  ResultScreen   │
└─────────────────┘
```

### 3b. Luồng Guest (Người vào phòng)

```
┌─────────────────┐
│  LandingScreen  │
│  [Chơi 2 Người]│
└────────┬────────┘
         │
┌────────▼────────┐
│  JoinRoom       │    Firebase: đọc rooms/{PIN}
│  Screen         │ ──────────────────────►  Kiểm tra PIN hợp lệ
│                 │                          Kiểm tra status = "waiting"
│  [Nhập mã PIN] │                          Ghi guestUid vào room
│  [Vào phòng]   │
└────────┬────────┘
         │ join thành công
┌────────▼────────────────────┐
│  WaitingRoom Screen (Guest) │
│                             │
│  [● Gioan 01]  (Host)       │
│  [● Maria 02]  (Bạn - Guest)│
│                             │
│  [Sẵn sàng]                │
└────────┬────────────────────┘
         │ cả 2 isReady = true → Host set status: "playing"
┌────────▼────────┐
│  GameScreen     │
└────────┬────────┘
         │
┌────────▼────────┐
│  ResultScreen   │
└─────────────────┘
```

---

## 4. GameScreen Layout — 2-Player Mode

```
┌─────────────────────────────────────────┐
│  HEADER: Game Name | Room PIN           │
├──────────────┬──────────────────────────┤
│  MY STATUS   │                          │
│  ────────── │    GAME CONTENT AREA     │
│  Score: 10  │   (Crossword / Quiz /    │
│  Items: 3/8 │    Sorting board...)     │
│             │                          │
│  OPPONENT   │                          │
│  ────────── │                          │
│  Score: 7   │                          │
│  Items: 2/8 │                          │
└──────────────┴──────────────────────────┘
```

**Sidebar hiển thị real-time** từ `rooms/{roomId}/progress/{opponentUid}`.

---

## 5. ResultScreen Layout

```
┌─────────────────────────────────────────┐
│           🏆  KẾT QUẢ  🏆               │
├─────────────────────────────────────────┤
│                                         │
│   [WINNER BADGE]                        │
│        Gioan 01 — Chiến thắng!          │
│                                         │
│  ┌──────────────┬──────────────┐        │
│  │  Gioan 01   │  Maria 02   │        │
│  │  Score: 10  │  Score: 7   │        │
│  │  +120 XP    │  +60 XP     │        │
│  └──────────────┴──────────────┘        │
│                                         │
│  [Chơi lại] [Về trang chủ]             │
└─────────────────────────────────────────┘
```

---

## 5. Saved Rooms Flow

### 5a. Lưu phòng sau khi tạo

```
CreateRoomScreen
    │ Host điền: tên phòng, gameType
    │ ✅ tick [Lưu phòng này để dùng lại]
    ▼
WaitingRoomScreen
    │ sau khi cả 2 ready
    ▼
GameScreen  ───────────────────────────► ResultScreen
                                           │
                          [Lưu phòng này] │ (nếu chưa lưu)
                                           │
                               users/{uid}/savedRooms
```

> Phòng có thể được lưu tại 2 điểm: **(A)** khi tạo phòng (tick checkbox), hoặc **(B)** trên ResultScreen sau khi chᨁi xong.

### 5b. Dùng lại phòng đã lưu

```
┌────────────────────────────────────────────┐
│            SavedRoomsScreen            │
│                                        │
│  Phòng của tôi (3/5)                   │
│  ──────────────────────────────────────  │
│  [ 📏 Phòng Crossword với Thủy        ] │
│  [ Crossword · 2P · 3 lần chơi        ] │
│  [ [Chơi lại]  [Sửa tên]  [❌ Xóa]   ] │
│  ──────────────────────────────────────  │
│  [ 📏 Quiz với nhóm                    ] │
│  [ Quiz · 2P · 7 lần chơi             ] │
│  [ [Chơi lại]  [Sửa tên]  [❌ Xóa]   ] │
│  ──────────────────────────────────────  │
│                                        │
│         [+ Tạo phòng mới]             │
└────────────────────────────────────────────┘
          │
    [Chơi lại] bấm
          │ relaunchRoom(savedRoomId)
          │ → tạo active room mới từ config
          │ → cập nhật lastUsedAt, totalSessions++
          ▼
    WaitingRoomScreen
    (chờ guest cũ hoặc người mới vào)
```

---

## 6. Auto Matchmaking Screen Flow

```
┌────────────────────────────────────────────┐
│              MatchmakingScreen             │
│                                            │
│   🔍 Đang tìm đối thủ...                  │
│                                            │
│   ┌────────────────────────────────────┐  │
│   │  [███████████████░░░░░░░░░░░░░░]  │  │
│   │  23s — Ưu tiên người thật         │  │
│   └────────────────────────────────────┘  │
│                                            │
│   Crossword · Chế độ: Tìm trận            │
│                                            │
│              [Hủy tìm kiếm]               │
└────────────────────────────────────────────┘
          │                    │
   Tìm thấy người         Hết 30s
          │                    │
          ▼                    ▼
   WaitingRoomScreen     GameScreen + Bot
   (2 người thật)        (hasBot: true)
```

**Trạng thái UI của MatchmakingScreen:**

| Giai đoạn | Hiển thị |
|---|---|
| 0–30s | Progress bar countdown, "Đang tìm người thật..." |
| Tìm thấy người | Flash xanh "Tìm thấy đối thủ! 🎉" → chuyển WaitingRoom |
| Hết 30s | Flash vàng "Không tìm thấy, ghép với Bot..." → vào game ngay |
| Trong game có Bot | Badge nhỏ "🤖 Bot" trên avatar đối thủ |

---

## 7. Error States & Edge Cases

| Tình huống | Xử lý |
|---|---|
| PIN không tồn tại | Toast error "Mã phòng không hợp lệ" |
| Phòng đã đầy (có guest) | Toast error "Phòng đã có người" |
| Game đang diễn ra | Toast error "Trận đấu đã bắt đầu" |
| Đối thủ mất kết nối | UI hiện "Đối thủ mất kết nối..." + timer 30s |
| Host mất kết nối | Guest thấy popup "Host đã rời phòng" → trở về Home |
| Người chơi tự rời | Result tính người còn lại thắng |
| User cancel matchmaking | `removeFromQueue(uid)` → trở về Home |
| App crash khi searching | `onDisconnect().remove()` tự dọn queue |
