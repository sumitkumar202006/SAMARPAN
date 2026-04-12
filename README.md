# SAMARPAN

### 🌐 Live Demo

--> **[Click here to open Frontend](https://samarpan-quiz.vercel.app/)**   


#Note: The project is best experienced using the deployed live demo.
Local setup instructions are provided for reference only.

-------SAMARPAN – Quiz & Tournament Platform (Prototype)-------

# Project Overview:
Samarpan is a lightweight quiz and tournament prototype built with a focus on simplicity, speed, and a clean user
experience.

# Setup Instructions:
1. Clone the repository.
2. Install dependencies using 'npm install'.
3. Create a .env file from .env.example and add required values.
4. Start the server using node 'server.js'.
5. Open index.html using a live server.

# Architecture Overview:
-Frontend: HTML, CSS, JS
-Backend: Node.js, Express, MongoDB
-Routes for auth, quizzes, AI, hosting, ratings

#How to Run Locally:
1. Backend: 'node server.js'/ 'npm run dev'/ npm start 
2. Frontend: open index.html via Live Server

# API Endpoints:
POST /api/signup
POST /api/login
POST /api/quizzes
POST /api/ai/generate-quiz
POST /api/host/start
GET /leaderboard
GET /ratings/:email

# Example Inputs/Outputs
(Manual quiz creation, AI quiz response samples)

# Dependencies
Backend: express, mongoose, bcrypt, jsonwebtoken, passport, dotenv, cors
Frontend: vanilla JS


# .env file example:
MONGO_URI=your-mongodb-connection-string-here
PORT=5000

GROQ_API_KEY=your-groq-api-key-here

JWT_SECRET=your-jwt-secret-here

FRONTEND_URL=http://127.0.0.1:5500/Frontend/index.html

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/auth/facebook/callback
