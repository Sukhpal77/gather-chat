import mongoose from 'mongoose';

const cache = globalThis.gatherMongo || (globalThis.gatherMongo = { promise: null });
export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gather', {
        serverSelectionTimeoutMS: 5000,
      })
      .catch((error) => {
        cache.promise = null;
        throw error;
      });
  }
  return cache.promise;
}
