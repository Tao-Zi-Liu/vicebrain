// src/components/ListItem.js - FIXED SWIPEABLE VERSION

import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, TouchableOpacity } from 'react-native';
import { Swipeable, State } from 'react-native-gesture-handler';

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
    currentView, isMenuVisible, onSwipeableOpen
}) => {
    const swipeableRef = useRef(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const closeSwipeable = () => {
        if (swipeableRef.current) {
            swipeableRef.current.close();
        }
    };

    const onSwipeableDragStart = () => {
        Animated.spring(scaleAnim, { 
            toValue: 1.02, 
            useNativeDriver: true 
        }).start();
    };

    const onSwipeableDragEnd = () => {
        Animated.spring(scaleAnim, { 
            toValue: 1, 
            useNativeDriver: true 
        }).start();
    };

    const renderRightActions = () => {
        let actions = [];
        
        if (currentView === 'home') {
            actions = [
                { 
                    key: 'edit', 
                    color: '#228BE6', 
                    icon: <EditIcon />, 
                    onPress: () => { 
                        closeSwipeable(); 
                        onOpenEditModal(item); 
                    } 
                },
                { 
                    key: 'archive', 
                    color: '#FAB005', 
                    icon: <ArchiveIcon />, 
                    onPress: () => { 
                        closeSwipeable(); 
                        onSetStatus(item.id, 'archived'); 
                    } 
                },
                { 
                    key: 'trash', 
                    color: '#FA5252', 
                    icon: <TrashIcon />, 
                    onPress: () => { 
                        closeSwipeable(); 
                        onSetStatus(item.id, 'trashed'); 
                    } 
                }
            ];
        } else if (currentView === 'archive') {
            actions = [
                { 
                    key: 'restore', 
                    color: '#20C997', 
                    icon: <RestoreIcon />, 
                    onPress: () => { 
                        closeSwipeable(); 
                        onSetStatus(item.id, 'active'); 
                    } 
                },
                { 
                    key: 'trash', 
                    color: '#FA5252', 
                    icon: <TrashIcon />, 
                    onPress: () => { 
                        closeSwipeable(); 
                        onSetStatus(item.id, 'trashed'); 
                    } 
                }
            ];
        } else if (currentView === 'trash') {
            actions = [
                { 
                    key: 'restore', 
                    color: '#20C997', 
                    icon: <RestoreIcon />, 
                    onPress: () => { 
                        closeSwipeable(); 
                        onSetStatus(item.id, 'active'); 
                    } 
                },
                { 
                    key: 'delete', 
                    color: '#FA5252', 
                    icon: <TrashIcon />, 
                    onPress: () => { 
                        closeSwipeable(); 
                        onDeletePermanently(item.id); 
                    } 
                }
            ];
        }

        // Simple row layout for all views
        return (
            <View style={styles.swipeActionContainer}>
                {actions.map((action) => (
                    <TouchableOpacity 
                        key={action.key}
                        style={[styles.swipeButton, { backgroundColor: action.color }]} 
                        onPress={action.onPress}
                    >
                        {action.icon}
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            enabled={!isMenuVisible}
            renderRightActions={renderRightActions}
            overshootRight={false}
            onSwipeableWillOpen={() => {
                if (onSwipeableOpen) {
                    onSwipeableOpen(item.id, swipeableRef);
                }
            }}
            onSwipeableOpen={onSwipeableDragEnd}
            onSwipeableClose={onSwipeableDragEnd}
            onBegan={onSwipeableDragStart}
            simultaneousHandlers={[]}
            waitFor={[]}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }], ...styles.cardShadow }}>
                <Pressable onPress={() => onSelectShinning(item)}>
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
        </Swipeable>
    );
};

const styles = StyleSheet.create({
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
    swipeActionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: 10,
    },
    swipeButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 50,
        height: 50,
        borderRadius: 25,
        marginLeft: 10,
    },
});

export default ListItem;