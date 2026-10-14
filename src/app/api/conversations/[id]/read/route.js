import { withApi } from '@/server/http.mjs';
import { readMessages } from '@/server/services/messages/readMessages.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = withApi(readMessages);
