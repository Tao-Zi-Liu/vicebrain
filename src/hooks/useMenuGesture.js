import { useCallback } from 'react';
import { Dimensions } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MENU_WIDTH = SCREEN_WIDTH * 0.75;

export const useMenuGesture = (onMenuStateChange) => {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);  // This stores the starting position
  
  const openMenu = useCallback(() => {
    translateX.value = withSpring(MENU_WIDTH);
    if (onMenuStateChange) onMenuStateChange(true);
  }, []);

  const closeMenu = useCallback(() => {
    translateX.value = withSpring(0);
    if (onMenuStateChange) onMenuStateChange(false);
  }, []);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      // Capture the current position when gesture starts
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      'worklet';
      // Check if starting from edge (within 50 pixels)
      const isEdgeSwipe = event.absoluteX - event.translationX < 50;
      const menuIsOpen = startX.value > 0;
      
      if (isEdgeSwipe && startX.value === 0) {
        // Opening gesture from left edge
        translateX.value = Math.max(0, Math.min(event.translationX, MENU_WIDTH));
      } else if (menuIsOpen) {
        // Closing or adjusting open menu
        const newValue = startX.value + event.translationX;
        translateX.value = Math.max(0, Math.min(newValue, MENU_WIDTH));
      }
    })
    .onEnd(() => {
      'worklet';
      const shouldOpen = translateX.value > MENU_WIDTH / 2;
      
      if (shouldOpen) {
        translateX.value = withSpring(MENU_WIDTH);
        runOnJS(onMenuStateChange)(true);
      } else {
        translateX.value = withSpring(0);
        runOnJS(onMenuStateChange)(false);
      }
    });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  return {
    panGesture,
    contentStyle,
    openMenu,
    closeMenu,
    translateX
  };
};