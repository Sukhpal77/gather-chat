import { withApi } from '@/server/http.mjs';
import { inviteMembers } from '@/server/services/groups/inviteMembers.mjs';
import { listPendingInvites } from '@/server/services/groups/listPendingInvites.mjs';
export const POST = withApi(inviteMembers);
export const GET = withApi(listPendingInvites);
