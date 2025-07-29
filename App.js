import { getFunctions, httpsCallable } from 'firebase/functions';
import AuthScreen from './src/screens/AuthScreen';
import useShinnings from './src/hooks/useShinnings';
import DetailView from './src/screens/DetailView';
import MainView from './src/screens/MainView';
import ListItem from './src/components/ListItem';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator,
  Platform, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Pressable, ScrollView, Linking, Alert, Animated, Dimensions, Image
} from 'react-native';
import { GestureHandlerRootView, Swipeable, FlingGestureHandler, PanGestureHandler, Directions, State, FlatList } from 'react-native-gesture-handler';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, deleteDoc, where, orderBy, getDocs, documentId } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Svg, Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const MENU_WIDTH = width * 0.7;

// --- Components ---

const Toast = ({ message, type, onHide }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]),
            Animated.delay(2500),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start(() => onHide());
    }, [message]);

    const backgroundColor = type === 'SUCCESS' ? '#28a745' : '#dc3545';
    const icon = type === 'SUCCESS' ? '✓' : '✕';

    return (
        <Animated.View style={[
            styles.toastOverlay,
            { opacity }
        ]}>
            <Animated.View style={[
                styles.toast,
                { backgroundColor },
                { transform: [{ scale }] }
            ]}>
                <Text style={styles.toastIcon}>{icon}</Text>
                <Text style={styles.toastText}>{message}</Text>
            </Animated.View>
        </Animated.View>
    );
};

const SplashScreen = () => {
    const textOpacity = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(textOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, []);
    return (
        <View style={styles.splashContainer}>
            <Animated.Text style={[styles.splashTitle, { opacity: textOpacity }]}>Shinning</Animated.Text>
        </View>
    );
};

// A dynamic empty list component that shows different content based on the current view.
const EmptyListComponent = ({ view }) => {
    const messages = {
        home: {
            icon: (
                <Svg height="80" width="80" viewBox="0 0 24 24" style={{ marginBottom: 20 }}>
                    <Path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM12 12C12.83 12 13.5 11.33 13.5 10.5C13.5 9.67 12.83 9 12 9C11.17 9 10.5 9.67 10.5 10.5C10.5 11.33 11.17 12 12 12ZM15.85 15.21C15.46 14.5 14.48 13.66 12 13.66C9.52 13.66 8.54 14.5 8.15 15.21C7.86 15.73 8.01 16.38 8.47 16.79C8.92 17.2 9.58 17.26 10.09 16.91C10.68 16.5 11.32 16 12 16C12.68 16 13.32 16.5 13.91 16.91C14.42 17.26 15.08 17.2 15.53 16.79C15.99 16.38 16.14 15.73 15.85 15.21Z" fill="#ADB5BD"/>
                </Svg>
            ),
            title: 'Capture Your First Shinning!',
            subtitle: 'Tap the "+" button below to create a new one.',
        },
        archive: {
            icon: (
                <Svg height="80" width="80" viewBox="0 0 24 24" style={{ marginBottom: 20 }}>
                    <Path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM6.24 5h11.52l.83 1H5.42l.82-1zM5 19V8h14v11H5zm11-5.5l-4 4-4-4 1.41-1.41L11 13.67V10h2v3.67l1.59-1.58L16 13.5z" fill="#ADB5BD"/>
                </Svg>
            ),
            title: 'Archive is Empty',
            subtitle: 'Your archived shinnings will appear here.',
        },
        trash: {
            icon: (
                <Svg height="80" width="80" viewBox="0 0 24 24" style={{ marginBottom: 20 }}>
                    <Path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#ADB5BD"/>
                </Svg>
            ),
            title: 'Trash is Empty',
            subtitle: 'Your deleted shinnings will be kept here.',
        },
    };

    const { icon, title, subtitle } = messages[view] || messages.home;

    return (
        <View style={styles.emptyContainer}>
            {icon}
            <Text style={styles.emptyText}>{title}</Text>
            <Text style={styles.emptySubText}>{subtitle}</Text>
        </View>
    );
};


