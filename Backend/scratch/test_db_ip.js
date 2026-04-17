const net = require('net');
const host = '34.196.24.162';
const port = 5432;

console.log(`Attempting to connect to ${host}:${port} (Direct IP of Neon Proxy)...`);

const socket = net.createConnection(port, host, () => {
    console.log('Successfully connected to the host via IP!');
    socket.end();
});

socket.on('error', (err) => {
    console.error('Connection failed:', err.message);
    process.exit(1);
});

socket.setTimeout(10000, () => {
    console.error('Connection timed out after 10 seconds');
    socket.destroy();
    process.exit(1);
});
