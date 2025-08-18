import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import firebaseService from '../services/firebaseService';

const useShinnings = () => {
  const { state, actions } = useAppContext();
  const { user, currentView, sortBy } = state;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);

      const unsubscribe = firebaseService.subscribeToShinnings(
        user.uid,
        currentView,
        sortBy,
        (shinningsData) => {
          actions.setShinnings(shinningsData);
          setLoading(false);
        }
      );

      return unsubscribe;
    } else {
      actions.setShinnings([]);
      setLoading(false);
    }
  }, [user, currentView, sortBy]);

  return { shinnings: state.shinnings, loading };
};

export default useShinnings;