import { json, readBody as body } from '@/server/http.mjs';

import bcrypt from 'bcryptjs';

import { User } from '@/lib/models.mjs';
import { createSession, setSession, publicUser, limit } from '@/lib/auth.mjs';
import { accountInput } from '@/lib/validation.mjs';

export async function register(request) {
  const input = accountInput(await body(request));
  await limit(`register:${input.email}`, 5);
  const user = await User.create({ ...input, password: await bcrypt.hash(input.password, 12) });
  return setSession(json({ user: publicUser(user, true) }, 201), await createSession(user));
}
