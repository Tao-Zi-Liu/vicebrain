import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY_PREFIX = 'draft_';

const useDraftSystem = (shinningId) => {
  const [hasDraft, setHasDraft] = useState(false);
  const draftKey = `${DRAFT_KEY_PREFIX}${shinningId || 'new'}`;

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, [shinningId]);

  const loadDraft = async () => {
    try {
      const draft = await AsyncStorage.getItem(draftKey);
      if (draft) {
        setHasDraft(true);
        return JSON.parse(draft);
      }
      return null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  };

  const saveDraft = useCallback(async (data) => {
    try {
      await AsyncStorage.setItem(draftKey, JSON.stringify({
        ...data,
        savedAt: new Date().toISOString()
      }));
      setHasDraft(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [draftKey]);

  const clearDraft = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(draftKey);
      setHasDraft(false);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [draftKey]);

  const getAllDrafts = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const draftKeys = keys.filter(key => key.startsWith(DRAFT_KEY_PREFIX));
      const drafts = await AsyncStorage.multiGet(draftKeys);
      
      return drafts.map(([key, value]) => ({
        id: key.replace(DRAFT_KEY_PREFIX, ''),
        ...JSON.parse(value)
      }));
    } catch (error) {
      console.error('Failed to get all drafts:', error);
      return [];
    }
  };

  return {
    hasDraft,
    loadDraft,
    saveDraft,
    clearDraft,
    getAllDrafts
  };
};

export default useDraftSystem;