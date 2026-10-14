import { withApi } from '@/server/http.mjs';
import { updateGroup } from '@/server/services/groups/updateGroup.mjs';
export const PATCH = withApi(updateGroup);
