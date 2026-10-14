import { withApi } from '@/server/http.mjs';
import { searchPeople } from '@/server/services/users/searchPeople.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withApi(searchPeople);
