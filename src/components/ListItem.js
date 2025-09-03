// src/components/ListItem.js - FIXED THRESHOLDS VERSION

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, TouchableOpacity, PanResponder } from 'react-native';
import { useGestureContext } from '../context/GestureContext';

// Helper functions and Icon components
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
    currentView, isMenuVisible, onSwipeableOpen,onSwipeableClose 
}) => {
    const { gestureState } = useGestureContext();
    const swipeableRef = useRef(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const [showActions, setShowActions] = useState(false);

    useEffect(() => {
    // Close item actions when main menu is opened
        if (isMenuVisible && showActions) {
            closeActions();
        }
    }, [isMenuVisible]);

    const closeActions = () => {
        setShowActions(false);
        Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
        }).start();

        if (onSwipeableClose && typeof onSwipeableClose === 'function') {
            onSwipeableClose();
        }
    };

    const handleNewSwipe = () => {
        if (onSwipeableOpen) {
            onSwipeableOpen(item.id, { current: { close: closeActions } });
        }
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
            const hasMinMovement = Math.abs(gestureState.dx) > 10; // FIXED: Reduced from 20 to 10
            const isLeftSwipe = gestureState.dx < -10; // FIXED: Consistent with hasMinMovement

            console.log('ListItem gesture check:', {
                dx: gestureState.dx,
                dy: gestureState.dy,
                isHorizontal,
                hasMinMovement,
                isLeftSwipe,
                isMenuVisible,
                showActions,
                shouldCapture: isHorizontal && hasMinMovement && isLeftSwipe && !isMenuVisible && !showActions
            });
            
            return isHorizontal && hasMinMovement && isLeftSwipe && !isMenuVisible && !showActions;
        },
        onPanResponderGrant: () => {
            Animated.spring(scaleAnim, { 
                toValue: 1.02, 
                useNativeDriver: true 
            }).start();
        },
        onPanResponderMove: (evt, gestureState) => {
            console.log('ListItem pan move:', gestureState.dx);
            if (gestureState.dx < 0) {
                const clampedTranslation = Math.max(gestureState.dx, -80);
                translateX.setValue(clampedTranslation);
                
                if (Math.abs(gestureState.dx) > 15 && !showActions) {
                    console.log('Showing actions for item:', item.id);
                    setShowActions(true);
                    handleNewSwipe();
                }
            }
        },
        onPanResponderRelease: (evt, gestureState) => {
            Animated.spring(scaleAnim, { 
                toValue: 1, 
                useNativeDriver: true 
            }).start();
            
            if (gestureState.dx < 0) {
                const swipeDistance = Math.abs(gestureState.dx);
                const swipeVelocity = Math.abs(gestureState.vx);
                const currentTranslation = Math.abs(translateX._value);
                
                // More forgiving logic: keep actions if user clearly intended to open them
                const significantSwipe = swipeDistance > 30;
                const fastSwipe = swipeVelocity > 0.6 && swipeDistance > 20;
                const alreadyMostlyOpen = currentTranslation > 40;
                
                const shouldKeepActions = significantSwipe || fastSwipe || alreadyMostlyOpen;
                
                console.log('Release decision:', {
                    swipeDistance,
                    swipeVelocity,
                    currentTranslation,
                    shouldKeepActions,
                    significantSwipe,
                    fastSwipe,
                    alreadyMostlyOpen
                });
                
                if (shouldKeepActions) {
                    setShowActions(true);
                    handleNewSwipe();
                    Animated.spring(translateX, {
                        toValue: -80,
                        useNativeDriver: true,
                        tension: 100,
                        friction: 8
                    }).start();
                } else {
                    closeActions();
                }
            } else {
                closeActions();
            }
        },
        onPanResponderTerminate: () => {
            Animated.spring(scaleAnim, { 
                toValue: 1, 
                useNativeDriver: true 
            }).start();
            closeActions();
        },
    });

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
            <Animated.View 
                style={[
                    { transform: [{ scale: scaleAnim }, { translateX }] }, 
                    styles.cardShadow
                ]}
                {...panResponder.panHandlers}
            >
                <Pressable 
                    onPress={() => !showActions && onSelectShinning(item)}
                    disabled={showActions}
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
        zIndex: 1,
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
        right: 16,
        top: 0,
        bottom: 16,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
        width: 80,
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
        zIndex: 0,
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
        zIndex: 2,
    },
});

export default ListItem;