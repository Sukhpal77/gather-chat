import mongoose from 'mongoose';
const { Schema } = mongoose;
const id = { type: Schema.Types.ObjectId, ref: 'User' };
const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);
export const Session = model(
  'Session',
  new Schema(
    {
      tokenHash: { type: String, required: true, unique: true },
      user: id,
      expiresAt: { type: Date, required: true, index: { expires: 0 } },
    },
    { timestamps: true },
  ),
);
