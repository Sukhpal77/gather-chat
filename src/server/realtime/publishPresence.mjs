import { Conversation } from '../../lib/models.mjs';
export async function publishPresence(io, socket, online) {
  const userId = socket.data.userId;
  const conversations = await Conversation.find({ members: userId }).select('members').lean();
  const peers = [
    ...new Set(conversations.flatMap((conversation) => conversation.members.map(String))),
  ];
  io.to(`user:${userId}`).emit(
    'presence:update',
    peers.filter((id) => online.has(id)),
  );
  for (const peer of peers)
    io.to(`user:${peer}`).emit('presence:change', { userId, online: online.has(userId) });
}
