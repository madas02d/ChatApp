#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Cloudinary Setup Helper\n');

rl.question('Enter your Cloudinary Cloud Name: ', (cloudName) => {
  rl.question('Enter your Cloudinary Upload Preset: ', (uploadPreset) => {
    
    const envContent = `VITE_API_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=${cloudName}
VITE_CLOUDINARY_UPLOAD_PRESET=${uploadPreset}`;

    const envPath = path.join(__dirname, 'frontend', '.env');
    
    try {
      fs.writeFileSync(envPath, envContent);
      console.log('\n✅ .env file updated successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Restart your frontend development server');
      console.log('2. Go to the Profile page and try uploading an image');
      console.log('\n🔗 Cloudinary Dashboard: https://cloudinary.com/console');
    } catch (error) {
      console.error('❌ Error writing .env file:', error.message);
    }
    
    rl.close();
  });
});
