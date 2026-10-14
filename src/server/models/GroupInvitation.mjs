import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema(
  {
    group: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);
schema.index({ group: 1, to: 1 }, { unique: true });
export const GroupInvitation =
  mongoose.models.GroupInvitation || mongoose.model('GroupInvitation', schema);
