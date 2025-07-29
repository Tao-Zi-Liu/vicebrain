import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';

const SplashScreen = () => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, [opacity]);

    return (
        <View style={styles.splashContainer}>
            <Animated.Text style={[styles.splashTitle, { opacity }]}>Vicebrain</Animated.Text>
        </View>
    );
};

const styles = StyleSheet.create({
  splashContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F8F9FA' 
  },
  splashTitle: { 
    fontSize: 48, 
    fontWeight: 'bold', 
    color: '#212529' 
  },
});

export default SplashScreen;