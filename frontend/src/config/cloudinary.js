import { Cloudinary } from '@cloudinary/url-gen';

const cld = new Cloudinary({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your_cloud_name'
  }
});

// Helper function to upload images
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  return response.json();
};

// Helper function to get optimized image URL
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const {
    width = 300,
    height = 300,
    crop = 'fill',
    quality = 'auto',
    format = 'auto'
  } = options;

  return cld.image(publicId)
    .resize(crop, width, height)
    .quality(quality)
    .format(format)
    .toURL();
};

export default cld;
