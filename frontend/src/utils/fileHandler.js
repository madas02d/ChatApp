/**
 * File Handling Utilities
 * Handles file uploads, validation, and preview
 */

/**
 * Validate file type and size
 * @param {File} file - The file to validate
 * @param {string[]} allowedTypes - Allowed MIME types
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {{valid: boolean, error?: string}}
 */
export function validateFile(file, allowedTypes = [], maxSizeMB = 50) {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Get file type category (image, audio, video, other)
 * @param {File} file - The file to categorize
 * @returns {string}
 */
export function getFileType(file) {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  return 'other';
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get allowed file types for upload
 * @param {string} category - 'image', 'audio', 'video', or 'all'
 * @returns {string[]}
 */
export function getAllowedFileTypes(category = 'all') {
  const types = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'],
    video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    all: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
    ],
  };

  return types[category] || types.all;
}

/**
 * Create a preview URL for an image
 * @param {File} file - The image file
 * @returns {Promise<string>}
 */
export function createImagePreview(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Create a preview URL for a video
 * @param {File} file - The video file
 * @returns {Promise<string>}
 */
export function createVideoPreview(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('video/')) {
      reject(new Error('File is not a video'));
      return;
    }

    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.currentTime = 1; // Seek to 1 second for thumbnail

    video.onloadedmetadata = () => {
      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL());
        URL.revokeObjectURL(url);
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to create video preview'));
    };
  });
}

/**
 * Read file as base64
 * @param {File} file - The file to read
 * @returns {Promise<string>}
 */
export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload file to server
 * @param {File} file - The file to upload
 * @param {string} apiEndpoint - The API endpoint
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<{url: string, publicId?: string}>}
 */
export async function uploadFile(file, apiEndpoint, onProgress) {
  const formData = new FormData();
  formData.append('file', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error || 'Upload failed'));
        } catch {
          reject(new Error('Upload failed'));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.open('POST', apiEndpoint);
    xhr.withCredentials = true;
    xhr.send(formData);
  });
}


