# PlayFab Integration — Hệ Thống Backend Chính

## Nguyên tắc cốt lõi

> **PlayFab = NƠI LƯU TRỮ TẤT CẢ DATA**
> Firebase = CHỈ dùng cho realtime sync (P2P live game state) + Analytics

```
┌──────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                   │
└──────────┬──────────────────────────────────┬────────────────┘
           │                                  │
     ┌─────▼──────────────┐           ┌──────▼──────────┐
     │      PlayFab        │           │    Firebase      │
     │    (Data Store)     │           │  (Realtime Only) │
     │                     │           │                  │
     │  ✅ Auth            │           │  ✅ Realtime     │
     │  ✅ Player Data     │           │    sync (live    │
     │  ✅ Room Data       │           │    game state,   │
     │  ✅ Leaderboard     │           │    P2P answers)  │
     │  ✅ Statistics      │           │  ✅ Analytics    │
     │  ✅ Economy/Coins   │           │                  │
     │  ✅ Game History    │           │  ❌ KHÔNG lưu    │
     │                     │           │    data lâu dài  │
     │  Title ID: 15C4E5   │           │                  │
     │  Free: 100K players │           │                  │
     └────────────────────┘           └──────────────────┘
```

### Phân chia trách nhiệm

| Tính năng | PlayFab | Firebase | Ghi chú |
|---|:---:|:---:|---|
| **Authentication** | ✅ Primary | ❌ | PlayFab Custom ID → sau chuyển Email |
| **Player Profile** (nickname, settings) | ✅ | ❌ | Player Data |
| **Answered Questions** | ✅ | ❌ | Player Data |
| **Room Data** (tạo phòng, lịch sử) | ✅ | ❌ | Player Data / Entity Data |
| **XP / Global Score** | ✅ | ❌ | Statistics |
| **Coins** | ✅ | ❌ | Virtual Currency |
| **Leaderboard** | ✅ | ❌ | PlayFab Leaderboards |
| **Game Stats** (plays, wins, correct) | ✅ | ❌ | Statistics |
| **Live P2P sync** (realtime answers) | ❌ | ✅ | Firebase Realtime DB (ephemeral) |
| **Presence** (online/offline) | ❌ | ✅ | Firebase Presence |
| **Analytics** | ❌ | ✅ | Firebase Analytics |

> **Quan trọng:** Firebase Realtime DB chỉ chứa **dữ liệu tạm thời** (game state đang chơi). Khi game xong → data lưu về PlayFab, Firebase node bị xóa.

---

## PlayFab Config

- **Title ID:** `15C4E5`
- **SDK:** `playfab-web-sdk` (npm)
- **Free tier:** 100,000 unique players
- **API Latency:** ~50-200ms (Azure CDN)

---

## PlayFab Data Schema

### Player Data (per player)

```json
{
  "AnsweredQuestions": "[\"L01_005\",\"L02_017\",\"L03_042\"]",
  "Nickname": "Gioan 01",
  "Settings": "{\"sound\":true,\"theme\":\"dark\"}",
  "LastRoomPin": "123456",
  "GameHistory": "[{\"date\":\"2026-03-21\",\"score\":750,\"level\":12}]"
}
```

> PlayFab Player Data lưu value dưới dạng **string** → JSON.stringify khi save, JSON.parse khi load.

### Statistics (per player, numeric)

| StatisticName | Mô tả | Aggregation |
|---|---|---|
| `GlobalXP` | Tổng XP tích lũy | Sum |
| `TotalGamesPlayed` | Số ván đã chơi | Sum |
| `TotalCorrectAnswers` | Tổng câu đúng | Sum |
| `PerfectGames` | Số ván perfect (15/15) | Sum |
| `SoloPlays` | Số ván Solo | Sum |
| `P2PWins` | Số ván P2P thắng | Sum |
| `P2PLosses` | Số ván P2P thua | Sum |

### Virtual Currency

| Code | Tên | Initial | Recharge |
|---|---|---|---|
| `CN` | Coins | 500 | Không tự động |

### Leaderboards

| Name | Statistic | Reset |
|---|---|---|
| `GlobalRanking` | `GlobalXP` | Không reset |
| `WeeklyTop` | `WeeklyXP` | Reset hàng tuần |

---

