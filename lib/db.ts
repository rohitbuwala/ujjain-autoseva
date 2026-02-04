import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if(!MONGODB_URI){
    throw new Error("Please add mongoDb_uri in .env");
}

let cached = global as any;


if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null };
}

    async function connectDB() {
  if (cached.mongoose.conn) {
    return cached.mongoose.conn;
  }

  if (!cached.mongoose.promise) {
    cached.mongoose.promise = mongoose.connect(MONGODB_URI);
  }

   cached.mongoose.conn = await cached.mongoose.promise;

  return cached.mongoose.conn;
}

export default connectDB;