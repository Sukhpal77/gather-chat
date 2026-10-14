import { withApi } from '@/server/http.mjs';
import { listSharedFiles } from '@/server/services/files/listSharedFiles.mjs';
export const GET = withApi(listSharedFiles);
