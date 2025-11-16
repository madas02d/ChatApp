// Simple test to verify Cloudinary setup works
import cloudinary from 'cloudinary';
import { v2 as cloudinaryV2 } from 'cloudinary';

// Test Cloudinary configuration
const testCloudinary = () => {
  console.log('Testing Cloudinary configuration...');
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  console.log('Cloud Name:', cloudName);
  console.log('API Key:', apiKey ? 'Set' : 'Not set');
  console.log('API Secret:', apiSecret ? 'Set' : 'Not set');
  
  if (!cloudName || !apiKey || !apiSecret) {
    console.log('❌ Cloudinary not properly configured');
    console.log('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
    return false;
  }
  
  // Configure Cloudinary
  cloudinaryV2.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  
  console.log('✅ Cloudinary configured successfully');
  return true;
};

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

testCloudinary();
