import { withApi } from '@/server/http.mjs';
import { listMessages } from '@/server/services/messages/listMessages.mjs';
import { postMessage } from '@/server/services/messages/postMessage.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withApi(listMessages);
export const POST = withApi(postMessage);
