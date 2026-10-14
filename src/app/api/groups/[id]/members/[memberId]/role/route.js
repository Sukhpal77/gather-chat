import { withApi } from '@/server/http.mjs';
import { setAdmin } from '@/server/services/groups/setAdmin.mjs';
export const PATCH = withApi(setAdmin);
