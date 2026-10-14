import { withApi } from '@/server/http.mjs';
import { manageFriend } from '@/server/services/friends/manageFriend.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const PATCH = withApi(manageFriend);
export const DELETE = withApi(manageFriend);
