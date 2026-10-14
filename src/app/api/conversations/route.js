import { withApi } from '@/server/http.mjs';
import { listConversations } from '@/server/services/conversations/listConversations.mjs';
import { createConversation } from '@/server/services/conversations/createConversation.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withApi(listConversations);
export const POST = withApi(createConversation);
