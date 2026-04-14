import { io } from 'socket.io-client';

const isProduction = typeof window !== 'undefined' && 
  (window.location.hostname === 'samarpan-quiz.vercel.app' || 
   window.location.hostname.endsWith('.vercel.app'));

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
  (isProduction ? 'https://samarpan-9rt8.onrender.com' : 'http://localhost:5001');

const socket = io(SOCKET_URL, {
  autoConnect: false, // We will connect manually when the user is logged in
});

export default socket;
