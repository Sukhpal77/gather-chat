import { cookieToken, userFromToken, limit } from '../../lib/auth.mjs';
import { sendMessage, notifyMembers } from '../../lib/chat.mjs';
export function registerMessageHandler(socket) {
  socket.on('message:send', async (input, callback) => {
    const reply = typeof callback === 'function' ? callback : () => {};
    try {
      const user = await userFromToken(cookieToken(socket.request.headers.cookie || ''));
      if (!user) {
        reply({ error: 'Please sign in.' });
        return socket.disconnect(true);
      }
      await limit(`messages:${socket.data.userId}`, 90, 1);
      const result = await sendMessage(socket.data.userId, input || {});
      if (!result.duplicate) notifyMembers(result.members, 'message:new', result.message);
      reply({ message: result.message });
    } catch (error) {
      reply({ error: error.status ? error.message : 'Message could not be sent.' });
    }
  });
}
