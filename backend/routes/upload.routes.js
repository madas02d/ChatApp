import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import multer from 'multer';
import cloudinary from 'cloudinary';
import { v2 as cloudinaryV2 } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure .env is loaded (in case this module is loaded before server.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Allowed: images, audio, video'), false);
    }
  }
});

// Helper function to check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  // Debug logging (only log first time to avoid spam)
  if (!isCloudinaryConfigured._logged) {
    console.log('🔍 Checking Cloudinary configuration...');
    console.log('   CLOUDINARY_CLOUD_NAME:', cloudName ? `${cloudName.substring(0, 4)}...` : 'NOT SET');
    console.log('   CLOUDINARY_API_KEY:', apiKey ? `${apiKey.substring(0, 4)}...` : 'NOT SET');
    console.log('   CLOUDINARY_API_SECRET:', apiSecret ? 'SET (hidden)' : 'NOT SET');
    isCloudinaryConfigured._logged = true;
  }
  
  return !!(
    cloudName &&
    apiKey &&
    apiSecret &&
    typeof cloudName === 'string' &&
    typeof apiKey === 'string' &&
    typeof apiSecret === 'string' &&
    cloudName.trim() !== '' &&
    apiKey.trim() !== '' &&
    apiSecret.trim() !== ''
  );
};

// Configure Cloudinary only if all required env vars are present
if (isCloudinaryConfigured()) {
  try {
    cloudinaryV2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('✅ Cloudinary configured successfully');
  } catch (error) {
    console.error('❌ Error configuring Cloudinary:', error.message);
  }
} else {
  console.warn('⚠️  Cloudinary not configured - file uploads will use base64 fallback');
  console.warn('   Make sure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in your .env file');
}

// Upload file (image, audio, or video) to Cloudinary
router.post('/file', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      console.warn('Cloudinary not configured - returning error before upload attempt');
      return res.status(503).json({ 
        error: 'File upload service not configured. Please contact administrator.',
        requiresCloudinary: true
      });
    }

    const file = req.file;
    const fileType = file.mimetype.split('/')[0]; // image, audio, or video
    const folder = `chat-app-${fileType}s`;
    const publicId = `${fileType}-${req.user._id}-${Date.now()}`;

    // Convert buffer to base64
    const base64String = file.buffer.toString('base64');
    const dataURI = `data:${file.mimetype};base64,${base64String}`;

    let uploadOptions = {
      folder: folder,
      public_id: publicId,
      resource_type: fileType === 'video' ? 'video' : fileType === 'audio' ? 'video' : 'image',
      format: fileType === 'audio' ? 'mp3' : undefined, // Cloudinary treats audio as video
    };

    // Apply transformations based on file type
    if (fileType === 'image') {
      uploadOptions.transformation = [
        { quality: 'auto', fetch_format: 'auto' }
      ];
    } else if (fileType === 'video') {
      uploadOptions.transformation = [
        { quality: 'auto', fetch_format: 'auto' }
      ];
      uploadOptions.eager = [
        { width: 300, height: 300, crop: 'fill', format: 'jpg' }
      ];
    }

    // Upload to Cloudinary
    const result = await cloudinaryV2.uploader.upload(dataURI, uploadOptions);

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      fileType: fileType,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      thumbnailUrl: result.eager && result.eager[0] ? result.eager[0].secure_url : null
    });

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      http_code: error.http_code
    });
    
    // Check if it's an authentication/configuration error
    if (error.message && (
      error.message.includes('Invalid api_key') || 
      error.message.includes('api_key') || 
      error.message.includes('Must supply') ||
      error.http_code === 401 ||
      error.http_code === 400
    )) {
      return res.status(503).json({ 
        error: 'Cloudinary authentication failed. Please check your Cloudinary API credentials in the backend .env file (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).',
        requiresCloudinary: true,
        details: 'Cloudinary API authentication error - invalid credentials'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to upload file: ' + error.message 
    });
  }
});

// Upload image to Cloudinary (backward compatibility)
router.post('/image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      console.warn('Cloudinary not configured - returning error before upload attempt');
      return res.status(503).json({ 
        error: 'Image upload service not configured. Please contact administrator or use base64 fallback.',
        requiresCloudinary: true
      });
    }

    // Convert buffer to base64
    const base64String = req.file.buffer.toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${base64String}`;

    // Upload to Cloudinary with simplified transformation format
    const result = await cloudinaryV2.uploader.upload(dataURI, {
      folder: 'chat-app-avatars',
      public_id: `user-${req.user._id}-${Date.now()}`,
      width: 300,
      height: 300,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      fetch_format: 'auto'
    });

    res.json({
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id
    });

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    
    // Check if it's a configuration error
    if (error.message.includes('api_key') || error.message.includes('Must supply')) {
      return res.status(503).json({ 
        error: 'Cloudinary configuration error. Please check your .env file has CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET set correctly.',
        requiresCloudinary: true,
        details: 'Configuration issue detected'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to upload image: ' + error.message 
    });
  }
});

// Delete file from Cloudinary
router.delete('/file/:publicId', auth, async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query; // image, video, or raw

    if (!isCloudinaryConfigured()) {
      return res.status(503).json({ 
        error: 'Cloudinary not configured' 
      });
    }

    const result = await cloudinaryV2.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    
    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Cloudinary delete error:', error);
    res.status(500).json({ 
      error: 'Failed to delete file: ' + error.message 
    });
  }
});

// Delete image from Cloudinary (backward compatibility)
router.delete('/image/:publicId', auth, async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!isCloudinaryConfigured()) {
      return res.status(503).json({ 
        error: 'Cloudinary not configured' 
      });
    }

    const result = await cloudinaryV2.uploader.destroy(publicId);
    
    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Cloudinary delete error:', error);
    res.status(500).json({ 
      error: 'Failed to delete image: ' + error.message 
    });
  }
});

export default router;
