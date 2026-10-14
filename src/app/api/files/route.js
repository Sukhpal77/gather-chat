import { withApi } from '@/server/http.mjs';
import { uploadFile } from '@/server/services/files/uploadFile.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = withApi(uploadFile);
