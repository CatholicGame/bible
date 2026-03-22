# Ai Là Nhà Thần Học — Data Schema

> Game dạng "Ai Là Triệu Phú" với 15 câu hỏi trắc nghiệm Công giáo, thang phần thưởng leo dần, 3 mốc an toàn (Q5, Q10, Q15) và 4 quyền trợ giúp.

---

## 1. Content Source (Google Sheets → SheetDB)

### Nguyên tắc phủ chủ đề

> [!IMPORTANT]
> Câu hỏi phải **phủ đều tất cả các chủ đề** Công giáo, không tập trung vào 1-2 mảng. Các mảng cần bao gồm:

| Mảng | Ví dụ nội dung |
|------|---------------|
| 📖 **Kinh Thánh** | Cựu Ước, Tân Ước, các sách, câu chuyện, dụ ngôn, phép lạ |
| ⛪ **Giáo lý** | Giáo lý Hội Thánh, tín điều, bí tích, đạo đức, luân lý |
| 📜 **Lịch sử Giáo hội** | Các Công đồng, phong trào, biến cố lịch sử, khai sinh Giáo hội |
| 👤 **Nhân vật** | Các Thánh, Giáo hoàng, ngôn sứ, Tông đồ, vua, nhân vật Cựu Ước |
| 🎉 **Sự kiện & Phụng vụ** | Mùa phụng vụ, lễ trọng, nghi thức, kinh nguyện |
| 🌍 **Địa lý Thánh Kinh** | Các vùng đất, thành phố, sông, núi trong Kinh Thánh & lịch sử GH |
| 🎨 **Nghệ thuật & Văn hóa** | Biểu tượng, kiến trúc nhà thờ, thánh ca, nghệ thuật Công giáo |
| 📿 **Đời sống đức tin** | Cầu nguyện, ơn gọi, tu trì, truyền giáo, hoạt động bác ái |

### Tổ chức Question Bank

Câu hỏi được **nhóm theo level** (1–15), mỗi level có **~100 câu** trong bank.
Tổng bank: **~1,500 câu hỏi**.

| Level | Sheet/Tab | Số câu | Difficulty |
|-------|-----------|--------|------------|
| 1 | `level_01` | ~100 | 1.0 |
| 2 | `level_02` | ~100 | 1.2 |
| 3 | `level_03` | ~100 | 1.5 |
| 4 | `level_04` | ~100 | 1.8 |
| 5 | `level_05` | ~100 | 2.2 |
| 6 | `level_06` | ~100 | 2.6 |
| 7 | `level_07` | ~100 | 3.0 |
| 8 | `level_08` | ~100 | 3.5 |
| 9 | `level_09` | ~100 | 4.0 |
| 10 | `level_10` | ~100 | 4.5 |
| 11 | `level_11` | ~100 | 5.0 |
| 12 | `level_12` | ~100 | 5.5 |
| 13 | `level_13` | ~100 | 6.0 |
| 14 | `level_14` | ~100 | 7.0 |
| 15 | `level_15` | ~100 | 8.0 |

### Schema mỗi câu hỏi

| Cột | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| `id` | string | ✅ | ID duy nhất, VD: `L01_042` (Level 01, câu 42) |
| `question` | string | ✅ | Nội dung câu hỏi |
| `opt_a` | string | ✅ | Đáp án A |
| `opt_b` | string | ✅ | Đáp án B |
| `opt_c` | string | ✅ | Đáp án C |
| `opt_d` | string | ✅ | Đáp án D |
| `correct_ans` | number (0-3) | ✅ | Index đáp án đúng (0=A, 1=B, 2=C, 3=D) |
| `explanation` | string | ✅ | Giải thích sau khi trả lời (hỗ trợ **Markdown bold**) |
| `category` | string | ❌ | Chủ đề phụ: `"kinh_thanh"`, `"phung_vu"`, `"giao_hoi"`, `"thanh_nhan"` |

> [!NOTE]
> Cột `difficulty` không cần lưu trong sheet vì đã ngầm định bởi level (sheet/tab).

### Quy tắc lấy câu hỏi — On-Demand + Không trùng lặp

Câu hỏi được lấy **từng câu một** khi người chơi tiến đến level đó, **không fetch hết 15 câu từ đầu**.

```
Khi người chơi đến câu Q(n):
  1. Lấy danh sách seenIds từ Firebase:  users/{uid}/seenQuestions/level_{n}
  2. Fetch pool câu hỏi từ SheetDB:      level_{n} sheet
  3. Lọc bỏ các câu có id ∈ seenIds
  4. Random chọn 1 câu từ pool còn lại
  5. Ghi id câu đã chọn vào seenIds
  6. Hiển thị câu hỏi cho người chơi
```

### Firebase Node: `users/{uid}/seenQuestions/`

