# Catholic Quiz - Global Architecture

## Tech Stack Overview
- **UI Framework:** React 19 (Vite + JSX)
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **State Management:** Zustand (Global State)
- **Routing:** React Router v7
- **Database (Live Game logic):** Firebase (Realtime Database, Anonymous Auth, Cloud Functions)
- **Repository (Question Banks):** Google Sheets -> SheetDB API

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
 ├── /config           # Firebase config, SheetDB endpoints
 ├── /hooks            # Custom hooks:
 │    ├── useRoom.js         # Tạo/join/rời phòng
 │    ├── useGameSync.js     # Sync progress P2P real-time
 │    └── usePresence.js     # Online/offline detection
 ├── /store            # Zustand stores:
 │    ├── gameStore.js       # Game state (progress, status)
 │    ├── roomStore.js       # Room state (roomId, role, opponent)
 │    └── userStore.js       # User profile, global_score
 ├── /utils            # Score calculators, xpCalculator.js, sound players
 ├── App.jsx           # Main routing entry point
 └── index.css         # Tailwind directives and generic globals
/docs
 ├── PROJECT_RULES.md
 ├── architecture.md          # (file này)
 ├── database_schema.md       # Firebase DB schema chi tiết
 └── /multi_frameworks        # 🌟 Cơ chế multiplayer & game templates
      ├── multiplayer_framework.md  # Cơ chế Solo/2P, hooks, security rules
      ├── screen_flow.md            # Luồng màn hình từng mode
      ├── game_template.md          # Template tái sử dụng cho game mới
      └── matchmaking_and_bot.md    # Auto matchmaking & Bot system
```

## Security Rules
- **Authentication:** All users (Hosts and Players) are authenticated anonymously (`signInAnonymously`) upon app load.
- **Firebase Security Rules:**
  - `matchmaking`: Users can only read/write their own UID node.
  - `rooms`: 
    - Players can *read* room data containing their PIN.
    - Players can *write* to `rooms/{pin}/players/{uid}` and `rooms/{pin}/currentAnswers/{uid}` ONLY if they are authenticated and providing valid data formats.
    - Hosts (creator of the room) have full read/write access to their `rooms/{pin}` node.
    - `users`: Users can only read/write their own `global_score` and profile.

## Global Progression System (Hệ thống Xếp Hạng Chung)
- Bất kể người chơi tham gia Mini-game nào (Trắc nghiệm, Đỉnh Cao Hiểu Biết, hay Sắp Xếp) và chơi ở chế độ nào (Solo/P2P), điểm số (XP) kiếm được sau mỗi ván đều được cộng dồn vào `users/{uid}/global_score` trên Firebase.
- Trên Frontend, `userStore.js` (Zustand) sẽ lắng nghe điểm số này và tự động ánh xạ thành `Rank` (Danh hiệu) (VD: Tân Tòng -> Chiên Con -> Môn Đệ -> Tông Đồ) để hiển thị ở góc màn hình.
