import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, 
  TouchableOpacity, TextInput, Animated, Dimensions 
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import ListItem from '../components/ListItem';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// --- Icon Components ---
const MenuIcon = () => (<Text style={styles.iconText}>☰</Text>);
const FilterIcon = () => (<Text style={styles.iconText}>⇅</Text>);
const SearchIcon = () => (<Text style={styles.bottomBarIconText}>🔍</Text>);
const ToTopIcon = () => (<Text style={styles.bottomBarIconText}>🔝</Text>);
const AddIcon = () => (<Text style={styles.addIconText}>+</Text>);

const MainView = ({ 
    shinnings, loading, currentView, panRef, onSetStatus, onDeletePermanently, 
    onSelectShinning, onOpenMenu, onOpenFilterMenu, onOpenAddModal, isMenuVisible,
    onOpenEditModal, ListEmptyComponent
}) => {
    const [openSwipeableId, setOpenSwipeableId] = useState(null);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showScrollToTop, setShowScrollToTop] = useState(false);

    const swipeableRefs = useRef({});
    const scrollY = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef(null);
    const searchAnim = useRef(new Animated.Value(0)).current;

    const handleSwipeableOpen = (id, ref) => {
        if (openSwipeableId && openSwipeableId !== id) {
            swipeableRefs.current[openSwipeableId]?.close();
        }
        swipeableRefs.current[id] = ref.current;
        setOpenSwipeableId(id);
    };

    const toggleSearch = () => {
        const toValue = isSearchVisible ? 0 : 1;
        Animated.timing(searchAnim, {
            toValue,
            duration: 300,
            useNativeDriver: false,
        }).start(() => setIsSearchVisible(!isSearchVisible));
    };
    
    const scrollToTop = () => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    };

    const ListHeaderIndicator = ({ scrollY }) => {
        const opacity = scrollY.interpolate({ inputRange: [-60, 0], outputRange: [1, 0], extrapolate: 'clamp' });
        const scale = scrollY.interpolate({ inputRange: [-60, 0], outputRange: [1, 0.5], extrapolate: 'clamp' });
        return (
            <Animated.View style={[styles.headerIndicatorContainer, { opacity, transform: [{ scale }] }]}>
                <View style={styles.indicatorDot} /><View style={styles.indicatorDot} /><View style={styles.indicatorDot} />
            </Animated.View>
        );
    };

    const ListFooterIndicator = () => {
        const lineWidth = useRef(new Animated.Value(0)).current;
        useEffect(() => {
            Animated.timing(lineWidth, { toValue: 40, duration: 300, useNativeDriver: false }).start();
        }, []);
        return (
            <View style={styles.footerContainer}><Animated.View style={[styles.footerLine, { width: lineWidth }]} /></View>
        );
    };
    
    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { 
            useNativeDriver: true,
            listener: event => setShowScrollToTop(event.nativeEvent.contentOffset.y > Dimensions.get('window').height / 2)
        }
    );
    
    const filteredShinnings = (shinnings || []).filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const searchBarHeight = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 60] });

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={onOpenMenu} style={styles.menuButton}><MenuIcon /></TouchableOpacity>
                <Text style={styles.headerTitle}>{currentView.charAt(0).toUpperCase() + currentView.slice(1)}</Text>
                <TouchableOpacity onPress={onOpenFilterMenu} style={styles.menuButton}><FilterIcon /></TouchableOpacity>
            </View>

            <Animated.View style={[styles.searchBarContainer, { height: searchBarHeight }]}>
                <TextInput 
                    style={styles.searchInput}
                    placeholder="Search Shinnings..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity onPress={toggleSearch}><Text>Cancel</Text></TouchableOpacity>
            </Animated.View>

            {loading ? 
                <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#9CA3AF" /></View> :
                <AnimatedFlatList
                    ref={flatListRef}
                    waitFor={panRef}
                    scrollEnabled={!isMenuVisible}
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
                            isMenuVisible={isMenuVisible}
                            onSwipeableOpen={handleSwipeableOpen}
                        />
                    )}
                    ListHeaderComponent={<ListHeaderIndicator scrollY={scrollY} />}
                    ListEmptyComponent={ListEmptyComponent}
                    // [FIX] Added a check for `shinnings` to prevent accessing .length on undefined.
                    ListFooterComponent={!loading && shinnings && shinnings.length > 0 ? <ListFooterIndicator /> : null}
                    contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
                />
            }
            
            <View style={styles.bottomBar}>
                <TouchableOpacity onPress={toggleSearch} style={styles.bottomBarButton}><SearchIcon /></TouchableOpacity>
                <TouchableOpacity onPress={onOpenAddModal} style={styles.addButton}><AddIcon /></TouchableOpacity>
                <TouchableOpacity onPress={scrollToTop} style={[styles.bottomBarButton, { opacity: showScrollToTop ? 1 : 0 }]}><ToTopIcon /></TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E9ECEF', backgroundColor: 'white' },
  menuButton: { padding: 4, width: 40, alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '600', color: '#212529' },
  iconText: { fontSize: 24, color: '#212529' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBarContainer: { backgroundColor: '#F8F9FA', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  searchInput: { flex: 1, height: 40, backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 10, marginRight: 10, borderWidth: 1, borderColor: '#E9ECEF' },
  headerIndicatorContainer: { height: 30, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  indicatorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ADB5BD', marginHorizontal: 3 },
  footerContainer: { height: 50, justifyContent: 'center', alignItems: 'center' },
  footerLine: { height: 4, backgroundColor: '#E9ECEF', borderRadius: 2 },
  bottomBar: { position: 'absolute', bottom: 20, left: 20, right: 20, height: 60, borderRadius: 30, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 10 },
  bottomBarButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#212529', alignItems: 'center', justifyContent: 'center', bottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 8 },
  addIconText: { color: 'white', fontSize: 28 },
  bottomBarIconText: { fontSize: 24 },
});
export default MainView;
