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
    console.log('openMenu called, current value:', menuTranslateX._value);
    gestureActions.setMenuOpen(true);
    
    menuTranslateX.setValue(-MENU_WIDTH);

    Animated.timing(menuTranslateX, { 
              toValue: 0, 
              duration: 300,
              useNativeDriver: true
          }).start((finished) => {
              console.log('Menu animation finished:', finished);
              console.log('Final animated value:', menuTranslateX._value);
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
            useNativeDriver: true
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
    const { translationX } = event.nativeEvent;
    if (translationX > 0) {
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
  activeOffsetX: [-10, 10],
  failOffsetY: [-5, 5],
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