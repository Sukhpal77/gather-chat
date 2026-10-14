import { readFile } from 'node:fs/promises';
import { Attachment } from '../../src/lib/models.mjs';
import { SeedRecord } from './models/SeedRecord.mjs';
import { createAudioSample } from './createAudioSample.mjs';

export async function seedAttachments(users, counts) {
  const fixtures = [
    {
      key: 'weekend-plan',
      owner: 'jamie',
      name: 'weekend-plan.txt',
      mime: 'text/plain',
      data: Buffer.from(
        'Saturday together\n10:00 — Coffee at the courtyard café\n11:00 — A gentle walk\n12:30 — Lunch and good conversation\n\nThis is fictional demo data.\n',
      ),
    },
    {
      key: 'welcome-image',
      owner: 'alex',
      name: 'welcome-illustration.png',
      mime: 'image/png',
      data: await readFile(new URL('./assets/welcome.png', import.meta.url)),
    },
    {
      key: 'audio-tone',
      owner: 'sam',
      name: 'sample-tone.wav',
      mime: 'audio/wav',
      data: createAudioSample(),
    },
  ];
  const attachments = {};
  for (const fixture of fixtures) {
    const key = `attachment:${fixture.key}`;
    const marker = await SeedRecord.findById(key).lean();
    let attachment = marker && (await Attachment.findById(marker.documentId));
    if (!attachment && marker) continue;
    if (!attachment) {
      attachment = await Attachment.create({
        owner: users[fixture.owner]._id,
        name: fixture.name,
        mime: fixture.mime,
        size: fixture.data.length,
        data: fixture.data,
      });
      counts.attachments++;
    }
    attachments[fixture.key] = attachment;
    await SeedRecord.updateOne(
      { _id: key },
      { $setOnInsert: { documentId: attachment._id } },
      { upsert: true },
    );
  }
  return attachments;
}
