import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { useGestureContext } from '../context/GestureContext';

// Helper functions
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

const ListItem = ({
    item, onSelectShinning, onSetStatus, onDeletePermanently, onOpenEditModal,
    currentView, isMenuVisible, onSwipeableOpen, onSwipeableClose 
}) => {
    const translateX = useSharedValue(0);
    const scaleValue = useSharedValue(1);
    const [showActions, setShowActions] = useState(false);
    const swipeableRef = useRef({
        close: () => {
            translateX.value = withSpring(0);
            setShowActions(false);
        }
    });
    useEffect(() => {
        if (isMenuVisible && onSwipeableOpen) {
            onSwipeableOpen(item.id, swipeableRef.current);
        }
    }, [showActions]);

    const closeActions = () => {
        setShowActions(false);
        translateX.value = withSpring(0);
        if (onSwipeableClose) {
            onSwipeableClose();
        }
    };

    const handleNewSwipe = () => {
        if (onSwipeableOpen) {
            onSwipeableOpen(item.id, swipeableRef);
        }
    };

    const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 999])
    .failOffsetY([-10, 10])
    .shouldCancelWhenOutside(false)
    .onStart((event) => {
        'worklet';
        scaleValue.value = withSpring(1.02);
    })
    .onUpdate((event) => {
        'worklet';
        if (!isMenuVisible) {
            if (event.translationX < 0 && !showActions) {
                // Left swipe to open - existing logic unchanged
                translateX.value = Math.max(event.translationX, -80);
                
                if (event.translationX < -15) {
                    runOnJS(setShowActions)(true);
                    runOnJS(handleNewSwipe)();
                }
            } else if (event.translationX < 0 && showActions) {
                // Continue dragging left when already open
                translateX.value = Math.max(-80 + event.translationX, -80);
            } else if (event.translationX > 0 && showActions && event.absoluteX > 60) {
                // Right swipe to close - only if NOT starting from left edge
                // absoluteX > 60 ensures we're not interfering with menu gesture
                translateX.value = Math.min(0, -80 + event.translationX);
                
                if (event.translationX > 15) {
                    runOnJS(setShowActions)(false);
                }
            }
        }
    })
    .onEnd((event) => {
        'worklet';
        scaleValue.value = withSpring(1);
        
        if (showActions) {
            // Actions are open
            if (event.translationX > 20 && event.absoluteX > 60) {
                // Swiped right enough to close (not from edge)
                translateX.value = withSpring(0);
                runOnJS(setShowActions)(false);
                runOnJS(onSwipeableClose)();
            } else {
                // Not enough swipe or from edge - keep open
                translateX.value = withSpring(-80);
            }
        } else {
            // Actions are closed
            if (event.translationX < -30) {
                // Swiped left enough to open
                translateX.value = withSpring(-80);
                runOnJS(setShowActions)(true);
            } else {
                // Not enough swipe - keep closed
                translateX.value = withSpring(0);
            }
        }
    });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { scale: scaleValue.value }
        ]
    }));

    const getActions = () => {
        if (currentView === 'home') {
            return [
                { 
                    key: 'edit', 
                    color: '#228BE6', 
                    icon: <EditIcon />, 
                    onPress: () => { 
                        closeActions(); 
                        onOpenEditModal(item); 
                    } 
                },
                { 
                    key: 'archive', 
                    color: '#FAB005', 
                    icon: <ArchiveIcon />, 
                    onPress: () => { 
                        closeActions(); 
                        onSetStatus(item.id, 'archived'); 
                    } 
                },
                { 
                    key: 'trash', 
                    color: '#FA5252', 
                    icon: <TrashIcon />, 
                    onPress: () => { 
                        closeActions(); 
                        onSetStatus(item.id, 'trashed'); 
                    } 
                }
            ];
        } else if (currentView === 'archive') {
            return [
                { 
                    key: 'restore', 
                    color: '#20C997', 
                    icon: <RestoreIcon />, 
                    onPress: () => { 
                        closeActions(); 
                        onSetStatus(item.id, 'active'); 
                    } 
                },
                { 
                    key: 'trash', 
                    color: '#FA5252', 
                    icon: <TrashIcon />, 
                    onPress: () => { 
                        closeActions(); 
                        onSetStatus(item.id, 'trashed'); 
                    } 
                }
            ];
        } else if (currentView === 'trash') {
            return [
                { 
                    key: 'restore', 
                    color: '#20C997', 
                    icon: <RestoreIcon />, 
                    onPress: () => { 
                        closeActions(); 
                        onSetStatus(item.id, 'active'); 
                    } 
                },
                { 
                    key: 'delete', 
                    color: '#FA5252', 
                    icon: <TrashIcon />, 
                    onPress: () => { 
                        closeActions(); 
                        onDeletePermanently(item.id); 
                    } 
                }
            ];
        }
        return [];
    };

    return (
        <View style={styles.container}>
            <GestureDetector gesture={swipeGesture}>
                <Animated.View style={[styles.cardShadow, animatedStyle]}>
                    <Pressable 
                        onPress={() => {
                            if (showActions) {
                                closeActions();
                            } else {
                                onSelectShinning(item);
                            }
                        }}
                    >
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardContent} numberOfLines={2}>
                                {item.content}
                            </Text>
                            <View style={styles.tagsContainer}>
                                {item.tags?.map(tag => (
                                    <View key={tag} style={styles.tag}>
                                        <Text style={styles.tagText}>{tag}</Text>
                                    </View>
                                ))}
                            </View>
                            <Text style={styles.timestampText}>
                                Updated {timeAgo(item.updatedAt)}
                            </Text>
                        </View>
                    </Pressable>
                </Animated.View>
            </GestureDetector>

            {/* Action buttons */}
            {showActions && (
                <View style={currentView === 'home' ? styles.actionButtonsTriangle : styles.actionButtonsRow}>
                    {currentView === 'home' ? (
                        <>
                            <TouchableOpacity 
                                style={[styles.actionButton, { backgroundColor: getActions()[0].color }]} 
                                onPress={getActions()[0].onPress}
                            >
                                {getActions()[0].icon}
                            </TouchableOpacity>
                            <View style={styles.bottomRow}>
                                <TouchableOpacity 
                                    style={[styles.actionButton, { backgroundColor: getActions()[1].color, marginRight: 3 }]} 
                                    onPress={getActions()[1].onPress}
                                >
                                    {getActions()[1].icon}
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.actionButton, { backgroundColor: getActions()[2].color }]} 
                                    onPress={getActions()[2].onPress}
                                >
                                    {getActions()[2].icon}
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        getActions().map((action) => (
                            <TouchableOpacity 
                                key={action.key}
                                style={[styles.actionButton, { backgroundColor: action.color }]} 
                                onPress={action.onPress}
                            >
                                {action.icon}
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            )}

            {/* Overlay to close actions when tapping elsewhere */}
            {showActions && (
                <TouchableOpacity 
                    style={styles.overlay} 
                    onPress={closeActions}
                    activeOpacity={0}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 1,
    },
    card: { 
        backgroundColor: 'white', 
        padding: 16, 
        marginHorizontal: 16, 
        marginBottom: 16, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: '#E9ECEF' 
    },
    cardTitle: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: '#212529', 
        marginBottom: 4 
    },
    cardContent: { 
        fontSize: 14, 
        color: '#495057', 
        lineHeight: 20 
    },
    cardShadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
        zIndex: 2,
    },
    tagsContainer: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        marginTop: 10 
    },
    tag: { 
        backgroundColor: '#E9ECEF', 
        borderRadius: 12, 
        paddingVertical: 4, 
        paddingHorizontal: 10, 
        marginRight: 8, 
        marginBottom: 8 
    },
    tagText: { 
        color: '#495057', 
        fontSize: 12 
    },
    timestampText: { 
        fontSize: 12, 
        color: '#ADB5BD', 
        marginTop: 8 
    },
    iconTextSm: { 
        fontSize: 16, 
        color: 'white' 
    },
    actionButtonsTriangle: {
        position: 'absolute',
        right: 10,
        top: 0,
        bottom: 0,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        width: 70,
    },
    bottomRow: {
        flexDirection: 'row',
        marginTop: 3,
    },
    actionButtonsRow: {
        position: 'absolute',
        right: 16,
        top: 0,
        bottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    actionButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 30,
        height: 30,
        borderRadius: 15,
        marginLeft: 3,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
    },
});

export default ListItem;