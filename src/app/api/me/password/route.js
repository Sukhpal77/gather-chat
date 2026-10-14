import { withApi } from '@/server/http.mjs';
import { changePassword } from '@/server/services/users/changePassword.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = withApi(changePassword);
