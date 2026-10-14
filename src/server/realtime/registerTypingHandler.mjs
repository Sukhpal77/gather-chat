import { cookieToken, userFromToken } from '../../lib/auth.mjs';
import { membership } from '../../lib/chat.mjs';
export function registerTypingHandler(socket) {
  let lastTyping = 0;
  socket.on('typing', async (input) => {
    try {
      if (Date.now() - lastTyping < 500 || !input || typeof input !== 'object') return;
      lastTyping = Date.now();
      const user = await userFromToken(cookieToken(socket.request.headers.cookie || ''));
      if (!user) return socket.disconnect(true);
      const conversation = await membership(input.conversationId, socket.data.userId);
      socket.to(conversation.members.map((id) => `user:${id}`)).emit('typing', {
        conversationId: input.conversationId,
        userId: socket.data.userId,
        active: input.active === true,
      });
    } catch {
      /* Unauthorized typing events reveal no conversation details. */
    }
  });
}
