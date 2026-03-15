# Auto Matchmaking & Bot System

> Hệ thống tự động bắt cặp người chơi với **ưu tiên người thật**, fallback sang **Bot** sau giới hạn thời gian.

---

## 1. Tổng quan Luồng Matchmaking

```
Người chơi bấm [Tìm trận]
         │
         ▼
Ghi vào matchmaking_queue/{uid}
         │
         ▼
┌────────────────────────────┐
│   Vòng lặp tìm kiếm        │    mỗi 2 giây (client thực hiện)
│   + countdown timer        │
│   [===========---] 30s     │
└────────────────────────────┘
         │                │
  Tìm thấy người thật   Hết 30s
         │                │
         ▼                ▼
  Tạo phòng P2P     Tạo phòng P2P
  (2 người thật)    (1 người + 1 Bot)
         │                │
         └───────┬─────────┘
                 ▼
         Vào WaitingRoom → Game
```

---

## 2. Firebase Schema bổ sung

### `matchmaking_queue/` (Node)

```json
{
  "matchmaking_queue": {
    "{uid}": {
      "nickname": "Gioan 01",
      "gameType": "crossword",       // game muốn chơi
      "joinedAt": 1710000000000,
      "status": "searching"          // "searching" | "matched"
    }
  }
}
```

### `rooms/{roomId}` — bổ sung khi có Bot

```json
{
  "rooms": {
    "{roomId}": {
      "mode": "p2p",
      "hasBot": true,                // đánh dấu có Bot
      "players": {
        "{uid}": {
          "nickname": "Gioan 01",
          "isBot": false
        },
        "bot_{gameType}_{timestamp}": {
          "nickname": "Bot Phao Lô",  // tên Bot theo chủ đề
          "isBot": true,
          "difficulty": "medium"      // "easy" | "medium" | "hard"
        }
      }
    }
  }
}
```

---

## 3. Matchmaking Logic (Client-side)

> **Lý do dùng client-side thay vì Cloud Function:**
> Đơn giản hơn cho 2P game, không cần server luôn chạy, dễ debug.
> Cloud Function chỉ cần khi scale lên nhiều người chơi.

```js
// /src/hooks/useMatchmaking.js

const MATCH_TIMEOUT_MS = 30_000   // 30 giây
const POLL_INTERVAL_MS = 2_000    // poll mỗi 2 giây

export function useMatchmaking(gameType) {
  const [status, setStatus] = useState('idle')
  // "idle" | "searching" | "matched_human" | "matched_bot" | "error"
  const [countdown, setCountdown] = useState(MATCH_TIMEOUT_MS / 1000)
  const [roomId, setRoomId] = useState(null)

  const startSearch = async () => {
    setStatus('searching')
    // 1. Ghi mình vào queue
    await writeToQueue(uid, gameType)

    // 2. Poll tìm đối thủ
    const interval = setInterval(async () => {
      const opponent = await findOpponentInQueue(gameType, uid)
      if (opponent) {
        clearInterval(interval)
        clearTimeout(timeout)
        const newRoomId = await createMatchedRoom(uid, opponent.uid, gameType)
        setRoomId(newRoomId)
        setStatus('matched_human')
      }
    }, POLL_INTERVAL_MS)

    // 3. Timeout → fallback Bot
    const timeout = setTimeout(async () => {
      clearInterval(interval)
      await removeFromQueue(uid)
      const newRoomId = await createBotRoom(uid, gameType)
      setRoomId(newRoomId)
      setStatus('matched_bot')
    }, MATCH_TIMEOUT_MS)
  }

  const cancelSearch = async () => {
    await removeFromQueue(uid)
    setStatus('idle')
  }

  return { status, countdown, roomId, startSearch, cancelSearch }
}
```

### `findOpponentInQueue` — tìm người đầu tiên hợp lệ

```js
async function findOpponentInQueue(gameType, myUid) {
  const snap = await get(ref(db, 'matchmaking_queue'))
  const queue = snap.val() ?? {}

  return Object.entries(queue).find(([uid, data]) =>
    uid !== myUid &&
    data.gameType === gameType &&
    data.status === 'searching'
  )?.[0]  // trả về uid của đối thủ
}
```

---

## 4. Bot Logic System

### 4a. Kiến trúc Bot

Bot **không dùng server**. Bot được **simulate ngay trên client** của người chơi thật (host).
Host chịu trách nhiệm chạy Bot logic và ghi progress của Bot vào Firebase.