// --- Icons ---
const MenuIcon = () => (<Text style={styles.iconText}>☰</Text>);
const CloseIcon = () => (<Text style={styles.iconText}>✕</Text>);
const AiIcon = () => (<Text style={styles.iconText}>✨</Text>);
const FilterIcon = () => (<Text style={styles.iconText}>⇅</Text>);

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBKzMxR_NMT7NiUsY3KZpEedTwoPfVANVA",
  authDomain: "vicebrain-5e3f5.firebaseapp.com",
  projectId: "vicebrain-5e3f5",
  storageBucket: "vicebrain-5e3f5.firebasestorage.app",
  messagingSenderId: "124363270573",
  appId: "1:124363270573:web:318060bebe71687eb7d924"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const db = getFirestore(app);
const functions = getFunctions(app);

// --- Main App Component ---
export default function App() {
  // --- State ---
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedShinning, setSelectedShinning] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [aiMenuVisible, setAiMenuVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isTaggingPhase, setIsTaggingPhase] = useState(false);
  const [currentTags, setCurrentTags] = useState([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [sortBy, setSortBy] = useState({ field: 'updatedAt', direction: 'desc' });
  const [linkedData, setLinkedData] = useState({ backlinks: [], outgoingLinks: [] });
  const [editingItem, setEditingItem] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: '' });

  // --- Animations ---
  const panRef = useRef(null);
  const dragX = useRef(new Animated.Value(0)).current;
  const transX = useRef(new Animated.Value(0)).current;
  const translateX = Animated.add(dragX, transX);

  // --- Hooks ---
  const { shinnings, loading } = useShinnings(user, currentView, sortBy);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchLinks = async () => {
        if (selectedShinning && user) {
            setLinkedData({ backlinks: [], outgoingLinks: [] });
            const collectionPath = `users/${user.uid}/shinnings`;
            const backlinks = [];
            const outgoingLinks = [];

            if (selectedShinning.incomingLinks?.length > 0) {
                const q = query(collection(db, collectionPath), where(documentId(), "in", selectedShinning.incomingLinks));
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach(doc => backlinks.push({ id: doc.id, ...doc.data() }));
            }
            if (selectedShinning.outgoingLinks?.length > 0) {
                const q = query(collection(db, collectionPath), where(documentId(), "in", selectedShinning.outgoingLinks));
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach(doc => outgoingLinks.push({ id: doc.id, ...doc.data() }));
            }
            setLinkedData({ backlinks, outgoingLinks });
        }
    };
    fetchLinks();
  }, [selectedShinning, user]);

  // --- Handlers & Functions ---
  const showToast = (message, type = 'SUCCESS') => {
    setToast({ visible: true, message, type });
  };

  const onPanGestureEvent = Animated.event([{ nativeEvent: { translationX: transX } }], { useNativeDriver: true });

  const onPanHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.oldState === State.ACTIVE) {
        const { translationX, velocityX } = nativeEvent;
        const projectedPosition = dragX._value + translationX;
        transX.flattenOffset();
        transX.setValue(0);
        let snapPoint = isMenuVisible
            ? (projectedPosition < MENU_WIDTH / 2 && velocityX < 400) ? 0 : MENU_WIDTH
            : (projectedPosition > MENU_WIDTH / 2 || velocityX > 400) ? MENU_WIDTH : 0;
        dragX.setValue(projectedPosition);
        Animated.spring(dragX, { toValue: snapPoint, velocity: velocityX, bounciness: 0, useNativeDriver: true })
            .start(() => setMenuVisible(snapPoint > 0));
    }
  };

  const openMenu = () => Animated.spring(dragX, { toValue: MENU_WIDTH, useNativeDriver: true }).start(() => setMenuVisible(true));
  const closeMenu = () => Animated.spring(dragX, { toValue: 0, useNativeDriver: true }).start(() => setMenuVisible(false));

  // In App.js, use this corrected function