Lưu trữ danh sách ID câu hỏi mà người chơi **đã từng gặp**, phân theo level:

```json
{
  "level_1": ["L01_003", "L01_017", "L01_042", "L01_089"],
  "level_2": ["L02_011", "L02_055"],
  "level_3": [],
  ...
  "level_15": []
}
```

> [!IMPORTANT]
> - Khi người chơi đã xem hết ~100 câu của 1 level → **reset** danh sách `seenIds` của level đó (xáo trộn lại từ đầu).
> - Quyền trợ giúp **Đổi câu (Swap)** cũng lấy câu mới từ cùng level, loại trừ câu hiện tại + seenIds.

---

## 2. Firebase Realtime Database — Game State

### 2.1. Room Node: `rooms/{roomId}`

Mỗi trận (Solo hoặc P2P) đều tạo một Room trên Firebase.

```json
{
  "gameType": "pinnacle",
  "mode": "solo",               // "solo" | "p2p"
  "isPrivate": true,
  "hostUid": "uid_abc",
  "status": "playing",          // "waiting_for_players" → "playing" → "finished"
  "createdAt": 1710900000000,

  "settings": {
    "questionCount": 15,        // Cố định 15
    "timePerQuestion": 30,      // Giây
    "betAmount": 0              // Coins bet (P2P only, 0 nếu Solo)
  },

  "questions": [
    {
      "id": "PQ001",
      "question": "Tên vị Giáo hoàng đầu tiên của Giáo hội Công giáo là gì?",
      "options": ["Thánh Phêrô", "Thánh Phaolô", "Thánh Anrê", "Thánh Giacôbê"],
      "answer": 0,
      "explanation": "Chúa Giêsu đã trao chìa khóa Nước Trời cho **Thánh Phêrô**...",
      "difficulty": 1.0
    }
    // ... 15 câu
  ],

  "currentQuestionIndex": 3,

  "players": {
    "uid_abc": {
      "nickname": "Gioan 01",
      "score": 30,              // Coins earned (theo bảng REWARDS)
      "xpEarned": 10,           // XP earned (theo bảng XP_REWARDS)
      "currentLevel": 4,        // Đang ở câu hỏi thứ mấy (1-indexed)
      "isAlive": true,          // false = đã trả lời sai / hết giờ
      "isReady": true,
      "lifelines": {
        "fiftyFifty": false,    // true = đã sử dụng
        "phone": false,
        "audience": false,
        "swap": false
      }
    }
  },

  "currentAnswers": {
    "uid_abc": {
      "answer": 0,
      "timeTaken": 12.5,
      "isCorrect": true
    }
  }
}
```

### 2.2. Player State (Client-Side — Zustand)

State trong `PinnacleGame.jsx` component:

```javascript
{
  gameState: "rules" | "playing" | "finished",
  introPhase: 0-4,             // Animation phases: 0→start, 1→ladder, 2→lifelines, 3→MC, 4→question
  currentQuestionIndex: 0-14,  // 0-indexed
  score: 0,                    // Coins earned (hiện tại)
  xpScore: 0,                  // XP earned (hiện tại)
  selectedOption: null | 0-3,
  isAnswerRevealed: false,
  answerStep: "thinking" | "explained",
  timeLeft: 30,                // Countdown timer (giây)
  explanationTimeLeft: 15,     // Giây đếm ngược ở bước giải thích

  // Lifelines
  lifelines: {
    fiftyFifty: false,         // true = đã dùng
    phone: false,
    audience: false,
    swap: false
  },
  hiddenOptions: [],           // Index các đáp án bị ẩn bởi 50:50

  // 50:50 state
  confirmFiftyFifty: false,
  isScanningFiftyFifty: false,

  // Hỏi ý kiến khán giả
  confirmAudience: false,
  audienceState: null | "loading" | "results",
  audienceVotes: [25, 40, 10, 25],  // % cho mỗi đáp án

  // Gọi điện thoại
  confirmPhone: false,
  phoneState: null | "calling" | "answering",
  phoneMessage: "",
  displayedPhoneMessage: "",
  phoneTimeLeft: 30,

  // Đổi câu hỏi
  confirmSwap: false,
  isSwapping: false,

  // Visual effects
  spotlightFlash: 0,
  spotlightSwing: 0,
  spotlightWrong: 0,
  showGameConfetti: false,
  xpParticles: [],

  // MC (Người dẫn chương trình)
  mcMessage: "",
  showMcBubble: false,
  endMessage: null,

  // Display (animated counters)
  displayScore: 0,
  displayXpScore: 0
}
```

---

## 3. Thang Phần Thưởng & Mốc An Toàn

### 3.1. Bảng Coins (REWARDS)