```
┌──────────────────────────────────────┐
│         HOST CLIENT (người thật)     │
│                                      │
│  ┌───────────────┐  ┌─────────────┐ │
│  │  Game của    │  │  Bot Runner │ │
│  │  mình        │  │  (simulate) │ │
│  └───────┬───────┘  └──────┬──────┘ │
│          │                 │         │
│          └─────────┬───────┘         │
│                    │ Firebase write   │
└────────────────────┼─────────────────┘
                     ▼
              rooms/{roomId}/progress/bot_{id}
```

### 4b. Bot Difficulty Levels

| Level | Behavior |
|---|---|
| **Easy** | Delay dài (5-10s/item), sai 40% |
| **Medium** | Delay vừa (2-5s/item), sai 20% |
| **Hard** | Delay ngắn (1-3s/item), sai 5% |

> **Difficulty được chọn tự động** dựa trên rank của người chơi:
> - Tân Tòng / Chiên Con → Easy
> - Môn Đệ / Sứ Giả → Medium
> - Tông Đồ → Hard

### 4c. Bot Runner Template

```js
// /src/utils/botRunner.js

export class BotRunner {
  constructor({ roomId, botUid, difficulty, questions, db }) {
    this.roomId = roomId
    this.botUid = botUid
    this.difficulty = difficulty
    this.questions = questions
    this.db = db
    this.score = 0
    this.completedItems = []
    this.timers = []
  }

  start() {
    const config = DIFFICULTY_CONFIG[this.difficulty]
    // Lên lịch cho từng item
    this.questions.forEach((item, index) => {
      const delay = this.randomDelay(config, index)
      const willFail = Math.random() < config.errorRate

      const timer = setTimeout(() => {
        if (!willFail) {
          this.score += item.points ?? 1
          this.completedItems.push(item.id)
          this.syncProgress()
        }
      }, delay)

      this.timers.push(timer)
    })
  }

  syncProgress() {
    update(ref(this.db, `rooms/${this.roomId}/progress/${this.botUid}`), {
      score: this.score,
      completedItems: [...this.completedItems],
      lastUpdated: Date.now(),
    })
  }

  stop() {
    this.timers.forEach(clearTimeout)
  }

  randomDelay(config, index) {
    const [min, max] = config.delayRange
    const base = Math.random() * (max - min) + min
    // Bot bắt đầu chậm hơn ở đầu (tự nhiên hơn)
    return (base + index * 500) * 1000
  }
}

const DIFFICULTY_CONFIG = {
  easy:   { delayRange: [5, 10], errorRate: 0.40 },
  medium: { delayRange: [2, 5],  errorRate: 0.20 },
  hard:   { delayRange: [1, 3],  errorRate: 0.05 },
}
```

### 4d. Bot Names (Themed)

```js
// /src/utils/botNames.js
export const BOT_NAMES = [
  'Bot Phao Lô', 'Bot Phêrô', 'Bot Gioan', 'Bot Mátthêu',
  'Bot Tôma', 'Bot Luca', 'Bot Máccô', 'Bot Barnabê',
]

export function randomBotName() {
  return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
}
```

---

## 5. Tích hợp Bot Runner vào P2P Wrapper

```jsx
// Trong {GameName}P2P.jsx — khi room hasBot === true

useEffect(() => {
  if (!roomData?.hasBot) return

  const botUid = Object.keys(roomData.players).find(
    uid => roomData.players[uid].isBot
  )
  if (!botUid || myRole !== 'host') return  // chỉ host chạy bot

  const bot = new BotRunner({
    roomId, botUid,
    difficulty: roomData.players[botUid].difficulty,
    questions,
    db,
  })
  bot.start()

  return () => bot.stop()  // dừng khi unmount
}, [roomData, myRole])
```

---

## 6. Edge Cases

| Tình huống | Xử lý |
|---|---|
| 2 người cùng tìm nhau đồng thời | Người `joinedAt` nhỏ hơn làm Host |
| Người chơi cancel search | `removeFromQueue(uid)` — xóa khỏi queue |
| App crash khi đang search | Firebase `onDisconnect` tự xóa node queue |
| Bot "thắng" người chơi | Hiển thị kết quả bình thường, thông báo nhỏ "Đối thủ hôm nay là Bot" |
| Người chơi (host) tắt app giữa game Bot | Bot stop tự động, game ghi result sau 60s không có activity |

---

## 7. onDisconnect Cleanup cho Matchmaking Queue

```js
// Khi bắt đầu search — đảm bảo tự cleanup nếu crash
const myQueueRef = ref(db, `matchmaking_queue/${uid}`)
onDisconnect(myQueueRef).remove()
```
