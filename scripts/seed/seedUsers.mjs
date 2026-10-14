import bcrypt from 'bcryptjs';
import { User } from '../../src/lib/models.mjs';
import { users as fixtures } from './data/users.mjs';

export async function seedUsers(password, counts) {
  // Validate every account collision before inserting anything.
  for (const profile of fixtures) {
    const collisions = await User.find({
      $or: [
        { email: profile.email },
        { username: profile.username },
        { legacyId: `demo:${profile.username}` },
      ],
    }).lean();
    if (
      collisions.some((user) => user.legacyId !== `demo:${profile.username}`) ||
      collisions.length > 1
    )
      throw new Error(
        `Demo account conflict for ${profile.username}. No existing account will be replaced.`,
      );
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const users = {};
  for (const profile of fixtures) {
    const existing = await User.findOne({ legacyId: `demo:${profile.username}` });
    users[profile.username] =
      existing ||
      (await User.create({
        ...profile,
        password: passwordHash,
        legacyId: `demo:${profile.username}`,
      }));
    if (!existing) counts.users++;
  }
  return users;
}