| Câu | Q1 | Q2 | Q3 | Q4 | **Q5** 🛡️ | Q6 | Q7 | Q8 | Q9 | **Q10** 🛡️ | Q11 | Q12 | Q13 | Q14 | **Q15** 🏆 |
|-----|----|----|----|----|-----------|----|----|----|----|------------|-----|-----|-----|-----|-----------|
| 🪙 Coins | 5 | 10 | 20 | 30 | **50** | 75 | 100 | 140 | 190 | **250** | 350 | 450 | 600 | 800 | **1000** |

> **Mốc an toàn (Milestones):** Q5, Q10, Q15.
> Khi trả lời sai, điểm coins rơi xuống mốc an toàn gần nhất đã qua. Nếu chưa qua mốc nào → 0 coins.

### 3.2. Bảng XP (XP_REWARDS)

| Câu | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Q11 | Q12 | Q13 | Q14 | Q15 |
|-----|----|----|----|----|----|----|----|----|----|----|-----|-----|-----|-----|-----|
| ⭐ XP | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
| ⭐ Tích lũy | 1 | 3 | 6 | 10 | 15 | 21 | 28 | 36 | 45 | 55 | 66 | 78 | 91 | 105 | **120** |

> **XP không bị rơi** khi trả lời sai — chỉ dừng tích lũy tại câu sai.

---

## 4. Quyền Trợ Giúp (Lifelines)

Mỗi quyền chỉ được sử dụng **1 lần** trong toàn bộ trận.

| Quyền | Icon | Cơ chế |
|-------|------|--------|
| **50:50** | ✂️ | Loại bỏ 2 đáp án sai ngẫu nhiên, để lại đáp án đúng + 1 sai |
| **Gọi điện** | 📞 | Mô phỏng cuộc gọi 30 giây, AI gợi ý đáp án (có thể không chính xác) |
| **Hỏi khán giả** | 👥 | Hiển thị biểu đồ % bỏ phiếu, thiên hướng đúng nhưng không đảm bảo |
| **Đổi câu** | 🔄 | Thay toàn bộ câu hỏi hiện tại bằng câu mới cùng mức `difficulty` |

### State Machine cho 50:50

```
idle → confirmFiftyFifty=true → user confirms → isScanningFiftyFifty=true (animation)
→ hiddenOptions=[idx1, idx2] → isScanningFiftyFifty=false → lifelines.fiftyFifty=true
```

### State Machine cho Hỏi Khán Giả

```
idle → confirmAudience=true → user confirms → audienceState="loading" (3s)
→ audienceState="results" + audienceVotes=[...] → user closes → confirmAudience=false
→ lifelines.audience=true
```

### State Machine cho Gọi Điện

```
idle → confirmPhone=true → user confirms → phoneState="calling" (ring animation)
→ phoneState="answering" + phoneTimeLeft=30 (countdown) → typewriter message
→ user closes / timeout → phoneState=null → lifelines.phone=true
```

### State Machine cho Đổi Câu

```
idle → confirmSwap=true → user confirms → isSwapping=true (animation)
→ new question loaded (same difficulty) → isSwapping=false → lifelines.swap=true
```

---

## 5. Game State Machine

```
┌─────────┐     handleStartGame()     ┌──────────┐
│  rules  │ ──────────────────────────→│ playing  │
│  (Màn   │                           │          │
│  luật)  │                           │ introPhase: 1→2→3→4
└─────────┘                           │          │
                                      │ Trả lời  │
                                      │ câu hỏi  │
                                      │   ↕      │
                                      │ Lifeline │
                                      └────┬─────┘
                                           │
                              ┌────────────┼────────────┐
                              ↓            ↓            ↓
                         Đúng (Q<15)  Sai / Hết giờ  Đúng Q15
                              │            │            │
                              ↓            ↓            ↓
                       Next Question   ┌──────────┐  ┌──────────┐
                         (reset        │ finished │  │ finished │
                          state)       │ (score = │  │ (score = │
                                       │ milestone)│  │ 1000 🪙) │
                                       └──────────┘  └──────────┘
```

### Luồng trả lời 1 câu

```
1. introPhase = 4 → Timer bắt đầu đếm (30s)
2. MC nói lời mở đầu (4s rồi ẩn)
3. User chọn đáp án → selectedOption = idx, isAnswerRevealed = true
4. Nếu ĐÚNG:
   a. SFX correct + spotlight flash
   b. MC chúc mừng (2s)
   c. XP particles bay về badge (1.36s)
   d. answerStep = "explained" → hiện giải thích + timer 15s
   e. Nếu Q5/Q10: confetti + spotlight swing + checkpoint SFX
   f. Auto next hoặc user bấm "Tiếp tục"
5. Nếu SAI:
   a. SFX incorrect + spotlight wrong shake
   b. MC chia buồn (2s)
   c. Score rơi về milestone gần nhất
   d. Sau 2.5s: SFX clap end → chuyển sang "finished"
```

---

