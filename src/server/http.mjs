import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { requireUser } from '@/lib/auth.mjs';
import { AppError, ensure, sameOrigin } from '@/lib/validation.mjs';

export const json = (value, status = 200) =>
  NextResponse.json(value, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });

export async function readBody(request) {
  ensure(Number(request.headers.get('content-length') || 0) <= 16000, 'Request is too large.', 413);
  const raw = await request.text();
  ensure(Buffer.byteLength(raw) <= 16000, 'Request is too large.', 413);
  try {
    const value = JSON.parse(raw);
    ensure(value && typeof value === 'object' && !Array.isArray(value), 'Invalid JSON.');
    return value;
  } catch {
    throw new AppError('Invalid JSON.');
  }
}

export function withApi(service, options = {}) {
  return async (request, context) => {
    try {
      if (request.method !== 'GET') sameOrigin(request);
      await connectDB();
      const user = options.public ? null : await requireUser(request);
      const params = context?.params ? await context.params : {};
      return await service(request, { ...params, user });
    } catch (error) {
      if (error.code === 11000)
        return json({ error: 'That account or friend request already exists.' }, 409);
      if (error instanceof AppError) return json({ error: error.message }, error.status);
      if (['ValidationError', 'CastError'].includes(error.name))
        return json({ error: 'Invalid request data.' }, 400);
      console.error('API error:', error.message);
      return json(
        {
          error:
            error.name === 'MongooseServerSelectionError'
              ? 'Database unavailable. Start MongoDB and try again.'
              : 'Something went wrong. Please try again.',
        },
        503,
      );
    }
  };
}
