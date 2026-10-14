import { withApi } from '@/server/http.mjs';
import { listFriends } from '@/server/services/friends/listFriends.mjs';
import { requestFriend } from '@/server/services/friends/requestFriend.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withApi(listFriends);
export const POST = withApi(requestFriend);
