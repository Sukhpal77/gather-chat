import { withApi } from '@/server/http.mjs';
import { leaveGroup } from '@/server/services/conversations/leaveGroup.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = withApi(leaveGroup);
