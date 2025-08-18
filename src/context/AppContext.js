import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebaseService';

const initialState = {
  user: null,
  userProfile: null,
  initializing: true,
  
  currentView: 'home',
  selectedShinning: null,
  
  isMenuVisible: false,
  loading: false,
  toast: { visible: false, message: '', type: '' },
  
  modals: {
    add: false,
    ai: false,
    filter: false,
    link: false,
    profile: false
  },
  
  shinnings: [],
  sortBy: { field: 'updatedAt', direction: 'desc' },
  searchQuery: '',
  
  isAILoading: false,
  aiError: null,
  
  linkedData: { backlinks: [], outgoingLinks: [] }
};

const actionTypes = {
  SET_USER: 'SET_USER',
  SET_USER_PROFILE: 'SET_USER_PROFILE',
  SET_INITIALIZING: 'SET_INITIALIZING',
  
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW',
  SET_SELECTED_SHINNING: 'SET_SELECTED_SHINNING',
  
  SET_MENU_VISIBLE: 'SET_MENU_VISIBLE',
  SET_LOADING: 'SET_LOADING',
  SHOW_TOAST: 'SHOW_TOAST',
  HIDE_TOAST: 'HIDE_TOAST',
  
  TOGGLE_MODAL: 'TOGGLE_MODAL',
  
  SET_SHINNINGS: 'SET_SHINNINGS',
  SET_SORT_BY: 'SET_SORT_BY',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  
  SET_AI_LOADING: 'SET_AI_LOADING',
  SET_AI_ERROR: 'SET_AI_ERROR',
  
  SET_LINKED_DATA: 'SET_LINKED_DATA'
};

const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_USER:
      return { ...state, user: action.payload };
    
    case actionTypes.SET_USER_PROFILE:
      return { ...state, userProfile: action.payload };
    
    case actionTypes.SET_INITIALIZING:
      return { ...state, initializing: action.payload };
    
    case actionTypes.SET_CURRENT_VIEW:
      return { ...state, currentView: action.payload };
    
    case actionTypes.SET_SELECTED_SHINNING:
      return { ...state, selectedShinning: action.payload };
    
    case actionTypes.SET_MENU_VISIBLE:
      return { ...state, isMenuVisible: action.payload };
    
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case actionTypes.SHOW_TOAST:
      return { 
        ...state, 
        toast: { 
          visible: true, 
          message: action.payload.message, 
          type: action.payload.type || 'SUCCESS' 
        } 
      };
    
    case actionTypes.HIDE_TOAST:
      return { ...state, toast: { ...state.toast, visible: false } };
    
    case actionTypes.TOGGLE_MODAL:
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.modalName]: action.payload.isVisible
        }
      };
    
    case actionTypes.SET_SHINNINGS:
      return { ...state, shinnings: action.payload };
    
    case actionTypes.SET_SORT_BY:
      return { ...state, sortBy: action.payload };
    
    case actionTypes.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload };
    
    case actionTypes.SET_AI_LOADING:
      return { ...state, isAILoading: action.payload };
    
    case actionTypes.SET_AI_ERROR:
      return { ...state, aiError: action.payload };
    
    case actionTypes.SET_LINKED_DATA:
      return { ...state, linkedData: action.payload };
    
    default:
      return state;
  }
};

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      dispatch({ type: actionTypes.SET_USER, payload: user });
      if (state.initializing) {
        dispatch({ type: actionTypes.SET_INITIALIZING, payload: false });
      }
    });
    return unsubscribe;
  }, []);

useEffect(() => {
  if (state.user) {
    const isGuest = state.user.isAnonymous;
    const userDocRef = doc(db, 'users', state.user.uid);

    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        
        const completeUserProfile = {
          accountType: userData.accountType || 'free',
          aiCredits: userData.aiCredits !== undefined ? userData.aiCredits : 10,
          createdAt: userData.createdAt || new Date(),
          displayName: userData.displayName || state.user.displayName || 'Anonymous User',
          email: userData.email || state.user.email || '',
          photoURL: userData.photoURL || state.user.photoURL || '',
          ...userData
        };
        
        dispatch({ type: actionTypes.SET_USER_PROFILE, payload: completeUserProfile });
        
        const missingFields = {};
        if (!userData.accountType) missingFields.accountType = 'free';
        if (userData.aiCredits === undefined) missingFields.aiCredits = 10;
        if (!userData.createdAt) missingFields.createdAt = new Date();
        
        if (Object.keys(missingFields).length > 0) {
          updateDoc(userDocRef, {
            ...missingFields,
            updatedAt: new Date()
          }).catch(error => {
            console.error('Failed to update user profile with missing fields:', error);
          });
        }
      } else {
        const defaultProfile = {
          aaccountType: isGuest ? 'guest' : 'free',
          aiCredits: isGuest ? 3 : 10, 
          createdAt: new Date(),
          displayName: isGuest ? 'Guest User' : (state.user.displayName || 'Anonymous User'),
          email: state.user.email || '',
          photoURL: state.user.photoURL || ''
        };
        
        dispatch({ type: actionTypes.SET_USER_PROFILE, payload: defaultProfile });
        
        setDoc(userDocRef, defaultProfile).catch(error => {
          console.error('Failed to create user profile:', error);
        });
      }
    });
    return unsubscribe;
  }
}, [state.user]);

  const actions = {
    setUser: (user) => dispatch({ type: actionTypes.SET_USER, payload: user }),
    setUserProfile: (profile) => dispatch({ type: actionTypes.SET_USER_PROFILE, payload: profile }),
    
    setCurrentView: (view) => dispatch({ type: actionTypes.SET_CURRENT_VIEW, payload: view }),
    setSelectedShinning: (shinning) => dispatch({ type: actionTypes.SET_SELECTED_SHINNING, payload: shinning }),
    
    setMenuVisible: (visible) => dispatch({ type: actionTypes.SET_MENU_VISIBLE, payload: visible }),
    setLoading: (loading) => dispatch({ type: actionTypes.SET_LOADING, payload: loading }),
    showToast: (message, type = 'SUCCESS') => dispatch({ 
      type: actionTypes.SHOW_TOAST, 
      payload: { message, type } 
    }),
    hideToast: () => dispatch({ type: actionTypes.HIDE_TOAST }),
    
    toggleModal: (modalName, isVisible) => dispatch({
      type: actionTypes.TOGGLE_MODAL,
      payload: { modalName, isVisible }
    }),
    
    setShinnings: (shinnings) => dispatch({ type: actionTypes.SET_SHINNINGS, payload: shinnings }),
    setSortBy: (sortBy) => dispatch({ type: actionTypes.SET_SORT_BY, payload: sortBy }),
    setSearchQuery: (query) => dispatch({ type: actionTypes.SET_SEARCH_QUERY, payload: query }),
    
    setAILoading: (loading) => dispatch({ type: actionTypes.SET_AI_LOADING, payload: loading }),
    setAIError: (error) => dispatch({ type: actionTypes.SET_AI_ERROR, payload: error }),
    
    setLinkedData: (data) => dispatch({ type: actionTypes.SET_LINKED_DATA, payload: data })
  };

  return (
    <AppContext.Provider value={{ state, actions, actionTypes }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export { actionTypes };