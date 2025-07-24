// lib/database.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI in .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    // Ensure we're connected to the right database
    if (cached.conn.connection.db.databaseName !== 'nextapp') {
      console.log('⚠️ Connected to wrong database, reconnecting...');
      await mongoose.disconnect();
      cached.conn = null;
      cached.promise = null;
    } else {
      return cached.conn;
    }
  }

  if (!cached.promise) {
    console.log('🟡 Connecting to MongoDB...');
    
    // Parse the URI to ensure we're connecting to the right database
    const uri = MONGODB_URI.includes('?') 
      ? MONGODB_URI 
      : `${MONGODB_URI}?authSource=admin`;
    
    console.log('🔗 Connection URI:', uri);
    
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      dbName: 'nextapp', // Explicitly specify database name
    }).then((mongoose) => {
      console.log('✅ MongoDB connected successfully!');
      console.log('📍 Connected to database:', mongoose.connection.db.databaseName);
      return mongoose;
    }).catch(err => {
      console.error('❌ MongoDB connection error:', err);
      cached.promise = null; // Reset promise on error
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null; // Reset promise on error
    throw error;
  }
}

export default dbConnect;