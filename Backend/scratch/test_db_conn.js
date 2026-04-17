const net = require('net');
const host = 'ep-crimson-union-am694svt.us-east-1.aws.neon.tech';
const port = 5432;

console.log(`Attempting to connect to ${host}:${port}...`);

const socket = net.createConnection(port, host, () => {
    console.log('Successfully connected to the host!');
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