## Phase 1: Question Management (Ưu tiên triển khai)

### Mục tiêu
Thay `DUMMY_QUESTIONS` bằng hệ thống rút 15 câu ngẫu nhiên từ 1500 câu, lưu lịch sử lên PlayFab.

### File mới

```
/src
  /config
    firebase.js          # (giữ nguyên — chỉ dùng cho realtime)
    playfab.js           # [MỚI] PlayFab SDK init
  /store
    playfabStore.js      # [MỚI] PlayFab auth + player data
  /utils
    questionManager.js   # [MỚI] Logic chọn câu hỏi
```

### Question Selection Logic

```
Mỗi ván chơi = 15 câu hỏi (1 câu / level)

Level 1  → random 1 câu từ level_01.json (loại trừ đã trả lời)
Level 2  → random 1 câu từ level_02.json (loại trừ đã trả lời)
...
Level 15 → random 1 câu từ level_15.json (loại trừ đã trả lời)

Nếu tất cả 100 câu trong 1 level đã trả lời → reset pool level đó
```

### Data Flow — Một ván chơi

```
1. [App Start]
   └→ PlayFabClient.LoginWithCustomID({ CustomId: deviceId })
   └→ PlayFabClient.GetUserData({ Keys: ["AnsweredQuestions"] })
   └→ Parse JSON → answeredIds[]

2. [Nhấn "Bắt đầu"]
   └→ questionManager.getQuestionsForGame(answeredIds)
   └→ Trả về 15 câu hỏi (1/level, không trùng)

3. [Trả lời đúng mỗi câu]
   └→ Thêm question.id vào answeredIds[] (local state only)

4. [Kết thúc ván]
   └→ PlayFabClient.UpdateUserData({
        Data: { AnsweredQuestions: JSON.stringify(answeredIds) }
      })
   └→ PlayFabClient.UpdatePlayerStatistics({
        Statistics: [{ StatisticName: "GlobalXP", Value: newXP }]
      })
   └→ 2 API calls — batch save tất cả data cuối ván

5. [Nhấn "Chơi lại"]
   └→ Quay về bước 2 — rút 15 câu hỏi MỚI
```

### Format mapping

```
JSON file:                          Game format:
{                                   {
  "id": "L01_001",          →         "id": "L01_001",
  "question": "...",        →         "question": "...",
  "opt_a": "A",             ┐         "options": ["A","B","C","D"],
  "opt_b": "B",             │→
  "opt_c": "C",             │
  "opt_d": "D",             ┘
  "correct_ans": 1,         →         "answer": 1,
  "explanation": "..."      →         "explanation": "..."
}                                   }
```

---

## Phase 2: Auth + Profile Migration

### Hiện tại
```js
Firebase signInAnonymously → uid → users/{uid}/nickname, coins, global_score
```

### Sẽ chuyển sang
```js
PlayFabClient.LoginWithCustomID → PlayFab Player Data + Statistics + Virtual Currency
Firebase chỉ giữ lại cho realtime rooms (ephemeral data)
```

---

## Phase 3: Full Feature Migration

| Feature | Hiện tại (Firebase) | Chuyển sang (PlayFab) |
|---|---|---|
| Auth | `signInAnonymously` | `LoginWithCustomID` → `LoginWithEmail` |
| Nickname | `users/{uid}/nickname` | Player Data `Nickname` |
| XP/Score | `users/{uid}/global_score` | Statistic `GlobalXP` |
| Coins | `users/{uid}/coins` | Virtual Currency `CN` |
| Stats | `users/{uid}/stats` | Multiple Statistics |
| Rooms | `rooms/{pin}` | PlayFab Player Data (history) + Firebase (live sync only) |
| Ranking | Chưa có | PlayFab Leaderboards |

---

## API Best Practices

| Rule | Chi tiết |
|---|---|
| **Batch saves** | Gom data → save 1 lần cuối ván, không save từng câu |
| **Cache local** | Load data 1 lần khi login → cache trong zustand |
| **Firebase cleanup** | Xóa room data trên Firebase sau khi game kết thúc |
| **Data size** | Player Data max 10KB/key → đủ cho ~700 IDs/key |
| **Overflow** | Khi > 700 IDs → tách thành `AnsweredL01`...`AnsweredL15` |
