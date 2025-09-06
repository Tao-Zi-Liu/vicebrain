import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
  TouchableOpacity, TextInput, Pressable, Dimensions, RefreshControl,
  Animated as RNAnimated
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';
import ListItem from '../components/ListItem';
import { ScrollView } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

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
    const [refreshing, setRefreshing] = useState(false);
    
    const flatListRef = useRef(null);
    const searchAnim = useRef(new RNAnimated.Value(0)).current;
    const addButtonScale = useSharedValue(1);
    const swipeableRefs = useRef({});

    // Refresh handler
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 1500);
    }, []);

    useEffect(() => {
        const toValue = isSearchVisible ? 1 : 0;
        if (!isSearchVisible) {
            setSearchQuery('');
        }
        RNAnimated.timing(searchAnim, {
            toValue,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isSearchVisible, searchAnim]);

    const handleSwipeableOpen = (id, ref) => {
        if (isMenuVisible) return;
        if (openSwipeableId && openSwipeableId !== id && swipeableRefs.current[openSwipeableId]) {
        swipeableRefs.current[openSwipeableId].close();
        }
        swipeableRefs.current[id] = ref.current;
        setOpenSwipeableId(id);
        setHasOpenActions(true);
    };

    const handleSwipeableClose = () => {
        setOpenSwipeableId(null);
        setHasOpenActions(false);
    };
    
    const filteredShinnings = (shinnings || []).filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const searchBarHeight = searchAnim.interpolate({
        inputRange: [0, 1], 
        outputRange: [0, 60] 
    });

    const addButtonAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: addButtonScale.value }]
        };
    });

    const onPressInAdd = () => {
        addButtonScale.value = withSpring(0.9);
    };
    
    const onPressOutAdd = () => {
        addButtonScale.value = withSpring(1);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />            
            <View style={styles.header}>
                <TouchableOpacity onPress={onOpenMenu} style={styles.menuButton}>
                    <MenuIcon />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
                </Text>
                <TouchableOpacity style={styles.menuButton} onPress={onToggleSearch}>
                    <FilterIcon />
                </TouchableOpacity>
            </View>
            
            <RNAnimated.View style={[styles.searchBarContainer, { height: searchBarHeight }]}>
                <TextInput 
                    style={styles.searchInput} 
                    placeholder="Search Shinnings..." 
                    value={searchQuery} 
                    onChangeText={setSearchQuery} 
                />
                <TouchableOpacity onPress={onToggleSearch}>
                    <Text>Cancel</Text>
                </TouchableOpacity>
            </RNAnimated.View>
            
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#9CA3AF" />
                </View>
            ) : (

                <ScrollView
                    horizontal={false}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={!isMenuVisible}  // Disable scroll when menu is open
                >
                <FlatList
                    ref={flatListRef}
                    data={filteredShinnings}
                    keyExtractor={(item) => item.id}
                    scrollEventThrottle={16}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#9CA3AF"
                            colors={["#9CA3AF"]}
                        />
                    }
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
                            isMenuVisible={isMenuVisible}
                        />
                    )}
                    contentContainerStyle={{ 
                        paddingBottom: 120, 
                        flexGrow: 1 
                    }}
                    scrollEnabled={false}
                />
            </ScrollView>
            )}
        
            <AnimatedPressable
                onPress={onOpenAddModal}
                onPressIn={onPressInAdd}
                onPressOut={onPressOutAdd}
                style={[
                    styles.addButton, 
                    addButtonAnimatedStyle
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
        backgroundColor: 'white',
        minHeight: 60
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