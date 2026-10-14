import { withApi } from '@/server/http.mjs';
import { transferOwnership } from '@/server/services/groups/transferOwnership.mjs';
export const POST = withApi(transferOwnership);
