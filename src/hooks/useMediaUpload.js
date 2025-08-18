import { useState } from 'react';
import firebaseService from '../services/firebaseService';
import { useAppContext } from '../context/AppContext';

const useMediaUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { state, actions } = useAppContext();

  const uploadMedia = async (file, type) => {
    if (!state.user) {
      throw new Error('User not authenticated');
    }

    try {
      setUploading(true);
      setProgress(0);

      const result = await firebaseService.uploadFile(state.user.uid, file, type);

      setProgress(100);
      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      actions.showToast('上传失败，请重试', 'ERROR');
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return {
    uploading,
    progress,
    uploadMedia
  };
};

export default useMediaUpload;