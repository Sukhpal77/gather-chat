import mongoose from 'mongoose';
const { Schema } = mongoose;
const id = { type: Schema.Types.ObjectId, ref: 'User' };
const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);
export const Reset = model(
  'Reset',
  new Schema({
    tokenHash: { type: String, unique: true },
    user: id,
    expiresAt: { type: Date, index: { expires: 0 } },
  }),
);
