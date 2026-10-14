import mongoose from 'mongoose';
const { Schema } = mongoose;
const id = { type: Schema.Types.ObjectId, ref: 'User' };
const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);
export const Friendship = model(
  'Friendship',
  new Schema(
    {
      pair: { type: String, unique: true, required: true },
      from: id,
      to: id,
      status: { type: String, enum: ['pending', 'accepted', 'blocked'], default: 'pending' },
      blockedBy: id,
    },
    { timestamps: true },
  ),
);
