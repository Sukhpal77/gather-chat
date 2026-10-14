import { withApi } from '@/server/http.mjs';
import { login } from '@/server/services/auth/login.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = withApi(login, { public: true });
