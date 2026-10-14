const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;
const users = {}; // Store users and their socket IDs

const createSocketServer = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            allowedHeaders: ['my-custom-header'],
            credentials: true,
        },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
            jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
                if (err) {
                    return next(new Error('Authentication error'));
                }
                socket.user = decoded; // Attach user info to socket
                users[decoded.userId] = socket.id; // Store the socket ID with user ID
                next();
            });
        } else {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('sendMessage', (data) => {
            const recipientSocketId = users[data.friendId]; // Get the socket ID of the recipient
            if (recipientSocketId) {
                // Emit the message only to the specific user
                io.to(recipientSocketId).emit('receiveMessage', { ...data, user: socket.user });
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            // Remove user from users object on disconnect
            for (const [userId, id] of Object.entries(users)) {
                if (id === socket.id) {
                    delete users[userId];
                    break;
                }
            }
        });
    });
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { createSocketServer, getIo };
