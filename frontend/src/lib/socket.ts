import { io } from 'socket.io-client';

const isProd = process.env.NODE_ENV === 'production';
const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
  (isProd ? 'https://samarpan-9rt8.onrender.com' : 'http://localhost:5001');

const socket = io(SOCKET_URL, {
  autoConnect: false, // We will connect manually when the user is logged in
});

export default socket;
