import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Environment variables loaded:');
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
