import { withApi } from '@/server/http.mjs';
import { getProfile } from '@/server/services/users/getProfile.mjs';
import { updateProfile } from '@/server/services/users/updateProfile.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withApi(getProfile);
export const PATCH = withApi(updateProfile);
