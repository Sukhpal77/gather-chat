import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    documentId: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true },
);
export const SeedRecord = mongoose.models.SeedRecord || mongoose.model('SeedRecord', schema);
