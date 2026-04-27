# ⚡ QYRO — Build. Compete. Dominate.

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.0-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

---

## 🧠 What is Qyro?

**Qyro** *(Build. Compete. Dominate.)* is a **full-stack, AI-powered competitive quiz platform** built for students, educators, and communities who want learning to feel less like a chore and more like a live sport.

At its core, Qyro answers a simple question: *What if studying felt as engaging as playing a multiplayer game?*

### The Problem It Solves

Traditional quiz tools are passive — you answer questions alone, get a score, and move on. There is no competition, no real-time tension, no reason to come back. Students disengage. Teachers struggle to measure who actually understands the material. College events run on clunky, error-prone Google Forms.

### What Qyro Does Differently

Qyro transforms quizzes into **live, competitive events**:

- A **student** can generate a quiz on any topic using AI in under 10 seconds, then challenge classmates to a real-time 1v1 battle — complete with countdown timers, ELO rating changes, and a live leaderboard.
- A **teacher** can upload a PDF of lecture notes, let the AI extract the key concepts into MCQs, and host a live classroom quiz where every student's answer appears on the screen in real time.
- A **college fest organiser** can spin up a 200-player live quiz room with a 6-digit PIN, anti-cheat enforcement, team scoring, and a projectable leaderboard — in minutes, for free.
- A **self-learner** can browse the marketplace, remix any public quiz, and track their performance over time through detailed analytics and an ELO-based global ranking.

---

## ✨ Key Features

### 🤖 AI Quiz Engine — *Tri-Provider Cascade*
Generate high-quality multiple-choice questions from any topic, text, PDF, or image. The engine runs on a **Groq → Gemini → OpenAI fallback chain** ensuring 99.9% availability even when a single provider hits a rate limit.

- **Topic-to-quiz** in under 10 seconds using Llama 3.3 70B (Groq)
- **PDF & document upload** — extract key concepts from lecture notes, textbooks, or research papers
- **Image-to-quiz** — photograph a whiteboard, diagram, or printed page and generate questions from it
- **Smart tagging** — automatically categorises quizzes by subject, difficulty, and estimated duration
- **Personalized generation** — questions adapt to the user's academic background (college, course, interest)

### ⚔️ Real-Time Multiplayer Arena
Live quiz battles powered by Socket.io with sub-100ms question sync across all connected players.

- **Quick Match** — instant ELO matchmaking; get paired with a real opponent in under 10 seconds, or fight an AI bot after 10 seconds if no one is available
- **Lobby rooms** — create a room with a PIN, set team sizes (1v1, 2v2, 4v4), and share the link
- **Live leaderboard** — scores update after every question, visible to all players in real time
- **Host Nexus** — the host dashboard shows a live heatmap of what each player answered, the answer distribution chart, and full control to pause, skip, or broadcast messages mid-match

### 🛡️ Anti-Cheat & Exam Mode
Built for high-stakes use — competitive exams, college fests, and institutional assessments.

- **Tab-switch detection** with configurable strike system
- **IP lock** — prevents multiple accounts from the same device joining the same room
- **Strict focus mode** — locks the browser to the quiz tab
- **Option randomisation** — shuffles answer order per player to prevent copying

### 🏆 ELO Ranking & Progression
Every ranked battle updates the player's **Global Rating** using a custom ELO algorithm. Performance is tracked across weekly, monthly, and all-time leaderboards.

- Global Rating, Win Rate, Best Streak, Accuracy — all tracked
- Rank tiers: Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster
- Detailed post-match analytics with per-question breakdown and answer review

### 🛒 Quiz Marketplace
A public library of quizzes created by the community.

- Browse, search, and filter by subject, difficulty, and rating
- **One-click remix** — fork any public quiz, edit it, and publish your version
- Ratings and reviews on every quiz

### 💬 Social & Community
- Friend system with real-time challenge invites
- **End-to-end encrypted messaging** between friends
- WhatsApp-style notification dot for unread messages
- Institution profiles — group students under a college or organisation

### 💳 Subscription & Monetisation
Tiered plans (Free → Pro → Elite → Institution) gated by:
- AI generation quota (50 free / 200 Pro / unlimited Elite)
- PDF uploads, concurrent room capacity, and advanced analytics
- **Razorpay Autopay** integration with ₹1 trial authentication

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15+ (App Router), Vanilla CSS, Framer Motion |
| **Backend** | Node.js, Express 5, Socket.io |
| **Database** | PostgreSQL (Neon serverless) via Prisma ORM |
| **AI Engine** | Groq (Llama 3.3 70B) → Google Gemini 2.0 Flash → OpenAI GPT-4o-mini |
| **Auth** | Passport.js — Google & Facebook OAuth2, JWT |
| **Payments** | Razorpay Autopay (subscription + ₹1 trial) |
| **Email** | Nodemailer (Gmail SMTP) |
| **Deployment** | Vercel (frontend) · Render (backend) · Neon (database) |

---

## 🌐 Live Demo

**[samarpan-quiz.vercel.app](https://samarpan-quiz.vercel.app/)**

> [!NOTE]
> Use a modern Chromium browser for the best real-time experience. The platform is optimised for desktop but fully responsive on mobile.

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL instance (or a free [Neon](https://neon.tech) database)
- API keys: Groq, Gemini (optional), Google OAuth

### 1. Clone
```bash
git clone https://github.com/infinity-me/SAMARPAN.git
cd SAMARPAN
```

### 2. Backend
```bash
cd Backend
npm install
```

Create `Backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/samarpan"
JWT_SECRET="your_jwt_secret"

GROQ_API_KEY="your_groq_key"
GEMINI_API_KEY="your_gemini_key"
OPENAI_API_KEY="your_openai_key"          # optional fallback

GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_CALLBACK_URL="http://localhost:5001/auth/google/callback"

SMTP_USER="your_gmail@gmail.com"
SMTP_PASS="your_gmail_app_password"

FRONTEND_URL="http://localhost:3000"
PORT=5001
```

```bash
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

---

## 📐 Architecture

```
┌─────────────────────────────────────┐
│           Next.js Frontend          │  ← Vercel
│  App Router · React Context · CSS   │
└──────────────┬──────────────────────┘
               │  REST + WebSocket
┌──────────────▼──────────────────────┐
│        Express + Socket.io          │  ← Render
│  Auth · Quiz API · Matchmaking      │
│  AI Engine (Groq→Gemini→OpenAI)     │
└──────────────┬──────────────────────┘
               │  Prisma ORM
┌──────────────▼──────────────────────┐
│         PostgreSQL (Neon)           │  ← Serverless DB
│  Users · Quizzes · Sessions · ELO  │
└─────────────────────────────────────┘
```

---

## 📜 License

ISC License — see [LICENSE](LICENSE).

---

*Built with ❤️ by **Aman Gupta** (infinity-me) and the Samarpan Team — Kanpur, India.*
