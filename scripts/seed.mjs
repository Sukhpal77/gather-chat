import nextEnv from '@next/env';
import mongoose from 'mongoose';
import { connectDB } from '../src/lib/db.mjs';
import { passwordInput } from '../src/lib/validation.mjs';
import { runSeed } from './seed/runSeed.mjs';

nextEnv.loadEnvConfig(process.cwd());
try {
  if (!process.env.DEMO_PASSWORD)
    throw new Error('Set DEMO_PASSWORD before running the seeder. See docs/SEED_DATA.md.');
  const password = passwordInput(process.env.DEMO_PASSWORD);
  await connectDB();
  const counts = await runSeed(password);
  console.log('Demo seed complete. New records:', JSON.stringify(counts));
  console.log('Sign in as jamie@example.com with the DEMO_PASSWORD supplied on the first run.');
  console.log('Existing demo passwords and user edits are preserved. See docs/SEED_DATA.md.');
} catch (error) {
  console.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
