import { withApi } from '@/server/http.mjs';
import { resetPassword } from '@/server/services/auth/reset.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = withApi(resetPassword, { public: true });
