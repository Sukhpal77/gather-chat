import { json, readBody as body } from '@/server/http.mjs';

import bcrypt from 'bcryptjs';

import { User } from '@/lib/models.mjs';
import { createSession, setSession, publicUser, limit } from '@/lib/auth.mjs';
import { ensure, text } from '@/lib/validation.mjs';

export async function login(request) {
  const input = await body(request);
  const login = text(input.login, 'Email or username', 254).toLowerCase();
  ensure(typeof input.password === 'string' && input.password.length <= 256, 'Invalid password.');
  await limit(`login:${login}`);
  const user = await User.findOne({ $or: [{ email: login }, { username: login }] }).select(
    '+password',
  );
  const valid = await bcrypt.compare(
    input.password,
    user?.password || '$2b$12$IM9VIJoqHtDdG7OvDbENGeVFPEqWiIiEmqoM44TDrvxVWLoBCXPpS',
  );
  ensure(user && valid, 'Email, username, or password is incorrect.', 401);
  return setSession(json({ user: publicUser(user, true) }), await createSession(user));
}
