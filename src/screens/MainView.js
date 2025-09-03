// src/screens/MainView.js - REAL-TIME GESTURE VERSION

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
  TouchableOpacity, TextInput, Animated, Pressable, Dimensions
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import ListItem from '../components/ListItem';
import { useGestureContext } from '../context/GestureContext';
import { PanResponder } from 'react-native';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75;

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
    const [hasOpenActions, setHasOpenActions] = useState(false);
    const [shouldShowMenu, setShouldShowMenu] = useState(false);  // ADD THIS LINE
    const { gestureState } = useGestureContext();
    
    const scrollY = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef(null);
    const searchAnim = useRef(new Animated.Value(0)).current;
    const addButtonScale = useRef(new Animated.Value(1)).current;
    const swipeableRefs = useRef({});
    const contentTranslateX = useRef(new Animated.Value(0)).current;

    const rightSwipePanResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            const isRightSwipe = gestureState.dx > 15 && Math.abs(gestureState.dy) < 50;
            return isRightSwipe && !gestureState.isMenuOpen;
        },
        onPanResponderMove: (evt, gestureState) => {
            // Real-time following: move content as user drags
            if (gestureState.dx > 0 && gestureState.dx <= MENU_WIDTH) {
                contentTranslateX.setValue(gestureState.dx);
                
                // Show menu when dragged 20% of menu width
                if (gestureState.dx > MENU_WIDTH * 0.2 && !shouldShowMenu) {
                    setShouldShowMenu(true);
                }
            }
        },
        onPanResponderRelease: (evt, gestureState) => {
            if (gestureState.dx > MENU_WIDTH * 0.3) {
                // Complete the opening animation
                onOpenMenu();
                Animated.timing(contentTranslateX, {
                    toValue: MENU_WIDTH,
                    duration: 200,
                    useNativeDriver: true
                }).start();
            } else {
                // Snap back to closed
                setShouldShowMenu(false);
                Animated.timing(contentTranslateX, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }).start();
            }
        }
    });

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

    // UPDATED: Handle menu closing
    useEffect(() => {
        if (!gestureState.isMenuOpen) {
            setShouldShowMenu(false);
            Animated.timing(contentTranslateX, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true
            }).start();
        }
    }, [gestureState.isMenuOpen]);

    const handleSwipeableOpen = (id, ref) => {
        if (gestureState.isMenuOpen) return;
        if (openSwipeableId && openSwipeableId !== id) {
            swipeableRefs.current[openSwipeableId]?.close();
        }
        swipeableRefs.current[id] = ref.current;
        setOpenSwipeableId(id);
        setHasOpenActions(true);
    };

    const handleSwipeableClose = () => {
        setOpenSwipeableId(null);
        setHasOpenActions(false);
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
            {/* UPDATED: Pass shouldShowMenu instead of gestureState.isMenuOpen */}
            {shouldShowMenu && (
                <View style={styles.menuBackground}>
                    <View style={styles.menuContainer}>
                        <View style={styles.menuHeader}>
                            <Text style={styles.menuTitle}>Vicebrain</Text>
                        </View>
                        <Text style={styles.menuItem}>Search</Text>
                        <Text style={styles.menuItem}>Shinning Firing</Text>
                        <Text style={styles.menuItem}>Archive</Text>
                        <Text style={styles.menuItem}>Trash</Text>
                        <Text style={styles.menuItem}>Graph</Text>
                        <View style={{ flex: 1 }} />
                        <Text style={styles.menuItem}>Profile</Text>
                        <Text style={styles.menuItem}>Sign Out</Text>
                    </View>
                </View>
            )}
            
            <Animated.View style={{ flex: 1 }}>
                <Animated.View 
                    style={{ 
                        flex: 1, 
                        backgroundColor: '#F8F9FA',
                        transform: [{ translateX: contentTranslateX }]
                    }}
                    {...rightSwipePanResponder.panHandlers}
                >
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
                                    onSwipeableClose={handleSwipeableClose}
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
        
            <AnimatedPressable
                onPress={onOpenAddModal}
                onPressIn={onPressInAdd}
                onPressOut={onPressOutAdd}
                style={[
                    styles.addButton, 
                    { 
                        transform: [
                            { scale: addButtonScale },
                            { translateX: contentTranslateX }
                        ] 
                    }
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
    // ADDED: Menu background and container styles
    menuBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 0
    },
    menuContainer: { 
        width: MENU_WIDTH, 
        height: '100%', 
        backgroundColor: '#FFFFFF',
        borderRightWidth: 1,
        borderRightColor: '#E1E5E9',
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: {
            width: 2,
            height: 0,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        paddingTop: 40,
    },
    menuHeader: { 
        paddingHorizontal: 16,  // Match main header
        paddingVertical: 12,    // Match main header  
        borderBottomWidth: 1, 
        borderBottomColor: '#E9ECEF',
        backgroundColor: '#FFFFFF',
        minHeight: 60
    },
    menuTitle: { 
        fontSize: 24, 
        fontWeight: 'bold',
        color: '#212529'
    },
    menuItem: { 
        fontSize: 18, 
        fontWeight: '500', 
        color: '#212529',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: '#F1F3F5'
    },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: '#E9ECEF', 
        backgroundColor: 'white',
        minHeight: 60  // ADDED: Match menu header height
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