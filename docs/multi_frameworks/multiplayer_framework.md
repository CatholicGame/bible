# Multiplayer Framework — Catholic Quiz Platform

> **Mục tiêu:** Cung cấp một template tái sử dụng cho mọi mini-game hỗ trợ cả **Solo** và **2-Player Sync**.
> Tài liệu này là nguồn sự thật duy nhất (SSoT) cho cơ chế multiplayer.

---

## 1. Tổng quan Kiến trúc

```
┌──────────────────────────────────────────────────────────┐
│                     CLIENT (React 19)                     │
│                                                          │
│  ┌─────────────┐   ┌──────────────┐   ┌───────────────┐ │
│  │  Zustand    │   │  Game Engine │   │  Multiplayer  │ │
│  │  Stores     │◄──│  Router      │──►│  Hooks        │ │
│  │(gameStore,  │   │(GameEngine   │   │(useRoom,      │ │
│  │ roomStore,  │   │ .jsx)        │   │ useGameSync,  │ │
│  │ userStore)  │   └──────────────┘   │ useMatchmaking│ │
│  │             │                      │ usePresence)  │ │
│  └─────────────┘                      └───────┬───────┘ │
└──────────────────────────────────────────────┼─────────┘
                                               │ Firebase SDK
                      ┌────────────────────────▼────────────────────────┐
                      │              Firebase Realtime Database          │
                      │                                                  │
                      │  /rooms/{roomId}         /users/{uid}            │
                      │  /matchmaking_queue/     /public_lobby/          │
                      └──────────────────────────────────────────────────┘
```

### Tech Stack tham gia

| Layer | Technology | Vai trò |
|---|---|---|
| **UI** | React 19 + Vite | Render giao diện game |
| **Style** | Tailwind CSS v4 + Framer Motion | Animations, responsive |
| **State** | Zustand | Global state: room, user, game |
| **Icons** | Lucide React | UI icons nhất quán |
| **Realtime DB** | Firebase Realtime Database | Sync game state P2P |
| **Auth** | Firebase Anonymous Auth | Định danh player không cần đăng ký |
| **Content** | Google Sheets → SheetDB API | Nguồn câu hỏi/nội dung |

---

## 2. Game Mode

| Mode | Mô tả | DB Node |
|---|---|---|
| **Solo** | 1 người chơi, không cần đối thủ | `rooms/solo_{uid}_{timestamp}` |
| **Private 2P** | 2 người chơi qua mã phòng 6 số | `rooms/{6-digit-PIN}` |
| **Auto Matchmaking** | Tự động bắt cặp người thật; fallback Bot sau 30s | `rooms/{auto-generated-id}` |

> 📖 Chi tiết Auto Matchmaking & Bot System → xem [`matchmaking_and_bot.md`](./matchmaking_and_bot.md)

---

## 3. Firebase DB Schema — Room Node

```json
{
  "rooms": {
    "{roomId}": {
      "gameType": "crossword",       // "quiz" | "crossword" | "sorting" | ...
      "mode": "p2p",                 // "solo" | "p2p"
      "isPrivate": true,
      "status": "waiting",           // "waiting" | "playing" | "finished"
      "hostUid": "uid_A",
      "guestUid": null,
      "createdAt": 1710000000000,
      "savedRoomId": "saved_abc123", // null nếu không link với Saved Room nào

      "players": {
        "uid_A": { "nickname": "Gioan 01", "isReady": false, "isOnline": true },
        "uid_B": { "nickname": "Maria 02", "isReady": false, "isOnline": true }
      },

      "progress": {
        "uid_A": { "score": 0, "completedItems": [], "lastUpdated": 1710000000000 },
        "uid_B": { "score": 0, "completedItems": [], "lastUpdated": 1710000000001 }
      },

      "result": {
        "winnerUid": null,
        "finalScores": { "uid_A": 0, "uid_B": 0 },
        "finishedAt": null
      }
    }
  }
}
```

---

## 3b. Firebase DB Schema — Saved Rooms Node

Saved Rooms lưu trong `users/{uid}/savedRooms` — chỉ là **cấu hình**, không phải game state.

```json
{
  "users": {
    "uid_A": {
      "nickname": "Gioan 01",
      "global_score": 1540,

      "savedRooms": {
        "saved_abc123": {
          "label": "Phòng Crossword với Thủy",   // tên tùy đặt
          "gameType": "crossword",
          "mode": "p2p",
          "createdAt": 1710000000000,
          "lastUsedAt": 1710009000000,
          "totalSessions": 3                     // đã chơi bao nhiêu lần
        },
        "saved_def456": {
          "label": "Quiz với nhóm",
          "gameType": "quiz",
          "mode": "p2p",
          "createdAt": 1710001000000,
          "lastUsedAt": 1710008000000,
          "totalSessions": 7
        }
      }
    }
  }
}
```

> **Giới hạn:** Mỗi user lưu tối đa **5 phòng** để tránh bloat DB. Khi thêm phòng thứ 6, tự động xóa phòng `lastUsedAt` cũ nhất.

---

## 4. Room Lifecycle (State Machine)

