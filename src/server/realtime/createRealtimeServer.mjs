import { Server } from 'socket.io';
import { authenticateSocket } from './authenticateSocket.mjs';
import { publishPresence } from './publishPresence.mjs';
import { registerMessageHandler } from './registerMessageHandler.mjs';
import { registerTypingHandler } from './registerTypingHandler.mjs';
export function createRealtimeServer(httpServer, port) {
  const origin = new URL(process.env.APP_URL || `http://localhost:${port}`).origin;
  const io = new Server(httpServer, {
    maxHttpBufferSize: 16000,
    cors: { origin, credentials: true },
    allowRequest: (request, callback) =>
      callback(null, !request.headers.origin || request.headers.origin === origin),
  });
  globalThis.gatherIO = io;
  const online = new Map();
  io.use(authenticateSocket);
  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);
    online.set(userId, (online.get(userId) || 0) + 1);
    publishPresence(io, socket, online).catch(console.error);
    socket.on('presence:refresh', () => publishPresence(io, socket, online).catch(console.error));
    registerTypingHandler(socket);
    registerMessageHandler(socket);
    socket.on('disconnect', () => {
      const count = (online.get(userId) || 1) - 1;
      if (count) online.set(userId, count);
      else online.delete(userId);
      publishPresence(io, socket, online).catch(console.error);
    });
  });
  return io;
}
