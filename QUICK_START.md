# Quick Start Guide - E2E Encryption & Media Features

## What's New

This update adds:
1. **End-to-End Encryption** - Messages are encrypted before sending
2. **File Upload Support** - Send images, audio, and video files
3. **Enhanced Message Display** - Rich media rendering in chat

## Setup

### 1. Backend Setup

Make sure your `backend/.env` file has Cloudinary credentials:

```env
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 2. Start Backend

```bash
cd backend
npm install
npm start
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

## Usage

### Sending Encrypted Messages

1. Open a conversation
2. Type your message
3. Click "Send" - the message will be automatically encrypted

### Sending Files

1. Open a conversation
2. Click the attachment icon (paperclip) in the message input
3. Select an image, audio, or video file
4. (Optional) Add a caption
5. Click "Send"

### Supported File Types

- **Images**: JPEG, PNG, GIF, WebP
- **Audio**: MP3, WAV, OGG, WebM
- **Video**: MP4, WebM, OGG, QuickTime

**Maximum file size**: 100MB

## Features

### Encryption Indicators

- Lock icon next to conversation name indicates E2E encryption is active
- Encrypted messages show a lock icon

### File Previews

- Images show preview before sending
- Videos show thumbnail preview
- File name and size are displayed

## Troubleshooting

### Encryption Not Working

If you see "[Unable to decrypt]" messages:
1. Refresh the page to reinitialize encryption
2. Check browser console for errors
3. Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)

### File Upload Fails

If file uploads fail:
1. Check file size (must be under 100MB)
2. Verify file type is supported
3. Check Cloudinary configuration in backend/.env
4. Check browser console and network tab for errors

### Messages Not Loading

If messages don't load:
1. Check browser console for errors
2. Verify backend is running
3. Check network connectivity
4. Verify authentication token is valid

## Security Notes

- Encryption keys are stored in browser localStorage (for now)
- In production, consider using more secure storage
- Keys are encrypted on the server but server has access to encrypted keys
- For production, implement proper key exchange with password-derived encryption

## Next Steps

For production deployment:
1. Implement secure key storage (encrypted IndexedDB)
2. Add password-based key encryption
3. Implement key rotation
4. Add forward secrecy
5. Encrypt files before upload

For more details, see `E2E_ENCRYPTION_FEATURES.md`


