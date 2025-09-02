import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { State } from 'react-native-gesture-handler';
import { useGestureContext } from '../context/GestureContext';
import { Directions } from 'react-native-gesture-handler';
import {useMemo } from 'react';

const useGestureManager = () => {
  const { gestureState, gestureActions, MENU_WIDTH } = useGestureContext();
  const menuTranslateX = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const lastPosition = useRef(-MENU_WIDTH);

  const openMenu = useCallback(() => {
    console.log('openMenu called, starting animation...');
    gestureActions.setMenuOpen(true);
    
    // Set starting position off-screen
    menuTranslateX.setValue(-MENU_WIDTH);
    
    Animated.timing(menuTranslateX, { 
      toValue: 0, 
      duration: 300,
      useNativeDriver: false  // Important: false to allow value reading
    }).start((finished) => {
      console.log('Menu animation finished:', finished);
      if (finished) {
        lastPosition.current = 0;
        gestureActions.setMenuTranslateX(0);
      }
    });
  }, [gestureActions, menuTranslateX, MENU_WIDTH]);

  const closeMenu = useCallback((onComplete) => {
    Animated.timing(menuTranslateX, { 
      toValue: -MENU_WIDTH, 
      duration: 300,
      useNativeDriver: false
    }).start(() => {
      lastPosition.current = -MENU_WIDTH;
      gestureActions.setMenuOpen(false);
      gestureActions.setMenuTranslateX(-MENU_WIDTH);
      if (typeof onComplete === 'function') {
        onComplete();
      }
    });
  }, [gestureActions, menuTranslateX, MENU_WIDTH]);

  const onGestureEvent = useCallback((event) => {
    const { translationX, absoluteX } = event.nativeEvent;
    
    // Only process right swipes that started from the left 30px of screen
    if (translationX > 0 && absoluteX < 30 && lastPosition.current === -MENU_WIDTH) {
        let newX = lastPosition.current + translationX;
        newX = Math.max(-MENU_WIDTH, Math.min(newX, 0));
        menuTranslateX.setValue(newX);
    }
    }, [menuTranslateX, MENU_WIDTH]);

  const onHandlerStateChange = useCallback((event) => {
    const { state: gestureState, translationX, velocityX } = event.nativeEvent;
    console.log('Handler state change:', {
      state: gestureState,
      translationX,
      velocityX,
      lastPosition: lastPosition.current
    });
    
    if (gestureState === State.END) {
      const finalPosition = lastPosition.current + translationX;
      const projectedPosition = finalPosition + 0.2 * velocityX;
      
      console.log('Gesture ended:', {
        finalPosition,
        projectedPosition,
        threshold: -MENU_WIDTH / 2,
        willOpenMenu: projectedPosition > -MENU_WIDTH / 2
      });
      
      if (projectedPosition > -MENU_WIDTH / 2) {
        console.log('Opening menu...');
        openMenu();
      } else {
        console.log('Closing menu...');
        closeMenu();
      }
    }
  }, [openMenu, closeMenu, MENU_WIDTH]);

  const createBackGestureHandler = useCallback((onBack) => {
    return {
      onHandlerStateChange: (event) => {
        const { state } = event.nativeEvent;
        if (state === State.ACTIVE && !gestureState.isMenuOpen) {
          onBack();
        }
      }
    };
  }, [gestureState.isMenuOpen]);

  const gestureConfig = useMemo(() => ({
    enableAndroid: true,
    enableIOS: true,
    shouldCancelWhenOutside: false,
    activeOffsetX: [-20, 20],
    failOffsetY: [-30, 30],
  }), []);

  return {
    // Animation refs
    menuTranslateX,
    
    // Menu controls
    openMenu,
    closeMenu,
    
    // Gesture handlers
    onGestureEvent,
    onHandlerStateChange,
    createBackGestureHandler,
    
    // Configuration
    gestureConfig,
     
    // State
    isMenuOpen: gestureState.isMenuOpen
  };
};

export default useGestureManager;