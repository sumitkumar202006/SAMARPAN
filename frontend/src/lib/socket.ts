import { io } from 'socket.io-client';

const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'samarpan-quiz.vercel.app'
  ? 'https://samarpan-9rt8.onrender.com'
  : 'http://127.0.0.1:5001';

const socket = io(API_BASE, {
  autoConnect: false, // We will connect manually when the user is logged in
});

export default socket;
