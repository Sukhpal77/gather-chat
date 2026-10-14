import { withApi } from '@/server/http.mjs';
import { forgotPassword } from '@/server/services/auth/forgot.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = withApi(forgotPassword, { public: true });
