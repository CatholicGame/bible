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
 │    ├── /lobby       # Public Lobby UI & Matchmaking Status
 │    ├── /host        # Host views: Dashboard, PIN projector
 │    ├── /player      # Player views: PIN Entry
 │    └── /games       # 🌟 Mini-Game Modules (The Platform Engine)
 │         ├── /quiz          # 4-option Quiz Game Logic & UI
 │         ├── /true_false    # True/False Binary Game
 │         ├── /sorting       # Chronological Sorting Game
 │         └── GameEngine.jsx # Router that lazy-loads the correct game based on room.gameType
 ├── /config           # Firebase config, SheetDB endpoints
 ├── /hooks            # Custom React hooks (useFirebaseSync, useMatchmaking)
 ├── /store            # Zustand global stores (gameStore.js, userStore.js)
 ├── /utils            # Score calculators, time formatters, sound players
 ├── App.jsx           # Main routing entry point
 └── index.css         # Tailwind directives and generic globals
/docs
 ├── PROJECT_RULES.md
 ├── database_schema.md
 └── architecture.md
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
