import { withApi } from '@/server/http.mjs';
import { downloadFile } from '@/server/services/files/downloadFile.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = withApi(downloadFile);
