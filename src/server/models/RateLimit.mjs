import mongoose from 'mongoose';
const { Schema } = mongoose;
const id = { type: Schema.Types.ObjectId, ref: 'User' };
const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);
export const RateLimit = model(
  'RateLimit',
  new Schema({
    key: { type: String, unique: true },
    count: { type: Number, default: 0 },
    expiresAt: { type: Date, index: { expires: 0 } },
  }),
);
