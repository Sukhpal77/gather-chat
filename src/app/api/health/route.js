import { withApi, json } from '@/server/http.mjs';
export const dynamic = 'force-dynamic';
export const GET = withApi(async () => json({ status: 'ok', database: 'mongodb' }), {
  public: true,
});
