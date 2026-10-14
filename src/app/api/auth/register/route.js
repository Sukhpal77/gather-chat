import { withApi } from '@/server/http.mjs';
import { register } from '@/server/services/auth/register.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = withApi(register, { public: true });
