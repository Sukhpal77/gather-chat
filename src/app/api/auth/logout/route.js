import { withApi } from '@/server/http.mjs';
import { logout } from '@/server/services/auth/logout.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = withApi(logout, { public: true });
