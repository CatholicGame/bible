# Ai Là Nhà Thần Học — Data Schema

> Game dạng "Ai Là Triệu Phú" với 15 câu hỏi trắc nghiệm Công giáo, thang phần thưởng leo dần, 3 mốc an toàn (Q5, Q10, Q15) và 4 quyền trợ giúp.

> **Cập nhật lần cuối:** 2026-03-23

---

## 0. File Statistics

| Metric | Value |
|--------|-------|
| **File** | `src/components/games/PinnacleGame.jsx` |
| **Lines** | ~2,540 |
| **Sub-components** | `SpotlightEffect`, `CartoonBox`, `LifelineButton`, `LobbyScreen`, `PinnacleGame` |
| **External components** | `PinnacleLeaderboard` (riêng file) |
| **State manager** | Zustand (`playfabStore.js`, `userStore.js`) |
| **Backend** | PlayFab (auth, leaderboard, statistics, user data) |

### Imports

```javascript
// React
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Icons (lucide-react)
import { Trophy, ArrowLeft, ChevronLeft, CheckCircle2, XCircle, Play, Phone,
         Users, Shield, RefreshCcw, Flag, Star, UserCircle2 } from 'lucide-react';

// Stores
import { usePlayFabStore } from '../../store/playfabStore';
import { useUserStore } from '../../store/userStore';
import { getRankByScore, getRankLevel } from '../../utils/ranks';

// Assets
import pinnacleBackground from '../../assets/pinnacle/altp_bg_02.png';
import mcAvatar from '../../assets/pinnacle/MC.png';
import resultBanner from '../../assets/common/result_banner.png';
import iconCoin from '../../assets/common/coin.png';
import iconTrophy from '../../assets/common/trophy.png';
```

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
  gameState: "lobby" | "rules" | "playing" | "finished" | "leaderboard",
  leaderboardSource: "lobby" | "finished",  // where to return from leaderboard
  introPhase: 0-4,             // Animation phases: 0→start, 1→ladder, 2→lifelines, 3→MC, 4→question
  currentQuestionIndex: 0-14,  // 0-indexed
  score: 0,                    // Coins earned (hiện tại)
  xpScore: 0,                  // XP earned (hiện tại)
  selectedOption: null | 0-3,
  isAnswerRevealed: false,
  answerStep: "thinking" | "explained",
  timeLeft: 30,                // Countdown timer (giây)
  explanationTimeLeft: 15,     // Giây đếm ngược ở bước giải thích
  isSkipped: false,            // true khi user skip đọc giải thích

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
  gameConfettiKey: 0,
  xpParticles: [],

  // MC (Người dẫn chương trình)
  mcMessage: "",
  showMcBubble: false,
  endMessage: null,
  showEndMessage: true,

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
                              onPlay()         handleStartGame()
┌─────────┐              ┌─────────┐              ┌──────────┐
│  lobby  │─────────────→│  rules  │─────────────→│ playing  │
│  (Chọn  │  onShow      │  (Màn   │              │          │
│  mode)  │  Leaderboard │  luật)  │              │ introPhase: 1→2→3→4
└────┬────┘      │       └─────────┘              │          │
     │           ↓                                │ Trả lời  │
     │    ┌─────────────┐                         │ câu hỏi  │
     │    │ leaderboard │←─── onShowLeaderboard ──│   ↕      │
     │    │ (BXH)       │     (from finished)     │ Lifeline │
     │    └──────┬──────┘                         └────┬─────┘
     │           │ onBack                              │
     │           ↓                        ┌────────────┼────────────┐
     │     leaderboardSource              ↓            ↓            ↓
     │     ("lobby"/"finished")      Đúng (Q<15)  Sai / Hết giờ  Đúng Q15
     │                                    │            │            │
     │                                    ↓            ↓            ↓
     │                             Next Question   ┌──────────┐  ┌──────────┐
     │                               (reset        │ finished │  │ finished │
     │                                state)       │ (score = │  │ (score = │
     └──── onLeaveGame ──→ exit                    │ milestone)│  │ 1000 🪙) │
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

### Composite Score (PlayFab Leaderboard)

Điểm xếp hạng được tính theo công thức **composite** — chỉ level cao mới có điểm đáng kể:

```javascript
function calcPinnaclePoints(levelIndex, isQ15Complete) {
  if (isQ15Complete) return 1_000_000;  // 15/15 perfect
  if (levelIndex >= 13) return 1_000;   // đến Q14 hoặc Q15 nhưng sai
  if (levelIndex >= 12) return 1;       // đến Q13
  return 0;                             // dưới Q13 → 0 điểm xếp hạng
}
```

