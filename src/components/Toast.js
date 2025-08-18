// src/components/Toast.js - CORRECTED

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const Toast = ({ message, type, onHide }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // This effect should only run when the message changes, not on every render.
    // A check for the message ensures the animation doesn't re-trigger unnecessarily.
    if (message) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(2500),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // KEY CHANGE: Defer the onHide call to the next event loop tick.
        setTimeout(onHide, 0);
      });
    }
  }, [message]);

  const backgroundColor = type === 'SUCCESS' ? '#28a745' : '#dc3545';
  const icon = type === 'SUCCESS' ? '✓' : '✕';

  return (
    <Animated.View style={[
      styles.toastOverlay,
      { opacity }
    ]}>
      <Animated.View style={[
        styles.toast,
        { backgroundColor },
        { transform: [{ scale }] }
      ]}>
        <Text style={styles.toastIcon}>{icon}</Text>
        <Text style={styles.toastText}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    maxWidth: '80%',
  },
  toastIcon: {
    color: 'white',
    marginRight: 12,
    fontSize: 20,
    fontWeight: 'bold'
  },
  toastText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
  },
});

export default Toast;