import { io } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || (typeof window !== 'undefined' && window.location.hostname === 'samarpan-quiz.vercel.app'
  ? 'https://samarpan-9rt8.onrender.com'
  : 'http://localhost:5001');

const socket = io(API_BASE, {
  autoConnect: false, // We will connect manually when the user is logged in
});

export default socket;
