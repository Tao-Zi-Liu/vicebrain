import React, { createContext, useContext, useReducer } from 'react';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75;

const initialGestureState = {
  // Menu state
  isMenuOpen: false,
  menuTranslateX: -MENU_WIDTH,
  
  // Screen navigation
  currentScreen: 'main',
  isTransitioning: false,
  canNavigateBack: false,
  
  // General gesture state
  isGestureActive: false,
  activeSwipeableId: null
};

const gestureActionTypes = {
  SET_MENU_OPEN: 'SET_MENU_OPEN',
  SET_MENU_TRANSLATE_X: 'SET_MENU_TRANSLATE_X',
  SET_CURRENT_SCREEN: 'SET_CURRENT_SCREEN',
  SET_TRANSITIONING: 'SET_TRANSITIONING',
  SET_CAN_NAVIGATE_BACK: 'SET_CAN_NAVIGATE_BACK',
  SET_GESTURE_ACTIVE: 'SET_GESTURE_ACTIVE',
  SET_ACTIVE_SWIPEABLE: 'SET_ACTIVE_SWIPEABLE'
};

const gestureReducer = (state, action) => {
  switch (action.type) {
    case gestureActionTypes.SET_MENU_OPEN:
      return { ...state, isMenuOpen: action.payload };
    
    case gestureActionTypes.SET_MENU_TRANSLATE_X:
      return { ...state, menuTranslateX: action.payload };
    
    case gestureActionTypes.SET_CURRENT_SCREEN:
      return { ...state, currentScreen: action.payload };
    
    case gestureActionTypes.SET_TRANSITIONING:
      return { ...state, isTransitioning: action.payload };
    
    case gestureActionTypes.SET_CAN_NAVIGATE_BACK:  
      return { ...state, canNavigateBack: action.payload };
    
    case gestureActionTypes.SET_GESTURE_ACTIVE:
      return { ...state, isGestureActive: action.payload };
    
    case gestureActionTypes.SET_ACTIVE_SWIPEABLE:
      return { ...state, activeSwipeableId: action.payload };
    
    default:
      return state;
  }
};

const GestureContext = createContext();

export const GestureProvider = ({ children }) => {
  const [gestureState, dispatch] = useReducer(gestureReducer, initialGestureState);

  const gestureActions = {
    setMenuOpen: (isOpen) => dispatch({ type: gestureActionTypes.SET_MENU_OPEN, payload: isOpen }),
    setMenuTranslateX: (value) => dispatch({ type: gestureActionTypes.SET_MENU_TRANSLATE_X, payload: value }),
    setCurrentScreen: (screen) => dispatch({ type: gestureActionTypes.SET_CURRENT_SCREEN, payload: screen }),
    setTransitioning: (isTransitioning) => dispatch({ type: gestureActionTypes.SET_TRANSITIONING, payload: isTransitioning }),
    setCanNavigateBack: (canNavigate) => dispatch({ type: gestureActionTypes.SET_CAN_NAVIGATE_BACK, payload: canNavigate }),
    setGestureActive: (isActive) => dispatch({ type: gestureActionTypes.SET_GESTURE_ACTIVE, payload: isActive }),
    setActiveSwipeable: (id) => dispatch({ type: gestureActionTypes.SET_ACTIVE_SWIPEABLE, payload: id })
  };

  return (
    <GestureContext.Provider value={{ gestureState, gestureActions, MENU_WIDTH }}>
      {children}
    </GestureContext.Provider>
  );
};

export const useGestureContext = () => {
  const context = useContext(GestureContext);
  if (!context) {
    throw new Error('useGestureContext must be used within a GestureProvider');
  }
  return context;
};

export { gestureActionTypes };