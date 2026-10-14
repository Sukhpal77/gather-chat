import mongoose from 'mongoose';
const { Schema } = mongoose;
const id = { type: Schema.Types.ObjectId, ref: 'User' };
const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);
export const Attachment = model(
  'Attachment',
  new Schema(
    {
      owner: id,
      name: String,
      mime: String,
      size: Number,
      data: { type: Buffer, select: false },
    },
    { timestamps: true },
  ),
);
