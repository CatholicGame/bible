# PROJECT RULES

## 1. UI/UX Principles
- **Aesthetic Excellence:** Use vibrant colors, glassmorphism, dynamic animations, and smooth gradients. The application must look stunning and premium.
- **Responsiveness & Full-Space Utilization (No-Scroll Policy):** 
  - On mobile, standard flow is acceptable.
  - On Tablet (md) and Desktop (lg) devices, **the UI must be designed to cover the entire viewport space optimally.** 
  - **Minimize Vertical Scrolling:** Design layouts that naturally fit into `h-screen` or `100vh` without forcing the user to scroll down to see primary content. Expand elements horizontally, use multi-column grids (like `grid-cols-4` on `lg`), flexible flex-boxes, and calculate heights dynamically to utilize the vast space of wide screens.
  - Break out of narrow mobile-first container width limits (i.e., replace `max-w-2xl` with `max-w-7xl` or `w-full px-8` for screens).

## 2. Tech Stack Requirements
- React 19 + Vite
- Tailwind CSS v4 (No inline styles if a Tailwind class exists)
- Framer Motion for micro-animations and transitions.
- Lucide React for consistent icons.

## 3. Communication & Terminology
- **Catholic Context:** Use thematic terminology appropriate for a Catholic application (e.g., "Hành trình Đức Tin", "Tông Đồ").
- Avoid overly generic terms if a thematic alternative exists, but keep it accessible to non-experts.

## 4. Code Structure
- **Global Progression System:** Must be applied across all games. Scores are accumulated globally.
- Features must be modular and separated into respective component directories (`/common`, `/games`, `/auth`, etc.).
