// lib/dbConnect.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your .env");
}

// Global is used to maintain a cached connection across hot reloads in dev
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    // Return existing connection
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("🟡 Connecting to MongoDB...");
    const uri = MONGODB_URI.includes("?") ? MONGODB_URI : `${MONGODB_URI}?authSource=admin`;

    cached.promise = mongoose
      .connect(uri, {
        dbName: "web",
        bufferCommands: false,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then((mongoose) => {
        console.log("✅ MongoDB connected successfully!");
        console.log("📍 Connected to database:", mongoose.connection.db.databaseName);
        return mongoose;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        cached.promise = null; // allow retry
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
