import { createServer } from 'node:http';
import next from 'next';
import mongoose from 'mongoose';
import nextEnv from '@next/env';
import { connectDB } from './src/lib/db.mjs';
import { createRealtimeServer } from './src/server/realtime/createRealtimeServer.mjs';

nextEnv.loadEnvConfig(process.cwd());
const dev = !process.argv.includes('--production') && process.env.NODE_ENV !== 'production';
const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOSTNAME || '0.0.0.0';
const app = next({ dev, hostname, port });
await app.prepare();
await connectDB();
const httpServer = createServer(app.getRequestHandler());
const io = createRealtimeServer(httpServer, port);
httpServer.listen(port, hostname, () => {
  console.log(`Gather ready at http://localhost:${port} (${dev ? 'development' : 'production'})`);
});
async function shutdown() {
  io.close();
  httpServer.close();
  await mongoose.disconnect();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
