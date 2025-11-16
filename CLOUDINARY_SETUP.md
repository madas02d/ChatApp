# Cloudinary Setup Guide

This guide will help you set up Cloudinary for image uploads in your chat application.

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click "Sign Up For Free"
3. Fill in your details and verify your email
4. You'll be redirected to your dashboard

## Step 2: Get Your Credentials

From your Cloudinary dashboard:

1. **Cloud Name**: Found in the top section of your dashboard
2. **Upload Preset**: 
   - Go to Settings → Upload
   - Click "Add upload preset"
   - Name it something like "chat-app-preset"
   - Set Signing Mode to "Unsigned" (for client-side uploads)
   - Click "Save"

## Step 3: Update Environment Variables

Update your `frontend/.env` file with your actual credentials:

```env
VITE_API_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_actual_upload_preset
```

## Step 4: Restart the Frontend

After updating the .env file, restart your frontend development server:

```bash
cd frontend
npm run dev
```

## Features Enabled

With Cloudinary properly configured, you'll have:

- ✅ **Profile Picture Upload**: Users can upload and change their profile pictures
- ✅ **Image Optimization**: Automatic image resizing and optimization
- ✅ **Secure Storage**: Images stored securely in the cloud
- ✅ **CDN Delivery**: Fast image loading from Cloudinary's global CDN
- ✅ **Fallback Avatars**: Beautiful generated avatars when no image is uploaded

## Troubleshooting

### Common Issues:

1. **"Failed to upload image"**
   - Check that your Cloud Name and Upload Preset are correct
   - Ensure the upload preset is set to "Unsigned" mode
   - Verify your .env file is in the correct location (`frontend/.env`)

2. **"Upload preset not found"**
   - Make sure you created the upload preset in your Cloudinary dashboard
   - Check the preset name matches exactly (case-sensitive)

3. **CORS errors**
   - Cloudinary handles CORS automatically for unsigned uploads
   - If you see CORS errors, check your browser's developer console for more details

### Testing the Setup:

1. Go to the Profile page in your app
2. Click the camera icon on your profile picture
3. Select an image file
4. The image should upload and update your profile picture

## Security Notes

- The upload preset is set to "Unsigned" for simplicity
- For production, consider using signed uploads for better security
- You can set upload restrictions in your Cloudinary dashboard (file size, format, etc.)

## Free Tier Limits

Cloudinary's free tier includes:
- 25 GB storage
- 25 GB bandwidth per month
- 25,000 transformations per month

This should be more than enough for development and small-scale production use.
