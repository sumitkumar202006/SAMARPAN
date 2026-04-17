import { io } from 'socket.io-client';

const isProd = process.env.NODE_ENV === 'production';
const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
  (isProd ? 'https://samarpan-9rt8.onrender.com' : 'http://127.0.0.1:5001');

const socket = io(SOCKET_URL, {
  autoConnect: false, // We will connect manually when the user is logged in
  transports: ['websocket', 'polling'], // Allow fallback for better reliability
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
