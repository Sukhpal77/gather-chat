import mongoose from 'mongoose';
const { Schema } = mongoose;
const id = { type: Schema.Types.ObjectId, ref: 'User' };
const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);
const messageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: id,
    text: { type: String, default: '', maxlength: 4000 },
    attachment: { type: Schema.Types.ObjectId, ref: 'Attachment' },
    readBy: [id],
    clientId: { type: String, required: true, maxlength: 100 },
    legacyId: { type: String, index: true, sparse: true },
  },
  { timestamps: true },
);
messageSchema.index({ conversation: 1, createdAt: -1, _id: -1 });
messageSchema.index({ sender: 1, clientId: 1 }, { unique: true });
export const Message = model('Message', messageSchema);
