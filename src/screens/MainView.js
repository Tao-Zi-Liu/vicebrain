// src/screens/MainView.js - FIXED VERSION

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
  TouchableOpacity, TextInput, Animated, Pressable
} from 'react-native';
import { FlatList, PanGestureHandler } from 'react-native-gesture-handler';
import ListItem from '../components/ListItem';
import { useGestureContext } from '../context/GestureContext';
import useGestureManager from '../hooks/useGestureManager';


const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MenuIcon = () => (<Text style={styles.iconText}>☰</Text>);
const FilterIcon = () => (<Text style={styles.iconText}>⇅</Text>);
const AddIcon = () => (<Text style={styles.addIconText}>+</Text>);

const MainView = ({
    shinnings, loading, currentView = 'home',
    onSetStatus, onDeletePermanently,
    onSelectShinning, onOpenMenu, onOpenAddModal, onOpenEditModal,
    isSearchVisible, onToggleSearch,
    isMenuVisible
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [openSwipeableId, setOpenSwipeableId] = useState(null);
    const { gestureState } = useGestureContext();
    const { onGestureEvent, onHandlerStateChange } = useGestureManager();
    
    const scrollY = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef(null);
    const searchAnim = useRef(new Animated.Value(0)).current;
    const panGestureRef = useRef(null);
    const addButtonScale = useRef(new Animated.Value(1)).current;
    const swipeableRefs = useRef({});

    useEffect(() => {
        const toValue = isSearchVisible ? 1 : 0;
        if (!isSearchVisible) {
            setSearchQuery('');
        }
        Animated.timing(searchAnim, {
            toValue,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isSearchVisible]);

    const handleSwipeableOpen = (id, ref) => {
        if (gestureState.isMenuOpen) return;
        if (openSwipeableId && openSwipeableId !== id) {
            swipeableRefs.current[openSwipeableId]?.close();
        }
        swipeableRefs.current[id] = ref.current;
        setOpenSwipeableId(id);
    };

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
    );
    
    const filteredShinnings = (shinnings || []).filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const searchBarHeight = searchAnim.interpolate({ 
        inputRange: [0, 1], 
        outputRange: [0, 60] 
    });

    const onPressInAdd = () => {
        Animated.spring(addButtonScale, { 
            toValue: 0.9, 
            useNativeDriver: true 
        }).start();
    };
    
    const onPressOutAdd = () => {
        Animated.spring(addButtonScale, { 
            toValue: 1, 
            useNativeDriver: true 
        }).start();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <PanGestureHandler
                    onGestureEvent={(event) => {
                        console.log('Gesture detected:', event.nativeEvent.translationX, event.nativeEvent.translationY);
                        onGestureEvent(event);
                    }}
                    onHandlerStateChange={(event) => {
                        console.log('Gesture state changed:', event.nativeEvent.state);
                        onHandlerStateChange(event);
                    }}
                    activeOffsetX={[-999, 20]}
                    failOffsetY={[-50, 50]}
                    enabled={!gestureState.isMenuOpen}
                >
                <Animated.View style={{ flex: 1 }}>
                    <Animated.View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
                        <StatusBar barStyle="dark-content" />            
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onOpenMenu} style={styles.menuButton}>
                                <MenuIcon />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>
                                {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
                            </Text>
                            <TouchableOpacity style={styles.menuButton}>
                                <FilterIcon />
                            </TouchableOpacity>
                        </View>
                        
                        <Animated.View style={[styles.searchBarContainer, { height: searchBarHeight }]}>
                            <TextInput 
                                style={styles.searchInput} 
                                placeholder="Search Shinnings..." 
                                value={searchQuery} 
                                onChangeText={setSearchQuery} 
                            />
                            <TouchableOpacity onPress={onToggleSearch}>
                                <Text>Cancel</Text>
                            </TouchableOpacity>
                        </Animated.View>
                        
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#9CA3AF" />
                            </View>
                        ) : (
                            <AnimatedFlatList
                                ref={flatListRef}
                                data={filteredShinnings}
                                keyExtractor={(item) => item.id}
                                onScroll={handleScroll}
                                scrollEventThrottle={16}
                                renderItem={({ item }) => (
                                    <ListItem
                                        item={item}
                                        onSelectShinning={onSelectShinning}
                                        onSetStatus={onSetStatus}
                                        onDeletePermanently={onDeletePermanently}
                                        onOpenEditModal={onOpenEditModal}
                                        currentView={currentView}
                                        onSwipeableOpen={handleSwipeableOpen}
                                        isMenuVisible={gestureState.isMenuOpen}
                                    />
                                )}
                                contentContainerStyle={{ 
                                    paddingBottom: 120, 
                                    flexGrow: 1 
                                }}
                            />
                        )}
                    </Animated.View>
                </Animated.View>
            </PanGestureHandler>
            
            <AnimatedPressable
                onPress={onOpenAddModal}
                onPressIn={onPressInAdd}
                onPressOut={onPressOutAdd}
                style={[
                    styles.addButton, 
                    { transform: [{ scale: addButtonScale }] }
                ]}
            >
                <AddIcon />
            </AnimatedPressable>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#F8F9FA' 
    },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: '#E9ECEF', 
        backgroundColor: 'white' 
    },
    menuButton: { 
        padding: 4, 
        width: 40, 
        alignItems: 'center' 
    },
    headerTitle: { 
        flex: 1, 
        textAlign: 'center', 
        fontSize: 20, 
        fontWeight: '600', 
        color: '#212529' 
    },
    iconText: { 
        fontSize: 24, 
        color: '#212529' 
    },
    loadingContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    searchBarContainer: { 
        backgroundColor: '#F8F9FA', 
        paddingHorizontal: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        overflow: 'hidden' 
    },
    searchInput: { 
        flex: 1, 
        height: 40, 
        backgroundColor: 'white', 
        borderRadius: 8, 
        paddingHorizontal: 10, 
        marginRight: 10, 
        borderWidth: 1, 
        borderColor: '#E9ECEF' 
    },
    addButton: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#212529',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    addIconText: { 
        color: 'white', 
        fontSize: 32, 
        lineHeight: 34 
    },
});

export default MainView;