const runAIAction = async (action) => {
    if (!selectedShinning || !user) return;
    setIsAILoading(true);
    setAiError(null);
    setAiMenuVisible(false);

    // Get a reference to the cloud function you just deployed
    const runAiActionOnServer = httpsCallable(functions, 'runAiAction');

    try {
        // Call the server function with the required data
        await runAiActionOnServer({
            shinningId: selectedShinning.id,
            action: action
        });
        showToast('AI analysis added!', 'SUCCESS');
        // The onSnapshot listener will update the UI automatically

    } catch (error) {
        console.error("Cloud Function Error:", error);
        
        // Display a user-friendly error message from the server
        const errorMessage = error.message.includes("enough credits")
            ? "You don't have enough credits for this."
            : "The AI request failed. Please try again.";
        
        showToast(errorMessage, 'ERROR');
        setAiError(errorMessage);
    } finally {
        setIsAILoading(false);
    }
}; 

const getAITags = async (title, content, docId) => {
    setIsAILoading(true);
    setAiError(null);
    const runAiActionOnServer = httpsCallable(functions, 'runAiAction');

    try {
        const result = await runAiActionOnServer({
            action: 'suggestTags',
            title: title,
            content: content
        });
        const tags = result.data.data; // The returned data is nested in result.data
        if (Array.isArray(tags)) {
            setSuggestedTags(tags);
            setCurrentDocId(docId);
        } else {
            throw new Error("AI did not return a valid array of tags.");
        }
    } catch (error) {
        console.error("AI Tagging Error:", error);
        showToast(error.message.includes("enough credits") ? "Not enough credits for tags." : "AI couldn't generate tags.", 'ERROR');
    } finally {
        setIsAILoading(false);
    }
};

  const processAndSaveLinks = async (content, docId) => {
    if (!user) return;
    const linkTitles = content.match(/\[\[(.*?)\]\]/g)?.map(t => t.slice(2, -2)) || [];
    if (linkTitles.length === 0) return;
    const collectionPath = `users/${user.uid}/shinnings`;
    const outgoingLinkIds = [];
    for (const title of linkTitles) {
        const q = query(collection(db, collectionPath), where("title", "==", title));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const linkedDoc = querySnapshot.docs[0];
            if(linkedDoc.id === docId) continue;
            outgoingLinkIds.push(linkedDoc.id);
            const linkedDocRef = doc(db, collectionPath, linkedDoc.id);
            await updateDoc(linkedDocRef, { incomingLinks: arrayUnion(docId) });
        }
    }
    if (outgoingLinkIds.length > 0) {
        const docRef = doc(db, collectionPath, docId);
        await updateDoc(docRef, { outgoingLinks: arrayUnion(...outgoingLinkIds) });
    }
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setNewTitle(item.title);
    setNewContent(item.content);
    setCurrentTags(item.tags || []);
    setAddModalVisible(true);
  };

  const handleSaveOrUpdateShinning = async () => {
    if (newTitle.trim() === '' || !user) return;
    const collectionPath = `users/${user.uid}/shinnings`;

    if (editingItem) {
        const docRef = doc(db, collectionPath, editingItem.id);
        await updateDoc(docRef, { title: newTitle, content: newContent, tags: currentTags, updatedAt: serverTimestamp() });
        await processAndSaveLinks(newContent, editingItem.id);
        closeAndResetModal();
        showToast('Shinning updated successfully!');
    } else {
        setIsTaggingPhase(true);
        try {
          const docRef = await addDoc(collection(db, collectionPath), {
            title: newTitle, content: newContent, tags: [], status: 'active',
            createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
            outgoingLinks: [], incomingLinks: []
          });
          setCurrentDocId(docRef.id);
          await processAndSaveLinks(newContent, docRef.id);
          await getAITags(newTitle, newContent, docRef.id);
        } catch (error) { console.error("Error adding document: ", error); setIsTaggingPhase(false); showToast('Failed to save Shinning.', 'ERROR');}
    }
  };

  const handleAddTag = (tag) => {
    if (tag && !currentTags.includes(tag)) { setCurrentTags([...currentTags, tag]); }
    setSuggestedTags(suggestedTags.filter(t => t !== tag));
  };

  const handleAddCustomTag = () => {
    const tag = customTagInput.trim();
    if (tag && !currentTags.includes(tag)) { setCurrentTags([...currentTags, tag]); setCustomTagInput(''); }
  };

  const handleRemoveTag = (tagToRemove) => setCurrentTags(currentTags.filter(tag => tag !== tagToRemove));

  const closeAndResetModal = async () => {
    if (!editingItem && isTaggingPhase && currentDocId && user) {
        const docRef = doc(db, `users/${user.uid}/shinnings`, currentDocId);
        try {
            if (currentTags.length > 0) await updateDoc(docRef, { tags: currentTags });
            showToast('New Shinning created!');
        }
        catch(error) { console.error("Final tag update error:", error); showToast('Could not save tags.', 'ERROR'); }
    }
    setAddModalVisible(false); setEditingItem(null); setIsTaggingPhase(false);
    setSuggestedTags([]); setCurrentDocId(null); setAiError(null);
    setNewTitle(''); setNewContent(''); setCurrentTags([]); setCustomTagInput('');
  }

  const handleOpenLink = (url) => Linking.openURL(url).catch(err => console.error("Couldn't load page", err));

  const handleSetStatus = async (id, status) => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/shinnings`, id);
    await updateDoc(docRef, { status: status, updatedAt: serverTimestamp() });
    showToast(`Shinning moved to ${status}.`);
  };

  const handleDeletePermanently = (id) => {
    Alert.alert("Delete Permanently", "Are you sure you want to permanently delete this Shinning? This action cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
            if (!user) return;
            const docRef = doc(db, `users/${user.uid}/shinnings`, id);
            await deleteDoc(docRef);
            showToast('Shinning permanently deleted.', 'SUCCESS');
        }}
    ]);
  };

  const handleInsertLink = (title) => {
    setNewContent(prev => prev ? `${prev} [[${title}]]` : `[[${title}]]`);
    setLinkModalVisible(false);
    setLinkSearchQuery('');
  };

  const handleSignOut = async () => {
    try {
        await signOut(auth);
        closeMenu();
        showToast('You have been signed out.');
    } catch (error) {
        console.error("Error signing out", error);
        showToast("Could not sign out.", 'ERROR');
    }
  };

  const filteredShinnings = (shinnings || []).filter(item =>
    item.title.toLowerCase().includes(linkSearchQuery.toLowerCase())
  );

  // --- Render Logic ---
  if (initializing) return <SplashScreen />;
  if (!user) return <AuthScreen showToast={showToast} />;

  return (
    <GestureHandlerRootView style={{flex: 1}}>
        {toast.visible && <Toast message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />}
        
        <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
                <Image source={{ uri: user.photoURL || 'https://placehold.co/100x100/E9ECEF/495057?text=User' }} style={styles.menuAvatar} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.menuTitle} numberOfLines={1}>{user.displayName || 'Anonymous User'}</Text>
                    <Text style={styles.menuSubtitle} numberOfLines={1}>{user.email || 'No email provided'}</Text>
                </View>
                <TouchableOpacity onPress={closeMenu}><CloseIcon /></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.menuItem} onPress={() => {setCurrentView('home'); closeMenu();}}><Text style={styles.menuItemText}>Home</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => {setCurrentView('archive'); closeMenu();}}><Text style={styles.menuItemText}>Archive</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => {setCurrentView('trash'); closeMenu();}}><Text style={styles.menuItemText}>Trash</Text></TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}><Text style={styles.menuItemText}>Sign Out</Text></TouchableOpacity>
        </View>

        <PanGestureHandler 
            ref={panRef} 
            onGestureEvent={onPanGestureEvent} 
            onHandlerStateChange={onPanHandlerStateChange} 
            failOffsetY={[-15, 15]} 
            activeOffsetX={[-20, 20]} 
            enabled={!isMenuVisible && !selectedShinning}
        >
            <Animated.View style={[styles.frontPanel, { transform: [{ translateX }] }]}>
                {selectedShinning ? (
                    <DetailView
                        shinning={selectedShinning}
                        isMenuVisible={isMenuVisible}
                        onBack={() => { setSelectedShinning(null); }}
                        onOpenAiMenu={() => setAiMenuVisible(true)}
                        isAILoading={isAILoading}
                        aiError={aiError}
                        linkedData={linkedData}
                        onSelectLinkedItem={setSelectedShinning}
                        onOpenLink={handleOpenLink}
                    />
                ) : (
                    <MainView
                        shinnings={shinnings}
                        loading={loading}
                        currentView={currentView}
                        panRef={panRef}
                        isMenuVisible={isMenuVisible}
                        onSetStatus={handleSetStatus}
                        onDeletePermanently={handleDeletePermanently}
                        onSelectShinning={setSelectedShinning}
                        onOpenMenu={openMenu}
                        onOpenFilterMenu={() => setFilterMenuVisible(true)}
                        onOpenAddModal={() => setAddModalVisible(true)}
                        onOpenEditModal={handleOpenEditModal}
                        ListEmptyComponent={<EmptyListComponent view={currentView} />}
                    />
                )}

                {isMenuVisible && (
                    <Pressable
                        style={styles.menuClickableOverlay}
                        onPress={closeMenu}
                    />
                )}

            </Animated.View>
        </PanGestureHandler>

        <Modal animationType="fade" transparent={true} visible={filterMenuVisible} onRequestClose={() => setFilterMenuVisible(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setFilterMenuVisible(false)}>
                <View style={styles.menuModalContainer}>
                    <Text style={styles.menuModalTitle}>Sort By</Text>
                    <TouchableOpacity style={styles.menuModalItem} onPress={() => { setSortBy({ field: 'updatedAt', direction: 'desc' }); setFilterMenuVisible(false); }}><Text style={styles.menuModalItemText}>Last Updated</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.menuModalItem} onPress={() => { setSortBy({ field: 'createdAt', direction: 'desc' }); setFilterMenuVisible(false); }}><Text style={styles.menuModalItemText}>Date Created</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.menuModalItem} onPress={() => { setSortBy({ field: 'title', direction: 'asc' }); setFilterMenuVisible(false); }}><Text style={styles.menuModalItemText}>Title (A-Z)</Text></TouchableOpacity>
                </View>
            </Pressable>
        </Modal>

        <Modal animationType="fade" transparent={true} visible={aiMenuVisible} onRequestClose={() => setAiMenuVisible(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setAiMenuVisible(false)}>
                <View style={styles.menuModalContainer}>
                    <Text style={styles.menuModalTitle}>AI Assistant ✨</Text>
                    <TouchableOpacity style={styles.menuModalItem} onPress={() => runAIAction('getAIExpansion')}><Text style={styles.menuModalItemText}>Expand on Shinning</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.menuModalItem} onPress={() => runAIAction('findRelatedMaterials')}><Text style={styles.menuModalItemText}>Find Related Materials</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.menuModalItem} onPress={() => runAIAction('recommendSimilarCases')}><Text style={styles.menuModalItemText}>Recommend Similar Cases</Text></TouchableOpacity>
                </View>
            </Pressable>
        </Modal>

        <Modal animationType="fade" transparent={true} visible={addModalVisible} onRequestClose={closeAndResetModal}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
                <Pressable style={styles.modalBackdrop} onPress={closeAndResetModal} />
                <View style={styles.modalView}>
                    <ScrollView>
                        <Modal animationType="slide" transparent={true} visible={linkModalVisible} onRequestClose={() => setLinkModalVisible(false)}>
                            <View style={styles.linkModalContainer}>
                                <View style={styles.linkModalView}>
                                    <Text style={styles.modalTitle}>Link to Shinning</Text>
                                    <TextInput style={styles.input} placeholder="Search Shinnings..." value={linkSearchQuery} onChangeText={setLinkSearchQuery} />
                                    <FlatList data={filteredShinnings} keyExtractor={item => item.id} renderItem={({item}) => (<TouchableOpacity style={styles.linkListItem} onPress={() => handleInsertLink(item.title)}><Text>{item.title}</Text></TouchableOpacity>)} />
                                    <TouchableOpacity style={[styles.button, styles.cancelButton, {alignSelf: 'flex-end', marginTop: 10}]} onPress={() => setLinkModalVisible(false)}><Text style={styles.cancelButtonText}>Close</Text></TouchableOpacity>
                                </View>
                            </View>
                        </Modal>
                        <Text style={styles.modalTitle}>{editingItem ? 'Edit Shinning' : 'New Shinning'}</Text>
                        <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#ADB5BD" value={newTitle} onChangeText={setNewTitle} editable={!isTaggingPhase}/>
                        <TextInput style={[styles.input, styles.contentInput]} placeholder="Start writing your Shinning..." placeholderTextColor="#ADB5BD" value={newContent} onChangeText={setNewContent} multiline={true} editable={!isTaggingPhase}/>
                        {!isTaggingPhase && <TouchableOpacity style={[styles.button, styles.linkButton]} onPress={() => setLinkModalVisible(true)}><Text style={styles.linkButtonText}>Add Link</Text></TouchableOpacity>}
                        {(isTaggingPhase || editingItem) && (<>
                            {currentTags.length > 0 && (<View><Text style={styles.aiHeader}>Selected Tags:</Text><View style={styles.tagsContainer}>{currentTags.map(tag => (<TouchableOpacity key={tag} style={styles.tag} onPress={() => handleRemoveTag(tag)}><Text style={styles.tagText}>{tag} ✕</Text></TouchableOpacity>))}</View></View>)}
                            <View style={styles.customTagContainer}><TextInput style={styles.customTagInput} placeholder="Add a custom tag..." value={customTagInput} onChangeText={setCustomTagInput} /><TouchableOpacity style={styles.addTagButton} onPress={handleAddCustomTag}><Text style={styles.addTagButtonText}>Add</Text></TouchableOpacity></View>
                        </>)}
                        {isAILoading && <ActivityIndicator style={{ marginVertical: 10 }} />}
                        {aiError && <Text style={styles.errorText}>{aiError}</Text>}
                        {isTaggingPhase && suggestedTags.length > 0 && (<View><Text style={styles.aiHeader}>AI Suggested Tags:</Text><View style={styles.tagsContainer}>{suggestedTags.map(tag => (<TouchableOpacity key={tag} style={styles.suggestedTag} onPress={() => handleAddTag(tag)}><Text style={styles.suggestedTagText}>+ {tag}</Text></TouchableOpacity>))}</View></View>)}
                        <View style={styles.buttonContainer}>
                        {isTaggingPhase ?
                            (<TouchableOpacity style={[styles.button, styles.saveButton]} onPress={closeAndResetModal}><Text style={styles.saveButtonText}>Done</Text></TouchableOpacity>) :
                            (<>
                                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={closeAndResetModal}><Text style={styles.cancelButtonText}>Cancel</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveOrUpdateShinning}><Text style={styles.saveButtonText}>{editingItem ? 'Save' : 'Save & Suggest Tags'}</Text></TouchableOpacity>
                            </>)
                        }
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    </GestureHandlerRootView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  splashContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
  splashTitle: { fontSize: 48, fontWeight: 'bold', color: '#212529' },
  frontPanel: { flex: 1, backgroundColor: '#F8F9FA', shadowColor: '#000', shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E9ECEF', backgroundColor: 'white' },
  menuButton: { padding: 4, width: 40, alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '600', color: '#212529' },
  iconText: { fontSize: 24, color: '#212529' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  tag: { backgroundColor: '#E9ECEF', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, marginRight: 8, marginBottom: 8 },
  tagText: { color: '#495057', fontSize: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', height: height * 0.6 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#495057', textAlign: 'center' },
  emptySubText: { fontSize: 14, color: '#6C757D', textAlign: 'center', marginTop: 8 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalBackdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  modalView: { width: '90%', maxHeight: '80%', backgroundColor: 'white', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#212529' },
  input: { borderWidth: 1, borderColor: '#DEE2E6', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16, color: '#212529' },
  contentInput: { height: 150, textAlignVertical: 'top' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },
  button: { borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20, marginLeft: 10 },
  cancelButton: { backgroundColor: '#F1F3F5' },
  cancelButtonText: { color: '#495057', fontWeight: '600' },
  saveButton: { backgroundColor: '#212529' },
  saveButtonText: { color: 'white', fontWeight: '600' },
  linkButton: { backgroundColor: '#E7F5FF', alignSelf: 'flex-start' },
  linkButtonText: { color: '#003F5C', fontWeight: '600' },
  menuContainer: { position: 'absolute', left: 0, top: 0, bottom: 0, width: MENU_WIDTH, backgroundColor: 'white', paddingTop: 60, paddingHorizontal: 20, borderRightWidth: 1, borderRightColor: '#E9ECEF' },
  menuHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F3F5' },
  menuAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  menuTitle: { fontSize: 18, fontWeight: 'bold', color: '#212529' },
  menuSubtitle: { fontSize: 12, color: '#6C757D' },
  menuDivider: { height: 1, backgroundColor: '#E9ECEF', marginVertical: 10 },
  menuItem: { paddingVertical: 15 },
  menuItemText: { fontSize: 18, color: '#343A40' },
  aiHeader: { fontSize: 14, fontWeight: '600', color: '#6C757D', marginVertical: 10 },
  suggestedTag: { backgroundColor: '#E7F5FF', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#A5D8FF' },
  suggestedTagText: { color: '#003F5C', fontSize: 14, fontWeight: '500' },
  errorText: { color: '#D9480F', textAlign: 'center', marginBottom: 10, },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  menuModalContainer: { width: '80%', backgroundColor: 'white', borderRadius: 12, padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2, }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, },
  menuModalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', paddingVertical: 10, color: '#212529' },
  menuModalItem: { paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#F1F3F5' },
  menuModalItemText: { textAlign: 'center', fontSize: 16, color: '#003F5C' },
  customTagContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10, },
  customTagInput: { flex: 1, borderWidth: 1, borderColor: '#DEE2E6', borderRadius: 8, padding: 10, fontSize: 14, },
  addTagButton: { backgroundColor: '#343A40', borderRadius: 8, padding: 10, marginLeft: 10, },
  addTagButtonText: { color: 'white', fontWeight: '600', },
  linkModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  linkModalView: { width: '90%', height: '60%', backgroundColor: 'white', borderRadius: 20, padding: 24 },
  linkListItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F3F5' },
  toastOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.1)' },
  toast: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 10, maxWidth: '80%', },
  toastIcon: { color: 'white', marginRight: 12, fontSize: 20, fontWeight: 'bold' },
  toastText: { color: 'white', fontWeight: '600', fontSize: 16 },
  menuClickableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.0)', 
    zIndex: 1,
  },
});
