// src/components/OfflineIndicator.js
// This component shows the offline queue status

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import offlineQueueService from '../services/offlineQueueService';
import NetInfo from '@react-native-community/netinfo';

const OfflineIndicator = () => {
  const [queueInfo, setQueueInfo] = useState({ queueSize: 0, items: [] });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Subscribe to queue changes
    const unsubscribe = offlineQueueService.subscribe(setQueueInfo);
    
    // Subscribe to network changes
    const netInfoUnsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => {
      unsubscribe();
      netInfoUnsubscribe();
    };
  }, []);

  if (isOnline && queueInfo.queueSize === 0) {
    return null; // Don't show anything when online and queue is empty
  }

  return (
    <View style={styles.container}>
      {!isOnline && (
        <View style={[styles.badge, styles.offlineBadge]}>
          <Text style={styles.badgeText}>📡 Offline</Text>
        </View>
      )}
      
      {queueInfo.queueSize > 0 && (
        <View style={[styles.badge, styles.queueBadge]}>
          <Text style={styles.badgeText}>
            💾 {queueInfo.queueSize} pending sync
          </Text>
          {isOnline && (
            <TouchableOpacity 
              onPress={() => offlineQueueService.processQueue()}
              style={styles.syncButton}
            >
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  offlineBadge: {
    backgroundColor: '#FF6B6B',
  },
  queueBadge: {
    backgroundColor: '#FFA500',
  },
  badgeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  syncButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
  },
  syncButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default OfflineIndicator;