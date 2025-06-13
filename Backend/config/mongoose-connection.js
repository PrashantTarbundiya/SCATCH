import mongoose from 'mongoose';
import dotenv from 'dotenv';
import debug from 'debug';

const dbgr = debug("development:mongoose");

dotenv.config(); // This will load .env from the root of the project by default

const connectDB = async () => {
  try {
    // useNewUrlParser, useUnifiedTopology, useCreateIndex, and useFindAndModify
    // are no longer supported options. Mongoose 6 always behaves as if
    // useNewUrlParser, useUnifiedTopology, and useCreateIndex are true,
    // and useFindAndModify is false.
    await mongoose.connect(process.env.MONGODB_URI);
    dbgr('MongoDB Connected');
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;