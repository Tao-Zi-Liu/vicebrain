import { useCallback, useRef, useState } from 'react';
import firebaseService from '../services/firebaseService';
import { useAppContext } from '../context/AppContext';

const useAutoSave = (shinningId, delay = 2000) => {
  const { state, actions } = useAppContext();
  const { user } = state;
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedRef = useRef(null);
  const timeoutRef = useRef(null);

  const autoSave = useCallback((data) => {
    if (!user || !shinningId || !data.title && !data.content) return;

    const contentHash = JSON.stringify(data);
    if (lastSavedRef.current === contentHash) {
      return; // Content hasn't changed
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        console.log('Auto-saving now...');
        
        await firebaseService.updateShinning(user.uid, shinningId, data);
        lastSavedRef.current = contentHash;
        
        console.log('Auto-save completed');
        
        // Keep isSaving true for a moment so UI can show "Saving..."
        setTimeout(() => {
          setIsSaving(false);
        }, 500);
      } catch (error) {
        console.error('Auto-save failed:', error);
        actions.showToast('Failed to auto-save', 'ERROR');
        setIsSaving(false);
      }
    }, delay);
  }, [user, shinningId, delay, actions]);

  return { autoSave, isSaving };
};

export default useAutoSave;