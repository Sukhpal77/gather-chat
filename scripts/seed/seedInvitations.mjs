import { GroupInvitation, Friendship } from '../../src/lib/models.mjs';
import { pairKey } from '../../src/lib/validation.mjs';
import { invitations } from './data/invitations.mjs';
import { SeedRecord } from './models/SeedRecord.mjs';

export async function seedInvitations(users, conversations, counts) {
  for (const fixture of invitations) {
    const key = `invitation:${fixture.key}`;
    if (await SeedRecord.exists({ _id: key })) continue;
    const group = conversations[fixture.group];
    if (!group) continue;
    const from = users[fixture.from]._id,
      to = users[fixture.to]._id;
    if (group.members.some((id) => String(id) === String(to))) {
      await SeedRecord.updateOne({ _id: key }, { $setOnInsert: {} }, { upsert: true });
      continue;
    }
    const manager =
      String(group.owner) === String(from) ||
      group.admins.some((id) => String(id) === String(from));
    if (!manager || !(await Friendship.exists({ pair: pairKey(from, to), status: 'accepted' })))
      continue;
    const result = await GroupInvitation.updateOne(
      { group: group._id, to },
      { $setOnInsert: { from, expiresAt: new Date(Date.now() + 7 * 86400000) } },
      { upsert: true },
    );
    counts.invitations += result.upsertedCount;
    await SeedRecord.updateOne({ _id: key }, { $setOnInsert: {} }, { upsert: true });
  }
}
