# Catholic Quiz - Global Architecture

## Tech Stack Overview
- **UI Framework:** React 19 (Vite + JSX)
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **State Management:** Zustand (Global State)
- **Routing:** React Router v7
- **Backend (ALL Data):** PlayFab (Title ID: 15C4E5) — Auth, Player Data, Stats, Coins, Leaderboard, Room history
- **Realtime Sync (Ephemeral):** Firebase Realtime DB — CHỈ dùng cho live P2P sync + Analytics
- **Question Banks:** 15 Level JSON files (1500 câu, bundled trong app)

> ⚡ **Nguyên tắc:** PlayFab = lưu TẤT CẢ data. Firebase = chỉ realtime sync + analytics.

## Directory Structure
```text
/src
 ├── /assets           # Images, SVGs, audio effects
 ├── /components
 │    ├── /common      # Buttons, Inputs, Modal, Spinners
 │    ├── /menu        # CreateRoom, JoinRoom, WaitingRoom screens
 │    └── /games       # 🌟 Mini-Game Modules (The Platform Engine)
 │         ├── /quiz          # Quiz: QuizGame.jsx, QuizSolo.jsx, QuizP2P.jsx
 │         ├── /crossword     # Crossword: CrosswordGame.jsx, ...Solo, ...P2P
 │         ├── /sorting       # Sorting: SortingGame.jsx, ...Solo, ...P2P
 │         └── GameEngine.jsx # Router lazy-load game theo (gameType, mode)
 ├── /config           # Firebase config, PlayFab config
 ├── /hooks            # Custom hooks:
 │    ├── useRoom.js         # Tạo/join/rời phòng
 │    ├── useGameSync.js     # Sync progress P2P real-time
 │    └── usePresence.js     # Online/offline detection
 ├── /store            # Zustand stores:
 │    ├── gameStore.js       # Game state (progress, status)
 │    ├── roomStore.js       # Room state (roomId, role, opponent)
 │    ├── userStore.js       # User profile, global_score
 │    └── playfabStore.js    # PlayFab auth + player data + answered questions
 ├── /utils            # Score calculators, questionManager.js, sound players
 ├── App.jsx           # Main routing entry point
 └── index.css         # Tailwind directives and generic globals
/docs
 ├── PROJECT_RULES.md
 ├── architecture.md          # (file này)
 ├── playfab_integration.md   # 🌟 PlayFab schema + migration plan
 ├── database_schema.md       # Firebase DB schema (realtime ephemeral only)
 └── /multi_frameworks        # Cơ chế multiplayer & game templates
      ├── multiplayer_framework.md
      ├── screen_flow.md
      ├── game_template.md
      └── matchmaking_and_bot.md
```

## Security Rules
- **Authentication:** PlayFab Custom ID (guest), Email/Password, Google Sign-In. Firebase Anonymous Auth chỉ dùng để xác thực realtime rooms.
- **Firebase Security Rules** (chỉ áp dụng cho ephemeral realtime data):
  - `rooms`: Live P2P game state, answers, matchmaking → xóa sau khi game kết thúc.
  - Không lưu user data lâu dài trên Firebase.

## Global Progression System (Hệ thống Xếp Hạng Chung)
- XP từ tất cả Mini-game (Solo/P2P) được lưu vào **PlayFab Statistics** (`GlobalXP`).
- Rank được tính từ XP trên `playfabStore.js` (Zustand) → hiển thị trên UI.
- Leaderboard xếp hạng toàn server qua **PlayFab Leaderboards**.
- Chi tiết: xem `playfab_integration.md`
