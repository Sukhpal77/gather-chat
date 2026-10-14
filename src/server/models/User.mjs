import mongoose from 'mongoose';
const { Schema } = mongoose;
const id = { type: Schema.Types.ObjectId, ref: 'User' };
const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema);
export const User = model(
  'User',
  new Schema(
    {
      name: { type: String, required: true, maxlength: 80 },
      username: { type: String, required: true, unique: true, lowercase: true },
      email: { type: String, required: true, unique: true, lowercase: true },
      password: { type: String, required: true, select: false },
      bio: { type: String, default: '', maxlength: 240 },
      avatar: { type: String, default: '' },
      status: { type: String, default: 'Available', maxlength: 80 },
      mobile: { type: String, default: '', maxlength: 30 },
      address: { type: String, default: '', maxlength: 160 },
      preferences: {
        theme: { type: String, default: 'light' },
        sound: { type: Boolean, default: true },
      },
      legacyId: { type: String, index: true, sparse: true },
    },
    { timestamps: true },
  ),
);
