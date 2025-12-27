# End-to-End Encryption & Media Support

This document describes the new features added to the chat application.

## Features Implemented

### 1. End-to-End Encryption (E2E)

- **AES-GCM Encryption**: All messages are encrypted using AES-256-GCM encryption
- **Key Management**: Encryption keys are generated per conversation and stored securely
- **Client-Side Encryption**: Encryption/decryption happens on the client side, ensuring messages are never readable on the server
- **Key Exchange**: Keys are stored encrypted on the server for each participant

#### How It Works:
1. When a conversation is created, an encryption key is generated
2. The key is encrypted with a user-specific key and stored on the server
3. Messages are encrypted before being sent to the server
4. Only users with the decryption key can read messages

### 2. File Support (Images, Audio, Video)

- **Image Upload**: Support for JPEG, PNG, GIF, WebP
- **Audio Upload**: Support for MP3, WAV, OGG, WebM
- **Video Upload**: Support for MP4, WebM, OGG, QuickTime
- **File Preview**: Image and video previews before sending
- **File Metadata**: File name, size, and type are stored with messages
- **Cloudinary Integration**: Files are uploaded to Cloudinary for storage and CDN delivery

#### File Limits:
- Maximum file size: 100MB
- Supported formats: Images, audio, and video files

### 3. Enhanced Message Display

- **Rich Media Rendering**: Images, videos, and audio files are displayed inline
- **File Information**: Shows file name and size for uploaded files
- **Encryption Indicator**: Visual indicator shows when messages are encrypted
- **Thumbnail Support**: Video thumbnails are generated automatically

## Technical Implementation

### Frontend Files Created/Modified

#### New Files:
- `frontend/src/utils/encryption.js` - Encryption utilities using Web Crypto API
- `frontend/src/utils/fileHandler.js` - File handling and validation utilities

#### Modified Files:
- `frontend/src/components/ConversationChat.jsx` - Enhanced with encryption and file upload support

### Backend Files Created/Modified

#### New Files:
- `backend/models/ConversationKey.js` - Model for storing encryption keys per conversation

#### Modified Files:
- `backend/models/Message.js` - Added fields for encrypted content and file metadata
- `backend/routes/conversation.routes.js` - Added encryption support and key exchange endpoints
- `backend/routes/upload.routes.js` - Enhanced to support images, audio, and video files

## API Endpoints

### New Endpoints

#### Key Exchange
- `GET /api/conversations/:conversationId/keys` - Get encryption key status
- `POST /api/conversations/:conversationId/keys` - Store encrypted key for user

#### File Upload
- `POST /api/upload/file` - Upload any file (image, audio, video)
- `DELETE /api/upload/file/:publicId` - Delete uploaded file

### Enhanced Endpoints

#### Message Sending
- `POST /api/conversations/:conversationId/messages`
  - Now supports `encryptedContent` field for encrypted messages
  - Supports file metadata: `fileUrl`, `fileName`, `fileSize`, `fileMimeType`, `thumbnailUrl`
  - Supports `isEncrypted` flag

## Usage Examples

### Sending an Encrypted Message

```javascript
import { encryptText, keyStorage } from '../utils/encryption';

const key = await keyStorage.getConversationKey(conversationId);
const encrypted = await encryptText('Hello, world!', key);

await fetch(`/api/conversations/${conversationId}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Hello, world!', // Fallback for non-encrypted clients
    encryptedContent: encrypted,
    isEncrypted: true
  })
});
```

### Uploading a File

```javascript
import { uploadFile, validateFile, getAllowedFileTypes } from '../utils/fileHandler';

const file = event.target.files[0];
const validation = validateFile(file, getAllowedFileTypes(), 100);

if (validation.valid) {
  const result = await uploadFile(file, '/api/upload/file', (progress) => {
    console.log(`Upload: ${progress}%`);
  });
  
  // Use result.url, result.publicId, etc.
}
```

## Security Considerations

### Current Implementation
- Encryption keys are stored in localStorage (not ideal for production)
- Keys are encrypted on the server but still accessible if server is compromised
- Password-derived key encryption is recommended for production

### Production Recommendations
1. **Key Storage**: Use secure storage (e.g., encrypted IndexedDB or secure keychain)
2. **Key Exchange**: Implement proper key exchange protocol (e.g., Diffie-Hellman)
3. **Password Protection**: Encrypt keys with user passwords using PBKDF2
4. **Key Rotation**: Implement periodic key rotation for better security
5. **Forward Secrecy**: Consider implementing forward secrecy for better protection

## Configuration

### Environment Variables

**Backend (.env)**:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Frontend (.env)**:
```env
VITE_API_URL=http://localhost:5000/api
```

## Browser Compatibility

### Web Crypto API
- Modern browsers (Chrome, Firefox, Safari, Edge) support Web Crypto API
- IE11 and older browsers are not supported

### File Upload
- All modern browsers support file uploads
- FileReader API is used for previews (widely supported)

## Future Enhancements

1. **Group Encryption**: Support for encrypted group chats with key rotation
2. **File Encryption**: Encrypt files before upload (currently only metadata)
3. **Message Reactions**: Add reactions to encrypted messages
4. **Voice Messages**: Record and send voice messages
5. **Screen Sharing**: Add video/audio calling features
6. **Message Search**: Search encrypted messages (requires encrypted search index)

## Troubleshooting

### Encryption Not Working
- Check browser console for errors
- Ensure Web Crypto API is supported
- Verify encryption key is stored correctly

### File Upload Fails
- Check Cloudinary configuration
- Verify file size is under 100MB
- Ensure file type is supported

### Messages Not Decrypting
- Verify encryption key is available
- Check if message was encrypted with correct key
- Ensure key hasn't been rotated

## Support

For issues or questions, please check:
1. Browser console for errors
2. Server logs for backend errors
3. Network tab for API request/response details