```
                  ┌──────────────┐
                  │   [CREATE]   │
                  │  Host tạo   │
                  │  phòng mới  │
                  └──────┬───────┘
                         │ status: "waiting"
                  ┌──────▼───────┐
                  │  [WAITING]   │
                  │ Chờ Guest   │◄── Guest join bằng PIN
                  │   vào phòng  │
                  └──────┬───────┘
                         │ cả 2 isReady = true
                  ┌──────▼───────┐
                  │  [PLAYING]   │
                  │  Game đang  │◄──► Sync progress real-time
                  │  diễn ra    │
                  └──────┬───────┘
                         │ 1 player hoàn thành / hết giờ
                  ┌──────▼───────┐
                  │  [FINISHED]  │
                  │ Ghi result  │──► Cộng XP vào users/{uid}
                  └─────────────┘
```

---

## 5. Custom Hooks Template

### `useRoom.js` — Quản lý phòng
```
Trách nhiệm:
- createRoom(gameType, hostUid)  → tạo phòng, trả về PIN
- joinRoom(pin, guestUid)        → guest vào phòng
- setReady(roomId, uid)          → đánh dấu player sẵn sàng
- leaveRoom(roomId, uid)         → rời phòng (cleanup)
- watchRoom(roomId, callback)    → lắng nghe thay đổi toàn phòng
```

### `useGameSync.js` — Đồng bộ progress trong game
```
Trách nhiệm:
- updateProgress(roomId, uid, data)   → ghi progress của mình
- watchOpponent(roomId, uid, cb)      → lắng nghe progress đối thủ
- finishGame(roomId, resultData)      → ghi kết quả, trigger endgame
```

### `usePresence.js` — Online/Offline detection
```
Trách nhiệm:
- Dùng Firebase onDisconnect() để auto-set isOnline: false
- Khi kết nối lại → set isOnline: true
- Host disconnect → phòng chuyển sang status: "abandoned"
```

### `useMatchmaking.js` — Auto Matchmaking & Bot fallback
```
Trách nhiệm:
- startSearch(gameType)    → ghi vào matchmaking_queue, poll tìm đối thủ
- cancelSearch()           → xóa khỏi queue
- status                   → "idle" | "searching" | "matched_human" | "matched_bot"
- countdown                → số giây còn lại trước khi fallback Bot
- roomId                   → trả về khi đã match thành công

Bot fallback sau 30s:
- chọn difficulty dựa theo rank người chơi
- BotRunner chạy client-side trên máy Host
- Tên bot chủ đề Công giáo (Bot Phêrô, Bot Phaolô...)
```

### `useSavedRooms.js` — Lưu & tái sử dụng phòng
```
Trách nhiệm:
- savedRooms                        → danh sách Saved Rooms của user (max 5)
- saveRoom(config)                  → lưu phòng mới vào users/{uid}/savedRooms
                                      tham số: { label, gameType, mode }
                                      tự xóa phòng cũ nhất nếu đã có 5
- relaunchRoom(savedRoomId)         → tạo active room mới từ config đã lưu,
                                      cập nhật lastUsedAt + totalSessions
- deleteRoom(savedRoomId)           → xóa khỏi danh sách
- renameRoom(savedRoomId, newLabel) → đổi tên hiển thị
```

---

## 6. Zustand Store Template

### `roomStore.js`
```js
{
  // State
  roomId: null,
  roomData: null,         // full room object từ Firebase
  myRole: null,           // "host" | "guest"
  opponentProgress: null,

  // Actions
  setRoomId, setRoomData, setMyRole, setOpponentProgress,
  resetRoom
}
```

### `gameStore.js` (Game-specific, extend per game)
```js
{
  // Shared
  myProgress: { score: 0, completedItems: [] },
  gameStatus: "idle",  // "idle" | "playing" | "finished"

  // Actions
  updateMyProgress, setGameStatus, resetGame
}
```

---

## 7. Quy tắc Firebase Security Rules

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": "auth != null && (data.child('hostUid').val() === auth.uid || data.child('guestUid').val() === auth.uid)",
        ".write": "auth != null && (data.child('hostUid').val() === auth.uid || data.child('guestUid').val() === auth.uid)",
        "players": {
          "$uid": {
            ".write": "auth != null && auth.uid === $uid"
          }
        },
        "progress": {
          "$uid": {
            ".write": "auth != null && auth.uid === $uid"
          }
        }
      }
    },
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

---

## 8. Tích hợp game mới (Checklist)

Để thêm một mini-game mới có hỗ trợ Solo + 2P + Auto Matchmaking:

- [ ] Tạo folder `/src/components/games/{game_name}/`
- [ ] Implement `{GameName}Game.jsx` — UI chính
- [ ] Implement `{GameName}Solo.jsx` — wrapper solo mode
- [ ] Implement `{GameName}P2P.jsx` — wrapper P2P mode (dùng `useGameSync`)
- [ ] Implement `BotRunner` logic đặc thù cho game (override `handleItemComplete`)
- [ ] Thêm `gameType: "{game_name}"` vào `GameEngine.jsx`
- [ ] Định nghĩa `progress` schema cho game này (field `completedItems` nghĩa là gì?)
- [ ] Test Solo: tạo phòng → chơi → kết quả → XP
- [ ] Test Private 2P: tạo phòng → join PIN → sync → kết quả
- [ ] Test Matchmaking: tìm trận → match người thật → game
- [ ] Test Bot fallback: tìm trận → chờ 30s → match Bot → game
