export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export function ensure(value, message, status = 400) {
  if (!value) throw new AppError(message, status);
}
export function text(value, name, max = 4000, required = true) {
  ensure(typeof value === 'string', `${name} must be text.`);
  const result = value.trim();
  ensure(
    (!required || result.length > 0) && result.length <= max,
    `${name} must be ${required ? '1' : '0'}–${max} characters.`,
  );
  return result;
}
export function objectId(value) {
  ensure(typeof value === 'string' && /^[a-f\d]{24}$/i.test(value), 'Invalid ID.');
  return value;
}
export function accountInput(body) {
  const name = text(body.name, 'Name', 80);
  const username = text(body.username, 'Username', 30).toLowerCase();
  ensure(
    /^[a-z0-9_]{3,30}$/.test(username),
    'Username needs 3–30 letters, numbers, or underscores.',
  );
  const email = text(body.email, 'Email', 254).toLowerCase();
  ensure(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Enter a valid email.');
  const password = passwordInput(body.password);
  return { name, username, email, password };
}
export function passwordInput(value) {
  ensure(
    typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value, 'utf8') <= 72,
    'Password must be at least 8 characters and at most 72 UTF-8 bytes.',
  );
  return value;
}
export const pairKey = (a, b) => [String(a), String(b)].sort().join(':');
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  const expected = process.env.APP_URL || new URL(request.url).origin;
  ensure(!origin || origin === new URL(expected).origin, 'Request origin is not allowed.', 403);
}