## 6. MC (Người Dẫn Chương Trình) — Message System

### Cấu trúc `MC_MESSAGES[questionIndex]`

```javascript
{
  start: string[],     // Pool tin nhắn khi hiện câu hỏi mới
  correct: string[],   // Pool tin nhắn khi trả lời đúng
  wrong: string[]      // Pool tin nhắn khi trả lời sai
}
```

> Mỗi câu hỏi (Q1-Q15) có bộ messages riêng biệt, phù hợp với mức độ và cảm xúc.

### `MC_MESSAGES_AFTER_FINISH[levelIndex]`

- Mảng 15 phần tử, mỗi phần tử là `string[]` (pool 3 tin nhắn).
- Hiện lên ở màn hình kết quả khi người chơi bị loại tại câu đó.

---

## 7. Visual Effects Schema

### Spotlight Beams

| Thuộc tính | Giá trị | Mô tả |
|-----------|---------|-------|
| `BEAMS` | Array(9) | 3 banks × 3 beams (left/center/right) |
| `baseAngle` | -25° → +25° | Góc mặc định |
| `orbitAmp` | 3-4° | Biên độ dao động idle |
| `period` | 6-9s | Chu kỳ dao động |
| `colorTop` | rgba | Màu gradient trên: vàng/xanh dương/tím/xanh lá |

### Effect Triggers

| Event | Flash | Swing | Wrong | Confetti |
|-------|-------|-------|-------|----------|
| Trả lời đúng | ✅ | ❌ | ❌ | ❌ |
| Qua mốc Q5/Q10 | ✅ | ✅ (3.2s) | ❌ | ✅ (5s) |
| Trả lời sai | ❌ | ❌ | ✅ (2.5s) | ❌ |
| Game start | ❌ | ✅ | ❌ | ❌ |

---

## 8. Kết Quả & Lưu Trữ

### Khi game kết thúc (`status: "finished"`)

```json
{
  "result": {
    "uid": "uid_abc",
    "finalLevel": 10,              // Câu cuối trả lời đúng (1-indexed)
    "coinsEarned": 250,            // Theo milestone
    "xpEarned": 55,                // XP tích lũy đến câu cuối đúng
    "lifelinesUsed": ["fiftyFifty", "audience"],
    "timeTotalSec": 185,           // Tổng thời gian chơi
    "isReplay": false              // true nếu chơi lại cùng bộ câu hỏi
  }
}
```

### Cập nhật `users/{uid}` trên Firebase

```javascript
// Sau mỗi trận
update(ref(db, `users/${uid}`), {
  global_score: currentGlobalScore + xpEarned,
  coins: currentCoins + coinsEarned         // Solo: cộng, P2P: ± bet
});

// Stats
update(ref(db, `users/${uid}/stats/solo`), {
  plays: increment(1),
  perfects: finalLevel === 15 ? increment(1) : increment(0),
  totalCorrect: increment(finalLevel),
  totalQuestions: increment(15)
});
```

---

## 9. Chơi Lại & Chơi Mới

| Hành động | Câu hỏi | XP | Coins |
|-----------|---------|-----|-------|
| **Chơi Lại** (Replay) | Cùng bộ 15 câu | **0 XP** | Coins theo milestone (giảm 50%) |
| **Chơi Mới** (New Game) | Random bộ mới | **Full XP** | **Full Coins** |

---

## 10. P2P Mode — Bổ Sung

Khi `mode: "p2p"`, Room mở rộng thêm:

```json
{
  "mode": "p2p",
  "settings": {
    "betAmount": 50              // Coins bet
  },
  "players": {
    "uid_abc": { /* ... */ },
    "uid_xyz": { /* ... */ }
  },
  "p2pResult": {
    "winner": "uid_abc",
    "loser": "uid_xyz",
    "winnerLevel": 12,
    "loserLevel": 8,
    "coinsTransferred": 50       // = betAmount
  }
}
```

### Xác định người thắng P2P

```
1. Ai trả lời đúng nhiều câu hơn → thắng
2. Nếu bằng nhau → ai dùng ít thời gian hơn → thắng
3. Hòa tuyệt đối → cả 2 giữ nguyên coins, cả 2 nhận XP
```

---

## 11. SFX Assets

| File | Sự kiện |
|------|---------|
| `point_up.wav` | UI interaction (intro) |
| `sfx_launch_game_altp.mp3` | Bắt đầu trận |
| `sfx_clap_short.mp3` | Trả lời đúng |
| `sfx_correct_answer.mp3` | Trả lời đúng (tone) |
| `sfx_checkpoint_altp.mp3` | Qua mốc an toàn |
| `sfx_incorrect_answer_altp.mp3` | Trả lời sai |
| `sfx_clap_end.mp3` | Kết thúc game (vỗ tay tiễn) |
| `sfx_firework_shot.wav` | Confetti |
