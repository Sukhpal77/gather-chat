import { withApi } from '@/server/http.mjs';
import { listMyInvitations } from '@/server/services/groups/listMyInvitations.mjs';
export const GET = withApi(listMyInvitations);
