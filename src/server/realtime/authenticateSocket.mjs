import { cookieToken, userFromToken, hashToken } from '../../lib/auth.mjs';
export async function authenticateSocket(socket, done) {
  try {
    const token = cookieToken(socket.request.headers.cookie || '');
    const user = await userFromToken(token);
    if (!user) return done(new Error('Please sign in.'));
    socket.data.userId = String(user._id);
    socket.data.tokenHash = hashToken(token);
    done();
  } catch {
    done(new Error('Unable to connect.'));
  }
}
