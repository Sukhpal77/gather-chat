import { randomBytes, createHash } from 'node:crypto';
import { connectDB } from './db.mjs';
import { Session, User, RateLimit } from './models.mjs';
import { ensure } from './validation.mjs';
export const COOKIE = 'gather_session';
export const hashToken = (value) => createHash('sha256').update(value).digest('hex');
export function cookieToken(header = '') {
  return header
    .split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
}
export async function userFromToken(token) {
  if (!token || !/^[a-f\d]{64}$/.test(token)) return null;
  await connectDB();
  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  }).lean();
  return session ? User.findById(session.user).lean() : null;
}
export async function requireUser(request) {
  const user = await userFromToken(cookieToken(request.headers.get('cookie') || ''));
  ensure(user, 'Please sign in to continue.', 401);
  return user;
}
export async function createSession(user) {
  const token = randomBytes(32).toString('hex');
  await Session.create({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 7 * 86400000),
  });
  return token;
}
export function setSession(response, token, clear = false) {
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: clear ? 0 : 7 * 86400,
  });
  return response;
}
export function publicUser(user, own = false) {
  const value = {
    id: String(user._id),
    name: user.name,
    username: user.username,
    bio: user.bio,
    avatar: user.avatar,
    status: user.status,
  };
  if (own)
    Object.assign(value, {
      email: user.email,
      mobile: user.mobile,
      address: user.address,
      preferences: user.preferences,
    });
  return value;
}
export async function limit(key, max = 15, minutes = 15) {
  const bucket = Math.floor(Date.now() / (minutes * 60000));
  const entry = await RateLimit.findOneAndUpdate(
    { key: hashToken(`${key}:${bucket}`) },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + minutes * 60000) } },
    { upsert: true, new: true },
  );
  ensure(entry.count <= max, 'Too many attempts. Please try again later.', 429);
}
