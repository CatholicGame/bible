# Firebase Realtime Database + Google Sheets Structure

This document outlines the data model for the Catholic Quiz **Platform** (supporting multiple mini-games, Solo, and P2P modes).

## 1. Content Source (Google Sheets / SheetDB)
This source is READ-ONLY for players. It provides the question bank when a game starts.

### `Questions / Content` Sheets
Mỗi mini-game sẽ có một Sheet (hoặc cấu trúc API) riêng biệt, ví dụ:
- **Quiz Game:** `id`, `text`, `opt_a`, `opt_b`, `opt_c`, `opt_d`, `correct_ans`, `time_limit`
- **True/False Game:** `id`, `text`, `is_true`
- **Sorting Game (Sắp xếp sự kiện):** `id`, `event_1`, `event_2`, `event_3`, `correct_order`

## 2. Realtime State (Firebase Realtime Database)
This manages the live matchmaking and active game states.

### `public_lobby/` (Node) - NEW
Nơi tập trung tất cả người chơi đang online và muốn tìm trận đấu ngẫu nhiên (Public Matchmaking).
```json
{
  "active_players": {
    "player_uid_123": {
      "nickname": "Gioan 01",
      "status": "idle", // "idle" -> "searching" -> "in_game"
      "current_game_type": null, // VD: "quiz", "sorting", "true_false"
      "last_seen": 16987654321
    }
  },
    "player_uid_789": {
      "nickname": "Maria 02",
      "status": "searching",
      "last_seen": 16987654355
    }
  },
  "stats": {
    "total_online": 42,
    "total_searching": 8
  }
}
```

### `matchmaking_queue/` (Node)
Chỉ chứa những người có `status: "searching"` từ Public Lobby. Cloud Function sẽ quét danh sách này, nếu đủ 4 người sẽ tự động nhặt họ ra và ném vào một `room` mới tạo (Public Room).
```json
{
  "player_uid_789": { "joinedAt": 16987654355, "level": 1 },
  "player_uid_abc": { "joinedAt": 16987654358, "level": 1 }
}
```

### `rooms/` (Node)
Manages the active game sessions (Cả Private có PIN và Public cấm mã PIN).
```json
{
  "room_999999": { // Nếu ID là 6 số: Đây là Private Room (Cần PIN)
    "gameType": "quiz", // Lõi game nào đang được chơi (quiz, sorting...)
    "mode": "p2p", // "solo" hoặc "p2p"
    "isPrivate": true,
    "hostUid": "host_uid_456",
    // ... metadata ...
  },
  "public_room_abc123": { // Nếu ID là chuỗi ngẫu nhiên: Đây là Public Room (Hệ thống tự tạo)
    "gameType": "sorting",
    "mode": "p2p",
    "isPrivate": false,
    "hostUid": "system", // Không có Host người thật, Server tự làm Host
    "status": "waiting_for_players", // -> "playing" -> "finished"
    "currentQuestionIndex": 0,
    "questions": [
      // Bài tập/Câu hỏi được fetch từ SheetDB cho game này
    ],
    "players": {
      "player_uid_123": {
        "nickname": "Gioan 01",
        "score": 0,
        "isReady": true
      },
      "player_uid_789": {
        "nickname": "Maria 02",
        "score": 0,
        "isReady": true
      }
    },
    // Used during active question
    "currentAnswers": {
      "player_uid_123": {
        "answer": "B",
        "timeTaken": 1.5 // seconds
      }
    }
  }
}
```

### `users/` (Node) - GLOBAL RANKING
Lưu trữ thông tin hành trình và điểm số tích lũy của người chơi từ TẤT CẢ các Mini-game.
Dù chơi Solo hay P2P, điểm kinh nghiệm đều cộng dồn về đây để xếp hạng.
```json
{
  "player_uid_123": {
    "nickname": "Gioan 01",
    "global_score": 1540,
    "rank": "Môn Đệ", // Hệ thống cấp bậc: Tân Tòng -> Chiên Con -> Môn Đệ -> Sứ Giả -> Tông Đồ
    "createdAt": 16987654321
  }
}
```

## Data Flow Notes:
- **Solo Mode:** Người chơi bấm "Chơi Solo". App vẫn tự tạo một `rooms/solo_xxx` trên Firebase nhưng chỉ có 1 `players`. Nhờ đó Logic phân tích điểm/시간 (Analytics) vẫn được giữ nguyên như chơi mạng.
- **P2P Mode (Bạn bè - Private):** Host chọn 1 Mini-game -> Tạo phòng -> Firebase sinh mã PIN 6 số. Ghi `gameType` vào Room. Bạn bè nhập PIN -> Màn hình điện thoại tự động Render giao diện Controller tương ứng với `gameType` của phòng đó.
- **P2P Mode (Public):** Bấm "Tìm trận" -> Chọn Mini-game muốn chơi (`gameType`) -> Vào `matchmaking_queue`. Đủ người thì Server tạo Public Room.
- **Dynamic Controller:** Frontend React sẽ có một "Game Engine Router". Khi vào phòng, nó đọc `room.gameType`. Nếu là `quiz`, hiện 4 nút màu. Nếu là `sorting`, hiện danh sách kéo thả (Drag & Drop).
