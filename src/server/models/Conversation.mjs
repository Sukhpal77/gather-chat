import mongoose from 'mongoose';
const { Schema } = mongoose;
const id = { type: Schema.Types.ObjectId, ref: 'User' };
const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);
export const Conversation = model(
  'Conversation',
  new Schema(
    {
      kind: { type: String, enum: ['direct', 'group'], required: true },
      directKey: { type: String, unique: true, sparse: true },
      name: { type: String, maxlength: 80 },
      description: { type: String, default: '', maxlength: 240 },
      avatar: { type: String, default: '' },
      members: [id],
      owner: id,
      admins: [id],
      pinnedBy: [id],
      archivedBy: [id],
      mutedBy: [id],
      lastMessage: { type: String, default: '' },
      lastMessageAt: { type: Date, default: Date.now },
    },
    { timestamps: true },
  ),
);
