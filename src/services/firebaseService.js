// src/services/firebaseService.js - COMPLETE VERSION WITH ALL OPTIMIZATIONS

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
  getDocs,
  serverTimestamp,
  writeBatch,
  limit
} from 'firebase/firestore';
import { 
  getStorage, 
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { 
  getAuth, 
  signOut, 
  initializeAuth, 
  getReactNativePersistence,
  reauthenticateWithCredential,
  updatePassword,
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
  // ==================== SHINNING CRUD OPERATIONS ====================
  
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

  // ==================== VERSION HISTORY OPERATIONS ====================
  
  async saveVersion(userId, shinningId, content, title) {
    const versionRef = doc(
      db, 
      'users', 
      userId, 
      'shinnings', 
      shinningId, 
      'versions', 
      Date.now().toString()
    );
    
    await setDoc(versionRef, {
      content,
      title,
      timestamp: serverTimestamp(),
      contentLength: content.length
    });
  }

  async getVersionHistory(userId, shinningId, limitCount = 10) {
    const versionsRef = collection(db, 'users', userId, 'shinnings', shinningId, 'versions');
    const q = query(versionsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async restoreVersion(userId, shinningId, versionId) {
    const versionRef = doc(db, 'users', userId, 'shinnings', shinningId, 'versions', versionId);
    const versionDoc = await getDoc(versionRef);
    
    if (!versionDoc.exists()) {
      throw new Error('Version not found');
    }
    
    const versionData = versionDoc.data();
    await this.updateShinning(userId, shinningId, {
      content: versionData.content,
      title: versionData.title
    });
    
    return versionData;
  }

  // ==================== BULK OPERATIONS ====================
  
  async bulkUpdateStatus(userId, shinningIds, status) {
    const batch = writeBatch(db);
    
    shinningIds.forEach(id => {
      const ref = doc(db, 'users', userId, 'shinnings', id);
      batch.update(ref, { 
        status, 
        updatedAt: serverTimestamp() 
      });
    });
    
    await batch.commit();
  }

  async bulkDelete(userId, shinningIds) {
    const batch = writeBatch(db);
    
    shinningIds.forEach(id => {
      const ref = doc(db, 'users', userId, 'shinnings', id);
      batch.delete(ref);
    });
    
    await batch.commit();
  }

  // ==================== AI OPERATIONS ====================
  
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
      
      // Handle specific error cases
      if (error.code === 'functions/failed-precondition') {
        throw new Error("Insufficient credits. Please purchase more credits.");
      } else if (error.code === 'functions/unauthenticated') {
        throw new Error("Please sign in to use AI features.");
      }
      
      throw new Error("Failed to get AI suggestions. Please try again.");
    }
  }

  async runAiAction(actionType, data) {
    const runAiAction = httpsCallable(functions, 'runAiAction');
    try {
      const result = await runAiAction({ 
        action: actionType,
        ...data
      });
      return result.data;
    } catch (error) {
      console.error(`Error running AI action ${actionType}:`, error);
      
      if (error.code === 'functions/failed-precondition') {
        throw new Error("Insufficient credits.");
      }
      
      throw new Error("AI action failed. Please try again.");
    }
  }

  // ==================== USER PROFILE OPERATIONS ====================
  
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

  async getUserProfile(userId) {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  }

  // ==================== AUTHENTICATION OPERATIONS ====================
  
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

  // ==================== STORAGE OPERATIONS ====================
  
  async uploadFile(userId, file, type) {
    const timestamp = Date.now();
    const filename = `${userId}/${type}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, filename);
    
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: filename,
      type: type,
      size: file.size
    };
  }

  async deleteFile(filePath) {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  }

  // ==================== ANALYTICS OPERATIONS ====================
  
  async trackUsage(userId, action, metadata = {}) {
    const analyticsRef = doc(db, 'users', userId, 'analytics', 'current_month');
    const analyticsDoc = await getDoc(analyticsRef);
    
    if (analyticsDoc.exists()) {
      const currentData = analyticsDoc.data();
      await updateDoc(analyticsRef, {
        [`${action}Count`]: (currentData[`${action}Count`] || 0) + 1,
        lastUpdated: serverTimestamp(),
        ...metadata
      });
    } else {
      await setDoc(analyticsRef, {
        [`${action}Count`]: 1,
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
        lastUpdated: serverTimestamp(),
        ...metadata
      });
    }
  }

  // ==================== SEARCH OPERATIONS ====================
  
  async searchShinnings(userId, searchQuery) {
    // Simple client-side search
    // For production, consider using Algolia or Firestore full-text search
    const shinningsRef = collection(db, 'users', userId, 'shinnings');
    const q = query(shinningsRef, where('status', '==', 'active'));
    
    const snapshot = await getDocs(q);
    const allShinnings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const lowerQuery = searchQuery.toLowerCase();
    return allShinnings.filter(shinning => 
      shinning.title.toLowerCase().includes(lowerQuery) ||
      shinning.content.toLowerCase().includes(lowerQuery) ||
      shinning.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  // ==================== LINKED DATA OPERATIONS ====================
  
  async getLinkedData(userId, shinningId) {
    const shinningsRef = collection(db, 'users', userId, 'shinnings');
    const snapshot = await getDocs(shinningsRef);
    const allShinnings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Find backlinks (shinnings that link to this one)
    const backlinks = allShinnings.filter(s => 
      s.outgoingLinks?.includes(shinningId)
    );
    
    // Get outgoing links
    const currentShinning = allShinnings.find(s => s.id === shinningId);
    const outgoingLinks = currentShinning?.outgoingLinks 
      ? allShinnings.filter(s => currentShinning.outgoingLinks.includes(s.id))
      : [];
    
    return {
      backlinks,
      outgoingLinks
    };
  }
}

const firebaseService = new FirebaseService();
export default firebaseService;

// Also export the instances for direct use in other files
export { db, auth, storage, functions };