import { withApi } from '@/server/http.mjs';
import { respondToInvitation } from '@/server/services/groups/respondToInvitation.mjs';
export const POST = withApi(respondToInvitation);
