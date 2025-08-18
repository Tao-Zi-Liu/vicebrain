// src/components/ListItem.js - UPDATED

import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, TouchableOpacity } from 'react-native';
import { Swipeable, State } from 'react-native-gesture-handler';

// Helper functions and Icon components remain the same
const timeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const seconds = Math.floor((now - timestamp.toDate()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
};
const EditIcon = () => (<Text style={styles.iconTextSm}>✏️</Text>);
const ArchiveIcon = () => (<Text style={styles.iconTextSm}>📦</Text>);
const TrashIcon = () => (<Text style={styles.iconTextSm}>🗑️</Text>);
const RestoreIcon = () => (<Text style={styles.iconTextSm}>♻️</Text>);

// --- KEY CHANGE 1: Accept the new flingGestureHandlerRef prop ---
const ListItem = ({
    item, onSelectShinning, onSetStatus, onDeletePermanently, onOpenEditModal,
    currentView, isMenuVisible, onSwipeableOpen, flingGestureHandlerRef
}) => {
    const swipeableRef = useRef(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const closeSwipeable = () => swipeableRef.current?.close();
    const onSwipeableDragStart = () => Animated.spring(scaleAnim, { toValue: 1.02, useNativeDriver: true }).start();
    const onSwipeableDragEnd = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

    // The renderRightActions function remains exactly the same
    const renderRightActions = (progress) => {
        let actions = [];
        if (currentView === 'home') {
            actions = [
                { key: 'edit', color: '#228BE6', icon: <EditIcon />, onPress: () => { closeSwipeable(); onOpenEditModal(item); } },
                { key: 'archive', color: '#FAB005', icon: <ArchiveIcon />, onPress: () => { closeSwipeable(); onSetStatus(item.id, 'archived'); } },
                { key: 'trash', color: '#FA5252', icon: <TrashIcon />, onPress: () => { closeSwipeable(); onSetStatus(item.id, 'trashed'); } }
            ];
        } else if (currentView === 'archive') {
             actions = [
                { key: 'restore', color: '#20C997', icon: <RestoreIcon />, onPress: () => { closeSwipeable(); onSetStatus(item.id, 'active'); } },
                { key: 'trash', color: '#FA5252', icon: <TrashIcon />, onPress: () => { closeSwipeable(); onSetStatus(item.id, 'trashed'); } }
            ];
        } else if (currentView === 'trash') {
            actions = [
                { key: 'restore', color: '#20C997', icon: <RestoreIcon />, onPress: () => { closeSwipeable(); onSetStatus(item.id, 'active'); } },
                { key: 'delete', color: '#FA5252', icon: <TrashIcon />, onPress: () => { closeSwipeable(); onDeletePermanently(item.id); } }
            ];
        }

        if (currentView === 'home') {
            const [editAction, archiveAction, trashAction] = actions;
            const scale1 = progress.interpolate({ inputRange: [0, 1/3], outputRange: [0.6, 1], extrapolate: 'clamp' });
            const scale2 = progress.interpolate({ inputRange: [1/3, 2/3], outputRange: [0.6, 1], extrapolate: 'clamp' });
            const scale3 = progress.interpolate({ inputRange: [2/3, 1], outputRange: [0.6, 1], extrapolate: 'clamp' });

            return (
                <View style={styles.swipeActionContainerTriangle}>
                    <Animated.View style={{ transform: [{ scale: scale1 }] }}>
                        <TouchableOpacity style={[styles.swipeButton, { backgroundColor: editAction.color }]} onPress={editAction.onPress}>
                            {editAction.icon}
                        </TouchableOpacity>
                    </Animated.View>
                    <View style={{ flexDirection: 'row' }}>
                        <Animated.View style={{ transform: [{ scale: scale2 }] }}>
                            <TouchableOpacity style={[styles.swipeButton, { backgroundColor: archiveAction.color }]} onPress={archiveAction.onPress}>
                                {archiveAction.icon}
                            </TouchableOpacity>
                        </Animated.View>
                        <Animated.View style={{ transform: [{ scale: scale3 }] }}>
                            <TouchableOpacity style={[styles.swipeButton, { backgroundColor: trashAction.color }]} onPress={trashAction.onPress}>
                                {trashAction.icon}
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.swipeActionContainerRow}>
                {actions.map((action, index) => {
                    const scale = progress.interpolate({
                        inputRange: [index / actions.length, (index + 1) / actions.length],
                        outputRange: [0.8, 1],
                        extrapolate: 'clamp',
                    });
                    return (
                        <Animated.View key={action.key} style={{ transform: [{ scale }] }}>
                            <TouchableOpacity style={[styles.swipeButton, { backgroundColor: action.color }]} onPress={action.onPress}>
                                {action.icon}
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}
            </View>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            enabled={!isMenuVisible}
            renderRightActions={renderRightActions}
            overshootRight={false}
            onSwipeableWillOpen={() => onSwipeableOpen(item.id, swipeableRef)}
            onSwipeableOpen={onSwipeableDragEnd}
            onSwipeableClose={onSwipeableDragEnd}
            onHandlerStateChange={({ nativeEvent }) => {
                if (nativeEvent.state === State.BEGAN) {
                    onSwipeableDragStart();
                }
            }}
            // --- KEY CHANGE 2: Tell this component to cooperate with the main swipe gesture ---
            simultaneousHandlers={flingGestureHandlerRef}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }], ...styles.cardShadow }}>
                <Pressable onPress={() => onSelectShinning(item)}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardContent} numberOfLines={2}>{item.content}</Text>
                        <View style={styles.tagsContainer}>{item.tags?.map(tag => <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>)}</View>
                        <Text style={styles.timestampText}>Updated {timeAgo(item.updatedAt)}</Text>
                    </View>
                </Pressable>
            </Animated.View>
        </Swipeable>
    );
};

// Styles remain the same
const styles = StyleSheet.create({
  card: { backgroundColor: 'white', padding: 16, marginHorizontal: 16, marginBottom: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E9ECEF' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 4 },
  cardContent: { fontSize: 14, color: '#495057', lineHeight: 20 },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  tag: { backgroundColor: '#E9ECEF', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, marginRight: 8, marginBottom: 8 },
  tagText: { color: '#495057', fontSize: 12 },
  timestampText: { fontSize: 12, color: '#ADB5BD', marginTop: 8 },
  iconTextSm: { fontSize: 16, color: 'white' },
  swipeActionContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  swipeActionContainerTriangle: {
    width: 80,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 5,
  },
  swipeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 3,
  },
});
export default ListItem;