import { readFile } from 'node:fs/promises';
import nextEnv from '@next/env';
import mongoose from 'mongoose';
import { connectDB } from '../src/lib/db.mjs';
import { importLegacyData } from './migration/importLegacyData.mjs';

nextEnv.loadEnvConfig(process.cwd());
const file = process.argv[2];
if (!file) throw new Error('Usage: npm run migrate -- path/to/data-export.json');
const data = JSON.parse(await readFile(file, 'utf8'));
await connectDB();
try {
  console.log('Migration complete:', await importLegacyData(data));
} finally {
  await mongoose.disconnect();
}
