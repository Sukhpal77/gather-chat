import { withApi } from '@/server/http.mjs';
import { cancelInvite } from '@/server/services/groups/cancelInvite.mjs';
export const DELETE = withApi(cancelInvite);
