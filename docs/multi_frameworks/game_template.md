# Game Component Template — Solo & 2-Player

> Template tái sử dụng để thêm mini-game mới vào platform.
> Copy folder này, đổi tên, implement logic game cụ thể.

---

## 1. Cấu trúc Folder

```
/src/components/games/{game_name}/
    ├── index.js                  # Re-export entry point
    ├── {GameName}Game.jsx        # 🌟 Core game logic & UI (mode-agnostic)
    ├── {GameName}Solo.jsx        # Solo wrapper — tự tạo room, tự cleanup
    ├── {GameName}P2P.jsx         # P2P wrapper — dùng useGameSync
    └── {GameName}Result.jsx      # Màn hình kết quả (shared cho cả 2 mode)
```

---

## 2. `{GameName}Game.jsx` — Core Game (Template)

```jsx
/**
 * Core game component — không biết về Solo hay P2P.
 * Nhận props từ wrapper, emit events ra ngoài.
 */
import { useState, useCallback } from 'react'

export default function {GameName}Game({
  // Dữ liệu game
  questions,        // Array câu hỏi/nội dung từ SheetDB

  // Callbacks — wrapper sẽ implement
  onProgressUpdate, // (progressData) => void — gọi mỗi khi progress thay đổi
  onFinish,         // (resultData) => void — gọi khi người chơi xong

  // UI tùy chọn (chỉ dùng trong P2P mode)
  opponentProgress, // null (solo) hoặc { score, completedItems } (P2P)
  myProfile,        // { nickname, uid }
  opponentProfile,  // null (solo) hoặc { nickname, uid } (P2P)
}) {
  const [myScore, setMyScore] = useState(0)
  const [completedItems, setCompletedItems] = useState([])

  // Gọi khi người chơi hoàn thành 1 item
  const handleItemComplete = useCallback((itemId, pointsEarned) => {
    const newScore = myScore + pointsEarned
    const newCompleted = [...completedItems, itemId]

    setMyScore(newScore)
    setCompletedItems(newCompleted)

    // Đồng bộ lên Firebase (wrapper xử lý)
    onProgressUpdate({
      score: newScore,
      completedItems: newCompleted,
      lastUpdated: Date.now(),
    })

    // Kiểm tra xong hết chưa
    if (newCompleted.length >= questions.length) {
      onFinish({ score: newScore, completedItems: newCompleted })
    }
  }, [myScore, completedItems, questions, onProgressUpdate, onFinish])

  return (
    <div className="game-container">
      {/* Opponent sidebar — chỉ hiện khi có opponentProgress */}
      {opponentProgress && (
        <OpponentSidebar
          myScore={myScore}
          myProfile={myProfile}
          opponentScore={opponentProgress.score}
          opponentProfile={opponentProfile}
        />
      )}

      {/* Main game content */}
      <div className="game-board">
        {/* TODO: Implement game-specific UI */}
      </div>
    </div>
  )
}
```

---

## 3. `{GameName}Solo.jsx` — Solo Wrapper (Template)

```jsx
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ref, set, update, remove } from 'firebase/database'
import { db } from '@/config/firebase'
import { useUserStore } from '@/store/userStore'
import {GameName}Game from './{GameName}Game'
import {GameName}Result from './{GameName}Result'
import { useState } from 'react'

export default function {GameName}Solo({ questions }) {
  const navigate = useNavigate()
  const { uid, nickname } = useUserStore()
  const roomId = useRef(`solo_${uid}_${Date.now()}`)
  const [result, setResult] = useState(null)

  // Tạo solo room khi mount
  useEffect(() => {
    set(ref(db, `rooms/${roomId.current}`), {
      gameType: '{game_name}',
      mode: 'solo',
      hostUid: uid,
      status: 'playing',
      createdAt: Date.now(),
    })

    // Cleanup khi unmount
    return () => {
      // Xóa sau 5 phút (hoặc dùng Cloud Function TTL)
      setTimeout(() => remove(ref(db, `rooms/${roomId.current}`)), 5 * 60 * 1000)
    }
  }, [uid])

  const handleProgressUpdate = (progressData) => {
    update(ref(db, `rooms/${roomId.current}/progress/${uid}`), progressData)
  }

  const handleFinish = async (finalProgress) => {
    const xpEarned = calculateXP(finalProgress.score, 'solo')

    // Ghi result
    await update(ref(db, `rooms/${roomId.current}`), {
      status: 'finished',
      result: { finalScores: { [uid]: finalProgress.score }, finishedAt: Date.now() }
    })

    // Cộng XP toàn cục
    await update(ref(db, `users/${uid}`), {
      global_score: increment(xpEarned)  // Firebase increment
    })

    setResult({ ...finalProgress, xpEarned, mode: 'solo' })
  }

  if (result) return <{GameName}Result result={result} mode="solo" />

  return (
    <{GameName}Game
      questions={questions}
      onProgressUpdate={handleProgressUpdate}
      onFinish={handleFinish}
      opponentProgress={null}
      myProfile={{ uid, nickname }}
      opponentProfile={null}
    />
  )
}
```

