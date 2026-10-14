import { withApi } from '@/server/http.mjs';
import { updateConversation } from '@/server/services/conversations/updateConversation.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const PATCH = withApi(updateConversation);
