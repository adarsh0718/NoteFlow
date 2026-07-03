# 🎵 SraAdaLY — Music Connects Us

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Gemini](https://img.shields.io/badge/Google%20Gemini%20API-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white)
![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-orange?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)

**An interactive AI-powered Music Discovery, Taste Profiling, and Collaborative Sharing Platform.**  
Explore custom-synthesized backing tracks, get personalized music suggestions via Gemini, and share music with friends.

### 🌐 [▶ Open Live Music App](https://sraadaly-966730172656.asia-southeast1.run.app/) &nbsp;&nbsp; [📂 View Code](https://github.com/adarsh0718/SraAdaLY)

</div>

---

## 🎬 Overview

**SraAdaLY** is a modern music exploration web application designed to connect users through interactive soundscapes and AI-driven recommendations. The name represents a space where music meets intelligence and collaboration.

The platform offers a fully integrated, client-side dynamic audio environment where users can play interactive quiz games to identify their musical archetypes, consult an **AI Music Style Advisor**, listen to real-time generated backing tracks, and collaborate by sharing playlists.

---

## 🚀 Key Features

### 🧠 1. SraAdaLY Taste AI (Google Gemini Integration)
*   **AI Music Advisor**: Interfaces with the `gemini-1.5-flash` model to analyze your profile and music habits.
*   **Personalized Roadmaps**: Generates custom, interactive music discovery roadmaps outlining new genres, instruments, and artists tailored to your unique taste.
*   **Contextual Chat**: Ask the SraAdaLY AI advisor specific musical inquiries and get expert suggestions.

### 🎮 2. Interactive Music Taste Quiz & Profiler
*   A custom questionnaire designed to gauge user engagement (e.g., passive background listening vs. active lyric analysis).
*   Dynamically profiles users into distinct sonic archetypes (e.g., *"Sonic Explorer"*, *"Ambient Dreamer"*).
*   Visualizes your results in a responsive profile dashboard.

### 🎹 3. Browser-Side Audio Synthesizer (Lyria 3 Engine)
*   **Lyria 3 Synth Player**: Leverages the browser's native Web Audio API oscillators to generate real-time synthesized backing tracks and retro computer melodies.
*   **Live Player Controls**: Custom player with play, pause, progress visualizer, and volume slider actions.

### 🎤 4. Synchronized Sing-Along Lyrics
*   Displays real-time interactive lyrics for sample tracks.
*   Enables users to toggle sing-along modes to dive deeper into the structure and nuances of each song.

### ✉️ 5. Collaborative Sharing Hub
*   Includes built-in user sharing where you can send custom playlists and songs to friends via email.
*   Features a **Shared with You / Shared by You** log panel to track musical interactions and connect with other users.
*   Quickly copy shareable playlist URLs to your clipboard.

---

## 🛠️ Tech Stack & Implementation Details

*   **Frontend Library**: **React** (utilizing hooks like `useState`, `useEffect`, `useContext`, and custom references for audio playbacks).
*   **Language**: **TypeScript** (ensuring type safety for complex audio objects and sharing structures).
*   **Build Tool**: **Vite** (for rapid local compilation and asset bundles).
*   **Audio Architecture**: Native **Web Audio API** oscillators for real-time sound synthesis, mapping, and playback states.
*   **AI Integration**: Direct HTTP endpoints targeting the **Google Gemini API** (`v1beta` endpoint) with system instructions tailored for musical advisory roles.
*   **Styling System**: Custom **Vanilla CSS3** with dark-mode variables, backdrop-filter blurs, interactive neon borders, and dynamic slide-in CSS keyframe animations.

---

## 📂 File Architecture (Vite Build)

```
SraAdaLY/
│
├── public/                  # Static assets and logo
│   └── sraadaly_logo.jpg
│
├── src/                     # React application source
│   ├── components/          # Dashboard panels, Quiz, AI Advisor, Audio Player
│   ├── hooks/               # Custom Audio and Web API hooks
│   ├── styles/              # CSS layouts and responsiveness configurations
│   ├── App.tsx              # Central workspace orchestrator
│   └── main.tsx             # DOM rendering bootstrapper
│
├── package.json             # NPM dependencies (React, Lucide-React, etc.)
├── vite.config.ts           # Vite configurations
├── tsconfig.json            # TypeScript specifications
└── README.md                # Project documentation
```

---

## 🛠️ Local Installation & Launch

### 1. Clone the repository
```bash
git clone https://github.com/adarsh0718/SraAdaLY.git
cd SraAdaLY
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```
Open the local URL displayed in the terminal (usually `http://localhost:5173`) in your web browser!

---

## 👨‍💻 Author

**Adarsh Peddada**  
Electronics and Computer Engineering Student  
Passionate about Machine Learning, Data Analytics & Web Development.

[![GitHub](https://img.shields.io/badge/GitHub-adarsh0718-181717?style=flat-square&logo=github)](https://github.com/adarsh0718)