---

## 4. `{GameName}P2P.jsx` — 2-Player Wrapper (Template)

```jsx
import { useEffect, useState } from 'react'
import { ref, update, onValue, onDisconnect } from 'firebase/database'
import { db } from '@/config/firebase'
import { useUserStore } from '@/store/userStore'
import { useRoomStore } from '@/store/roomStore'
import {GameName}Game from './{GameName}Game'
import {GameName}Result from './{GameName}Result'

export default function {GameName}P2P({ questions }) {
  const { uid, nickname } = useUserStore()
  const { roomId, myRole } = useRoomStore()
  const [opponentProgress, setOpponentProgress] = useState(null)
  const [opponentProfile, setOpponentProfile] = useState(null)
  const [result, setResult] = useState(null)

  // Xác định uid đối thủ
  const opponentUid = /* lấy từ roomData */ null

  // Lắng nghe progress đối thủ
  useEffect(() => {
    if (!opponentUid) return
    const progressRef = ref(db, `rooms/${roomId}/progress/${opponentUid}`)
    return onValue(progressRef, (snap) => setOpponentProgress(snap.val()))
  }, [roomId, opponentUid])

  // Presence — auto-set offline khi disconnect
  useEffect(() => {
    const presenceRef = ref(db, `rooms/${roomId}/players/${uid}/isOnline`)
    update(presenceRef.parent, { isOnline: true })
    onDisconnect(presenceRef).set(false)
  }, [roomId, uid])

  const handleProgressUpdate = (progressData) => {
    update(ref(db, `rooms/${roomId}/progress/${uid}`), progressData)
  }

  const handleFinish = async (finalProgress) => {
    // Chỉ Host ghi result để tránh conflict
    if (myRole === 'host') {
      await update(ref(db, `rooms/${roomId}`), {
        status: 'finished',
        result: {
          // so sánh điểm để xác định winner
          winnerUid: finalProgress.score >= (opponentProgress?.score ?? 0) ? uid : opponentUid,
          finalScores: {
            [uid]: finalProgress.score,
            [opponentUid]: opponentProgress?.score ?? 0,
          },
          finishedAt: Date.now(),
        }
      })
    }
    setResult({ ...finalProgress, myRole })
  }

  if (result) return <{GameName}Result result={result} mode="p2p" opponentProgress={opponentProgress} />

  return (
    <{GameName}Game
      questions={questions}
      onProgressUpdate={handleProgressUpdate}
      onFinish={handleFinish}
      opponentProgress={opponentProgress}
      myProfile={{ uid, nickname }}
      opponentProfile={opponentProfile}
    />
  )
}
```

---

## 5. Progress Schema — Định nghĩa cho từng game

Mỗi game cần định nghĩa rõ `completedItems` nghĩa là gì:

| Game | `completedItems` | `score` |
|---|---|---|
| **Crossword** | `["1-across", "3-down", ...]` — ID của các từ đã điền đúng | 1 điểm/từ |
| **Quiz** | `["q1", "q5", "q8", ...]` — ID câu hỏi đã trả lời đúng | Điểm = đúng × hệ số thời gian |
| **Sorting** | `["round1", "round2", ...]` — ID vòng đã sắp xếp đúng | 1 điểm/vòng |

---

## 6. XP Calculation

```js
// /src/utils/xpCalculator.js
export function calculateXP(score, mode, isWinner = false) {
  const BASE_XP_PER_POINT = 10
  const SOLO_MULTIPLIER = 1.0
  const P2P_MULTIPLIER = 1.5
  const WIN_BONUS = 50

  const multiplier = mode === 'p2p' ? P2P_MULTIPLIER : SOLO_MULTIPLIER
  const winBonus = (mode === 'p2p' && isWinner) ? WIN_BONUS : 0

  return Math.floor(score * BASE_XP_PER_POINT * multiplier) + winBonus
}
```

---

## 7. Thêm game mới vào GameEngine Router

```jsx
// /src/components/games/GameEngine.jsx
import { lazy } from 'react'

const GAME_MAP = {
  quiz:      { Solo: lazy(() => import('./quiz/QuizSolo')),      P2P: lazy(() => import('./quiz/QuizP2P')) },
  crossword: { Solo: lazy(() => import('./crossword/CrosswordSolo')), P2P: lazy(() => import('./crossword/CrosswordP2P')) },
  // ✅ Thêm game mới vào đây
  sorting:   { Solo: lazy(() => import('./sorting/SortingSolo')),   P2P: lazy(() => import('./sorting/SortingP2P')) },
}

export default function GameEngine({ gameType, mode }) {
  const GameComponent = GAME_MAP[gameType]?.[mode === 'p2p' ? 'P2P' : 'Solo']
  if (!GameComponent) return <div>Game không tồn tại</div>
  return (
    <Suspense fallback={<GameLoadingSpinner />}>
      <GameComponent />
    </Suspense>
  )
}
```
