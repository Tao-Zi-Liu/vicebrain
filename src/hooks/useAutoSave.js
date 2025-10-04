import { useCallback, useEffect, useRef } from 'react';
import firebaseService from '../services/firebaseService';
import { useAppContext } from '../context/AppContext';

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const useAutoSave = (shinningId, delay = 2000) => {
  const { state, actions } = useAppContext();
  const { user } = state;
  const saveTimeoutRef = useRef(null);
  const lastSavedRef = useRef(null);
  const isSavingRef = useRef(false);

  const saveToFirebase = useCallback(async (data) => {
    if (!user || !shinningId || isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      
      // Check if content actually changed
      const contentHash = JSON.stringify(data);
      if (lastSavedRef.current === contentHash) {
        isSavingRef.current = false;
        return;
      }

      await firebaseService.updateShinning(user.uid, shinningId, data);
      lastSavedRef.current = contentHash;
      
      // Show subtle save indicator
      actions.showToast('Saved', 'SUCCESS');
    } catch (error) {
      console.error('Auto-save failed:', error);
      actions.showToast('Failed to auto-save', 'ERROR');
    } finally {
      isSavingRef.current = false;
    }
  }, [user, shinningId, actions]);

  const debouncedSave = useCallback(
    debounce((data) => {
      saveToFirebase(data);
    }, delay),
    [saveToFirebase, delay]
  );

  const autoSave = useCallback((data) => {
    if (!data.title && !data.content) return; // Don't save empty content
    debouncedSave(data);
  }, [debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return { autoSave, isSaving: isSavingRef.current };
};

export default useAutoSave;