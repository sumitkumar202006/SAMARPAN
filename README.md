# 🌌 SAMARPAN: The AI-Powered Multiplayer Quiz Arena

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Express.js](https://img.shields.io/badge/Express.js-5.0-lightgrey?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black?style=for-the-badge&logo=socket.io)](https://socket.io/)

**SAMARPAN** is a high-fidelity, real-time quiz and tournament platform designed for competitive learning and community engagement. Leveraging cutting-edge AI and WebSocket technology, it transforms traditional quizzes into high-stakes multiplayer battles.

---

## 🌐 Live Experience
Experience the platform live: **[Samarpan Live Demo](https://samarpan-quiz.vercel.app/)**

> [!NOTE]
> The project is optimized for modern browsers. For the best experience, including real-time sync, use the live deployment.

---

## ✨ Core Features

### 🤖 AI Quiz Engine
- **Instant Generation**: Generate high-quality MCQs from any topic or raw text using Groq & GPT models.
- **PDF-to-Quiz**: Upload documents (PDFs) and let the AI extract key concepts into a playable challenge.
- **Adaptive Difficulty**: AI dynamically adjusts question complexity based on initial performance metrics.

### ⚔️ Real-time Multiplayer Arena (The Battleground)
- **Competitive Modes**: Support for **1v1**, **2v2**, and massive **4v4** team-based battles.
- **Live Lobby System**: Dynamic slot management with real-time player presence and team balancing.
- **Synchronized Gameplay**: Zero-latency question delivery and lightning-fast leaderboard updates via Socket.io.

### 🏆 Growth & Social Systems
- **Elo-based Global Rankings**: A custom-built **Rating Engine** calculates skill levels after every match.
- **XP & Level Progression**: Earn XP through participation and climb the global leaderboards.
- **E2EE Social Messaging**: Add friends, send encrypted messages, and challenge them to instant duels.
- **Detailed Analytics**: Post-match breakdown with accuracy, speed, and performance heatmaps.

### 🛡️ Admin & Host Command Center
- **Tournament Control**: Dedicated dashboard for hosts to manage sessions, monitor participants, and control match flow.
- **Advanced User Management**: Role-based access control for platform moderation and quiz curation.

---

## 🛠️ Tech Stack

### Frontend (Next Layer)
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **State & Real-time**: [Socket.io-client](https://socket.io/), React Context API
- **Analytics**: [Recharts](https://recharts.org/)

### Backend (The Core)
- **Runtime**: [Node.js](https://nodejs.org/) & [Express 5](https://expressjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Real-time**: [Socket.io](https://socket.io/) server
- **Authentication**: [Passport.js](https://www.passportjs.org/) (Google & Facebook OIDC)
- **AI Integration**: Groq SDK & OpenAI API

---

## 🚀 Installation & Local Setup

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL instance
- API Keys for AI features (Groq/OpenAI)

### 2. Clone the Repository
```bash
git clone https://github.com/infinity-me/SAMARPAN.git
cd SAMARPAN
```

### 3. Backend Setup
```bash
cd Backend
npm install
```
Create a `.env` file in the `Backend` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/samarpan"
JWT_SECRET="your_secret"
GROQ_API_KEY="your_key"
OPENAI_API_KEY="your_key"
GOOGLE_CLIENT_ID="your_id"
GOOGLE_CLIENT_SECRET="your_secret"
PORT=5000
```
Generate Prisma client and run:
```bash
npx prisma generate
npm run dev
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```
Start the development server:
```bash
npm run dev
```

---

## 📐 Architecture Overview

SAMARPAN follows a decoupled **Client-Server** architecture:

1.  **Frontend**: A responsive SPA built with Next.js, handling complex UI states and real-time socket connections.
2.  **API Layer**: Stateless Express handlers for authentication, quiz management, and social features.
3.  **Real-time Layer**: A Socket.io cluster managing match lobbies, synchronized timers, and live scoring.
4.  **Data Layer**: Prisma ORM provides type-safe access to a PostgreSQL database for persistence.

---

## 📜 License
This project is licensed under the **ISC License**.

---

*Built with ❤️ by the SAMARPAN Team.*
