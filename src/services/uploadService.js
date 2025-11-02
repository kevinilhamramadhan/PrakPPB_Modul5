import { apiClient, BASE_URL } from '../config/api';
import axios from 'axios';

class UploadService {
  /**
   * Upload recipe image to MinIO
   * @param {File} file - Image file to upload
   * @returns {Promise}
   */
  async uploadImage(file) {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Allowed: .jpg, .jpeg, .png, .webp');
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit');
      }

      formData.append('image', file);
  // Create form data
  const formData = new FormData();

      // Upload to server
      // Some backends expect multipart at /api/v1/upload or /upload — keep using /api/v1/upload
      // Use axios directly because apiClient has JSON content-type; set explicit headers
      const response = await axios.post(`${BASE_URL.replace(/\/$/, '')}/api/v1/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds for upload
      });

      // normalize to { success, data, message }
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new UploadService();
