import { json, readBody as body } from '@/server/http.mjs';

import { User, Attachment } from '@/lib/models.mjs';
import { publicUser } from '@/lib/auth.mjs';
import { ensure, text } from '@/lib/validation.mjs';

export async function updateProfile(request, { user, id }) {
  const uid = user?._id;

  const input = await body(request);
  const update = {};
  for (const [field, max] of [
    ['name', 80],
    ['bio', 240],
    ['status', 80],
    ['mobile', 30],
    ['address', 160],
  ]) {
    if (input[field] !== undefined)
      update[field] = text(input[field], field, max, field === 'name');
  }
  if (input.avatar !== undefined) {
    ensure(
      input.avatar === '' || /^\/api\/files\/[a-f\d]{24}$/.test(input.avatar),
      'Invalid avatar.',
    );
    if (input.avatar)
      ensure(
        await Attachment.exists({
          _id: input.avatar.split('/').pop(),
          owner: uid,
          mime: /^image\//,
        }),
        'Avatar not found.',
      );
    update.avatar = input.avatar;
  }
  if (input.preferences) {
    if (input.preferences.theme) {
      ensure(['light', 'dark'].includes(input.preferences.theme), 'Invalid theme.');
      update['preferences.theme'] = input.preferences.theme;
    }
    if (typeof input.preferences.sound === 'boolean')
      update['preferences.sound'] = input.preferences.sound;
  }
  return json({
    user: publicUser(
      await User.findByIdAndUpdate(uid, { $set: update }, { new: true, runValidators: true }),
      true,
    ),
  });
}
