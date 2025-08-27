// src/services/firebaseService.js

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  getStorage, 
  // ... (keep all your other storage imports)
  deleteObject 
} from 'firebase/storage';
import { 
  getAuth, 
  signOut, 
  initializeAuth, 
  getReactNativePersistence,
  reauthenticateWithCredential,
  updatePassword,
  // ... (keep all your other auth imports)
  EmailAuthProvider
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
const firebaseConfig = {
  apiKey: "AIzaSyBKzMxR_NMT7NiUsY3KZpEedTwoPfVANVA",
  authDomain: "vicebrain-5e3f5.firebaseapp.com",
  projectId: "vicebrain-5e3f5",
  storageBucket: "vicebrain-5e3f5.firebasestorage.app",
  messagingSenderId: "124363270573",
  appId: "1:124363270573:web:318060bebe71687eb7d924"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
class FirebaseService {
    subscribeToShinnings(userId, view, sort, onUpdate) {
    const shinningsRef = collection(db, 'users', userId, 'shinnings');
    let q;

    // Set up the query based on the current view (home, archive, trash)
    if (view === 'home') {
      q = query(shinningsRef, where('status', '==', 'active'), orderBy(sort.field, sort.direction));
    } else if (view === 'archive') {
      q = query(shinningsRef, where('status', '==', 'archived'), orderBy(sort.field, sort.direction));
    } else if (view === 'trash') {
      q = query(shinningsRef, where('status', '==', 'trashed'), orderBy(sort.field, sort.direction));
    } else {
      // Default query if view is not recognized
      q = query(shinningsRef, orderBy(sort.field, sort.direction));
    }

    // onSnapshot creates the real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const shinnings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      onUpdate(shinnings);
    }, (error) => {
      console.error("Error listening to shinnings:", error);
    });

    return unsubscribe; // This function will be called to stop listening
  }
  async getAiSuggestedTags(content) {
    const runAiAction = httpsCallable(functions, 'runAiAction');
    try {
      const result = await runAiAction({ 
        action: 'suggestTags', 
        title: '', 
        content: content 
      });
      return result.data.data; // Note: result.data contains {success: true, data: [...]}
    } catch (error) {
      console.error("Error getting AI tags:", error);
      throw new Error("Failed to get AI suggestions.");
    }
  }
    async addShinning(userId, shinningData) {
    const shinningsRef = collection(db, 'users', userId, 'shinnings');
    const newDocRef = doc(shinningsRef); // Generate a new doc with a random ID
    await setDoc(newDocRef, {
      ...shinningData,
      id: newDocRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active'
    });
    return newDocRef.id;
  }

  async updateShinning(userId, shinningId, shinningData) {
    const shinningRef = doc(db, 'users', userId, 'shinnings', shinningId);
    await updateDoc(shinningRef, {
      ...shinningData,
      updatedAt: serverTimestamp()
    });
  }

  async createOrUpdateUserProfile(userId, userData) {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      const defaultProfile = {
        accountType: 'free',
        aiCredits: 10,
        createdAt: serverTimestamp(),
        displayName: userData.displayName || 'Anonymous User',
        email: userData.email || '',
        photoURL: userData.photoURL || '',
        ...userData
      };
      await setDoc(userRef, defaultProfile);
      return defaultProfile;
    } else {
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp()
      });
      return { ...userDoc.data(), ...userData };
    }
  }
    async updateShinningStatus(userId, shinningId, status) {
    const shinningRef = doc(db, 'users', userId, 'shinnings', shinningId);
    await updateDoc(shinningRef, {
      status: status,
      updatedAt: serverTimestamp()
    });
  }

  async deleteShinning(userId, shinningId) {
    const shinningRef = doc(db, 'users', userId, 'shinnings', shinningId);
    await deleteDoc(shinningRef);
  }

  // ... PASTE ALL OTHER METHODS from your original file here ...
  
  async changePassword(currentPassword, newPassword) {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('User not authenticated');
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    await updatePassword(user, newPassword);
  }
  
    async signOut() {
    await signOut(auth);
  }

}

const firebaseService = new FirebaseService();
export default firebaseService;

// Also export the instances for direct use in other files like AppContext
export { db, auth, storage };