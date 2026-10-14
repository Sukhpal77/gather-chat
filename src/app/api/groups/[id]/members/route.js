import { withApi } from '@/server/http.mjs';
import { addMembers } from '@/server/services/groups/addMembers.mjs';
export const POST = withApi(addMembers);
