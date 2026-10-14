import { withApi } from '@/server/http.mjs';
import { removeMember } from '@/server/services/groups/removeMember.mjs';
export const DELETE = withApi(removeMember);
