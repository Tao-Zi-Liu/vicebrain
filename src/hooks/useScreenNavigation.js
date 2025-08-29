import { useRef, useCallback } from 'react';
import { Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const useScreenNavigation = () => {
  const screenTransition = useRef(new Animated.Value(0)).current;

  const navigateToScreen = useCallback((onComplete) => {
    Animated.timing(screenTransition, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onComplete) onComplete();
    });
  }, [screenTransition]);

  const navigateBack = useCallback((onComplete) => {
    Animated.timing(screenTransition, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onComplete) onComplete();
    });
  }, [screenTransition]);

  const getScreenStyles = () => ({
    mainScreen: {
      opacity: screenTransition.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
      }),
      transform: [{
        translateX: screenTransition.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -width / 4],
        })
      }]
    },
    detailScreen: {
      transform: [{
        translateX: screenTransition.interpolate({
          inputRange: [0, 1],
          outputRange: [width, 0],
        })
      }]
    }
  });

  return {
    screenTransition,
    navigateToScreen,
    navigateBack,
    getScreenStyles
  };
};

export default useScreenNavigation;