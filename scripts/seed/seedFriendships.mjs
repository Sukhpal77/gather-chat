import { Friendship } from '../../src/lib/models.mjs';
import { pairKey } from '../../src/lib/validation.mjs';
import { friendships } from './data/friendships.mjs';
import { SeedRecord } from './models/SeedRecord.mjs';

export async function seedFriendships(users, counts) {
  for (const fixture of friendships) {
    const from = users[fixture.from]._id,
      to = users[fixture.to]._id;
    const key = `friendship:${[fixture.from, fixture.to].sort().join(':')}`;
    if (await SeedRecord.exists({ _id: key })) continue;
    const result = await Friendship.updateOne(
      { pair: pairKey(from, to) },
      {
        $setOnInsert: {
          from,
          to,
          status: fixture.status,
          ...(fixture.blockedBy ? { blockedBy: users[fixture.blockedBy]._id } : {}),
        },
      },
      { upsert: true },
    );
    counts.friendships += result.upsertedCount;
    await SeedRecord.updateOne({ _id: key }, { $setOnInsert: {} }, { upsert: true });
  }
}
