import { json, readBody as body } from '@/server/http.mjs';
import { randomBytes } from 'node:crypto';

import nodemailer from 'nodemailer';

import { User, Reset } from '@/lib/models.mjs';
import { hashToken, limit } from '@/lib/auth.mjs';
import { ensure, text } from '@/lib/validation.mjs';

export async function forgotPassword(request) {
  const email = text((await body(request)).email, 'Email', 254).toLowerCase();
  await limit(`reset:${email}`, 3);
  ensure(
    process.env.SMTP_HOST,
    'Password reset email is not configured. Contact the app administrator.',
    503,
  );
  const user = await User.findOne({ email });
  if (user) {
    const token = randomBytes(32).toString('hex');
    await Reset.deleteMany({ user: user._id });
    await Reset.create({
      user: user._id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 30 * 60000),
    });
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === '465',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reset your Gather password',
      text: `Reset your password within 30 minutes: ${process.env.APP_URL || 'http://localhost:3000'}/?reset=${token}`,
    });
  }
  return json({ message: 'If that email belongs to an account, a reset link is on its way.' });
}
