// Cached Mongoose connection. Next.js dev hot-reloads modules on every request,
// so we cache the connection on globalThis to avoid spawning a new pool each time.
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = globalThis._rkMongoose;
if (!cached) cached = globalThis._rkMongoose = { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set in .env.local");
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false, serverSelectionTimeoutMS: 5000 })
      .then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // allow retry on next call
    throw e;
  }
  return cached.conn;
}

export function dbState() {
  // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
  return mongoose.connection?.readyState ?? 0;
}
