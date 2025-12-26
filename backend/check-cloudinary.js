import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
const result = dotenv.config({ path: path.resolve(__dirname, '.env') });

if (result.error) {
  console.error('❌ Error loading .env file:', result.error.message);
  console.error('   Make sure you have a .env file in the backend directory');
  process.exit(1);
}

console.log('✅ .env file loaded successfully\n');

// Check Cloudinary configuration
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('🔍 Checking Cloudinary environment variables:\n');

const checks = [
  { name: 'CLOUDINARY_CLOUD_NAME', value: cloudName },
  { name: 'CLOUDINARY_API_KEY', value: apiKey },
  { name: 'CLOUDINARY_API_SECRET', value: apiSecret }
];

let allPresent = true;

checks.forEach(check => {
  const isSet = check.value && typeof check.value === 'string' && check.value.trim() !== '';
  const status = isSet ? '✅' : '❌';
  const display = isSet 
    ? (check.name.includes('SECRET') ? 'SET (hidden)' : `${check.value.substring(0, 10)}...`)
    : 'NOT SET';
  
  console.log(`   ${status} ${check.name}: ${display}`);
  
  if (!isSet) {
    allPresent = false;
  }
});

console.log('');

if (allPresent) {
  console.log('✅ All Cloudinary environment variables are set correctly!');
  console.log('   Your profile picture uploads should work with Cloudinary.\n');
} else {
  console.log('❌ Some Cloudinary environment variables are missing or empty.');
  console.log('\n📝 To fix this:');
  console.log('   1. Make sure you have a .env file in the backend directory');
  console.log('   2. Add these lines to your .env file:');
  console.log('      CLOUDINARY_CLOUD_NAME=your_cloud_name');
  console.log('      CLOUDINARY_API_KEY=your_api_key');
  console.log('      CLOUDINARY_API_SECRET=your_api_secret');
  console.log('   3. Get these values from: https://console.cloudinary.com/');
  console.log('   4. Restart your backend server after updating .env\n');
}


