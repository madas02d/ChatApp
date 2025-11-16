import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testMongoConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected:', conn.connection.host);
    
    // Test a simple query
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('✅ Connection test successful');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Full error:', error);
  }
};

testMongoConnection();
