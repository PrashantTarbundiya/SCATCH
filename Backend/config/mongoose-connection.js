const mongoose = require('mongoose')
const dotenv = require('dotenv');
const dbgr = require('debug')("development:mongoose") 

dotenv.config();
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
    });
    dbgr('MongoDB Connected');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}


module.exports = connectDB;