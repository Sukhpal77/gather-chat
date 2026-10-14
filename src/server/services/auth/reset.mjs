import { json, readBody as body } from '@/server/http.mjs';

import bcrypt from 'bcryptjs';

import { User, Session, Reset } from '@/lib/models.mjs';
import { hashToken } from '@/lib/auth.mjs';
import { ensure, passwordInput } from '@/lib/validation.mjs';

export async function resetPassword(request) {
  const input = await body(request);
  const password = passwordInput(input.password);
  ensure(
    typeof input.token === 'string' && /^[a-f\d]{64}$/.test(input.token),
    'Invalid reset link.',
  );
  const reset = await Reset.findOneAndDelete({
    tokenHash: hashToken(input.token),
    expiresAt: { $gt: new Date() },
  });
  ensure(reset, 'Reset link is invalid or expired.');
  await User.updateOne({ _id: reset.user }, { password: await bcrypt.hash(password, 12) });
  await Session.deleteMany({ user: reset.user });
  globalThis.gatherIO?.in(`user:${reset.user}`).disconnectSockets(true);
  return json({ message: 'Password updated. You can now sign in.' });
}