| Kết quả | Composite Points |
|---------|------------------|
| Hoàn thành Q15 (15/15) | **1,000,000** |
| Đến Q14 hoặc Q15 (sai) | **1,000** |
| Đến Q13 | **1** |
| Dưới Q13 | **0** |

### PlayFab Statistics (4 bảng xếp hạng)

```javascript
const PINNACLE_STATS = {
  daily:   'PinnacleScore_Daily',
  weekly:  'PinnacleScore_Weekly',
  monthly: 'PinnacleScore_Monthly',
  allTime: 'PinnacleScore_AllTime',
};
```

Sau mỗi trận, gọi `savePinnacleCompositeScore(levelIndex, isQ15Complete)` → cập nhật cả 4 statistics cùng lúc:

```javascript
await updateStatisticsV2([
  { Name: PINNACLE_STATS.daily,   Value: points },
  { Name: PINNACLE_STATS.weekly,  Value: points },
  { Name: PINNACLE_STATS.monthly, Value: points },
  { Name: PINNACLE_STATS.allTime, Value: points },
]);
```

### Leaderboard Tabs

| Tab | Stat Name | Reset |
|-----|-----------|-------|
| Hôm nay | `PinnacleScore_Daily` | Mỗi ngày |
| Tuần | `PinnacleScore_Weekly` | Mỗi tuần |
| Tháng | `PinnacleScore_Monthly` | Mỗi tháng |
| Mọi thời đại | `PinnacleScore_AllTime` | Không reset |

---

## 9. Lobby Screen

`LobbyScreen` là màn hình đầu tiên khi mở game, hiển thị trước khi vào luật chơi.

### Props

| Prop | Type | Mô tả |
|------|------|--------|
| `onPlay` | `() => void` | Chuyển sang `rules` |
| `onShowLeaderboard` | `() => void` | Chuyển sang `leaderboard` |
| `onLeaveGame` | `() => void` | Thoát về trang chính |
| `nickname` | `string` | Tên người chơi |
| `giaoxu` | `string` | Giáo xứ (hiển thị nếu có) |
| `tinhthanh` | `string` | Tỉnh thành |

### Nội dung hiển thị

1. **Game title card** — tên game + mô tả
2. **2 CTA buttons** — "Chơi ngay" (vàng) + "Xếp hạng" (tím)
3. **Player info card** — avatar, nickname, rank, XP, số câu đã học, giáo xứ
4. **Back button** — "Về trang chính" (rounded pill button + ChevronLeft icon)

---

## 10. Chơi Lại (handlePlayAgain)

- Gọi `loadNewGame()` để rút 15 câu mới
- Reset toàn bộ state: score, xpScore, lifelines, timer, MC, particles...
- Tự động enter fullscreen (nếu trình duyệt cho phép)
- Chuyển `gameState` → `playing` + `introPhase` → `1`

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

## 12. SFX & Image Assets

### SFX

| File | Import Name | Sự kiện |
|------|-------------|--------|
| `point_up.wav` | `pointUpSfx` | UI interaction (intro phases) |
| `sfx_launch_game_altp.mp3` | `sfxLaunch` | Bắt đầu trận + spotlight swing |
| `sfx_clap_short.mp3` | `sfxClapShort` | Trả lời đúng (vỗ tay) |
| `sfx_correct_answer.mp3` | `sfxCorrect` | Trả lời đúng (tone) |
| `sfx_checkpoint_altp.mp3` | `sfxCheckpoint` | Qua mốc an toàn Q5/Q10 |
| `sfx_incorrect_answer_altp.mp3` | `sfxIncorrect` | Trả lời sai |
| `sfx_clap_end.mp3` | `sfxClapEnd` | Kết thúc game (vỗ tay tiễn + delay chuyển cảnh) |
| `sfx_firework_shot.wav` | `fireworkSfx` | Confetti burst |

### Images

| File | Import Name | Dùng ở |
|------|-------------|--------|
| `altp_bg_02.png` | `pinnacleBackground` | Background toàn game |
| `MC.png` | `mcAvatar` | Avatar MC (người dẫn chương trình) |
| `result_banner.png` | `resultBanner` | Banner màn kết quả |
| `coin.png` | `iconCoin` | Icon coin ở kết quả |
| `trophy.png` | `iconTrophy` | Icon trophy ở kết quả |
