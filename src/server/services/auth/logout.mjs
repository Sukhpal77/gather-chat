import { json } from '@/server/http.mjs';

import { Session } from '@/lib/models.mjs';
import { cookieToken, hashToken, setSession } from '@/lib/auth.mjs';

export async function logout(request) {
  const token = cookieToken(request.headers.get('cookie') || '');
  if (token) {
    const session = await Session.findOneAndDelete({ tokenHash: hashToken(token) });
    if (session && globalThis.gatherIO) {
      for (const socket of globalThis.gatherIO.sockets.sockets.values())
        if (socket.data.tokenHash === hashToken(token)) socket.disconnect(true);
    }
  }
  return setSession(json({ ok: true }), '', true);
}
