import mongoose from "mongoose";

// Serverless-safe connect: never process.exit() (that kills the Vercel lambda
// container and surfaces as FUNCTION_INVOCATION_FAILED to the user).
// Instead: fail fast on server selection, retry a few times, and let mongoose
// queue subsequent operations until the connection opens.
const MAX_ATTEMPTS = 3;

export const connectDB = async () => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.error(`❌ MongoDB connection error (attempt ${attempt}/${MAX_ATTEMPTS}):`, err.message);
      if (attempt === MAX_ATTEMPTS) {
        if (!process.env.VERCEL) process.exit(1);
        // On Vercel: give up quietly for this invocation; the next one retries.
        return null;
      }
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
};
