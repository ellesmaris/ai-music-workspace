# 🎵 AI Music Workspace

An AI-powered music production environment built with Next.js, Tone.js and OpenAI.

This project combines a lightweight DAW (digital audio workstation) with AI-assisted music generation, allowing users to create, edit and structure music directly in the browser.

---

## ✨ Features

### 🎹 Piano Roll Editor
- Grid-based note editor
- Click-to-place / remove notes
- 1/16 note quantization
- Velocity + duration control

### 🎼 Pattern System
- Create reusable musical patterns
- Switch between patterns instantly
- Loop individual patterns or play full arrangements

### 🤖 AI Music Generation
- Generate melodies, chords, and drums using OpenAI
- Outputs structured into DAW-compatible patterns
- One-click "Generate Idea" workflow

### 🎧 Audio Engine
- Built with Tone.js
- Real-time playback
- Tempo and transport controls

### 💾 Project System
- Save and load sessions locally
- Multiple project support (browser storage)

### 📤 Export (MVP)
- MIDI export support
- Arrangement-based output

---

## 🛠 Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Tone.js
- OpenAI API
- LocalStorage (project persistence)

---

## 🚀 Getting Started

### 1. Install dependencies
npm install

### 2. Run development server
npm run dev

### 3. Open app
http://localhost:3000

---

## 🧠 Concept

This project is designed as a hybrid between:

- a DAW (like Ableton Lite)
- a code-driven music editor
- an AI music assistant

Instead of traditional music production tools, users can:
- generate ideas with AI
- structure music in patterns
- edit notes visually in a piano roll
- export compositions

---

## 📦 Project Structure

components/ → UI (Piano roll, patterns, workspace)
hooks/ → Tone.js playback logic
lib/ → Music logic, audio engine, utilities
app/api/ → AI + generation endpoints

---

## 🔮 Future Ideas

- Drag-and-drop arrangement timeline
- Audio waveform rendering
- Real-time collaboration
- Plugin-style synth instruments
- AI “style transfer” between songs

---

## ⚠️ Status

This project is currently in MVP stage and actively evolving.

Core music engine is functional, but UI/UX and production features are still being refined.

---

## 📄 License

MIT

