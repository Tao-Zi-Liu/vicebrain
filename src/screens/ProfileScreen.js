import React, { useState, useEffect, memo } from 'react'; // <-- IMPORT memo
import {  View,  
          Text,  
          StyleSheet,  
          ScrollView,  
          TouchableOpacity,  
          TextInput,  
          Image,  
          Alert,  
          Switch,  
          SafeAreaView,  
          StatusBar,  
          Modal,  
          ActivityIndicator
        } from 'react-native';
import { useAppContext } from '../context/AppContext';
import firebaseService from '../services/firebaseService';
import { useGestureContext } from '../context/GestureContext';
import useGestureManager from '../hooks/useGestureManager';
import { FlingGestureHandler, Directions, State } from 'react-native-gesture-handler';

const ProfileScreen = ({ onBack }) => {
  const { state, actions } = useAppContext();
  const { gestureState } = useGestureContext();
  const { createBackGestureHandler } = useGestureManager();

  const backGestureHandler = createBackGestureHandler(onBack);
  const { user, userProfile } = state;
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    email: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (user) {
      setEditForm({
        displayName: user.displayName || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Profile</Text>
      <View style={styles.headerSpace} />
    </View>
  );
  const GuestWarningSection = ({ onSignUp }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Guest Account</Text>
    <View style={styles.guestCard}>
      <Text style={styles.guestText}>Your work is not saved permanently. To secure your data and unlock all features, please create a free account.</Text>
      <TouchableOpacity style={styles.upgradeButton} onPress={onSignUp}>
        <Text style={styles.upgradeButtonText}>Sign Up for Free</Text>
      </TouchableOpacity>
    </View>
  </View>
);
  const AccountSection = ({
  isEditing,
  user,
  editForm,
  setEditForm,
  setIsEditing,
  handleSaveProfile
  }
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account Information</Text>
      
      <View style={styles.profileCard}>
        <Image 
          source={{ 
            uri: user?.photoURL || 'https://placehold.co/80x80/E9ECEF/495057?text=User' 
          }} 
          style={styles.avatar}
        />
        
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editForm.displayName}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, displayName: text }))}
              placeholder="Display Name"
            />
            <Text style={styles.editEmail}>{editForm.email}</Text>
            <View style={styles.editButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{user?.displayName || 'Anonymous User'}</Text>
            <Text style={styles.email}>{user?.email || 'No email set'}</Text>
            <Text style={styles.uid}>UID: {user?.uid.substring(0, 8)}...</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const SubscriptionSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Subscription & Membership</Text>
      
      <View style={styles.subscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <Text style={styles.subscriptionType}>
            {userProfile?.accountType === 'pro' ? 'Pro Member' : 'Free User'}
          </Text>
          {userProfile?.accountType === 'pro' && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        
        {userProfile?.accountType === 'free' ? (
          <View>
            <Text style={styles.creditsText}>
              Remaining AI Credits: {userProfile?.aiCredits || 0}
            </Text>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buyCreditsButton}>
              <Text style={styles.buyCreditsButtonText}>Buy Credit Pack</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.proExpiry}>
              Expires on: {userProfile?.proExpiresAt || 'Never'}
            </Text>
            <TouchableOpacity style={styles.manageSubscriptionButton}>
              <Text style={styles.manageSubscriptionButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {userProfile?.accountType === 'free' && (
          <View style={styles.proFeatures}>
            <Text style={styles.proFeaturesTitle}>Pro Benefits</Text>
            <Text style={styles.proFeature}>• Unlimited AI features</Text>
            <Text style={styles.proFeature}>• Advanced Knowledge Graph analysis</Text>
            <Text style={styles.proFeature}>• Path Finding feature</Text>
            <Text style={styles.proFeature}>• Export all your data</Text>
            <Text style={styles.proFeature}>• Priority support</Text>
          </View>
        )}
      </View>
    </View>
  );

  const SecuritySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Security Center</Text>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => setShowPasswordModal(true)}
      >
        <Text style={styles.menuItemText}>Change Password</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuItemText}>Manage Sign-in Methods</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={handleSignOut}
      >
        <Text style={[styles.menuItemText, styles.signOutText]}>Sign Out</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const DataSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Data & Storage</Text>
      
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Data Statistics</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Total Shinnings:</Text>
          <Text style={styles.statsValue}>{state.shinnings.length}</Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Text Notes:</Text>
          <Text style={styles.statsValue}>
            {state.shinnings.filter(s => s.type === 'text').length}
          </Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Multimedia Content:</Text>
          <Text style={styles.statsValue}>
            {state.shinnings.filter(s => s.type !== 'text').length}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuItemText}>Export Data</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuItemText}>Empty Trash</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const GeneralSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>General Settings</Text>
      
      <View style={styles.menuItem}>
        <Text style={styles.menuItemText}>Dark Mode</Text>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: '#E9ECEF', true: '#007AFF' }}
          thumbColor={darkMode ? '#FFFFFF' : '#FFFFFF'}
        />
      </View>
      
      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuItemText}>Notification Settings</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuItemText}>About Us</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuItemText}>Help & Feedback</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuItemText}>Legal</Text>
        <Text style={styles.menuItemArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const PasswordModal = () => (
    <Modal
      visible={showPasswordModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPasswordModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Change Password</Text>
          
          <TextInput
            style={styles.passwordInput}
            placeholder="Current Password"
            secureTextEntry
            value={passwordForm.currentPassword}
            onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
          />
          
          <TextInput
            style={styles.passwordInput}
            placeholder="New Password"
            secureTextEntry
            value={passwordForm.newPassword}
            onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
          />
          
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm New Password"
            secureTextEntry
            value={passwordForm.confirmPassword}
            onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setShowPasswordModal(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await firebaseService.updateUserProfile(user.uid, {
        displayName: editForm.displayName
      });
      setIsEditing(false);
      actions.showToast('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      actions.showToast('Update failed, please try again', 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      actions.showToast('New passwords do not match', 'ERROR');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      actions.showToast('New password must be at least 6 characters', 'ERROR');
      return;
    }

    try {
      setLoading(true);
      await firebaseService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      actions.showToast('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      let errorMessage = 'Failed to change password, please try again';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect current password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests, please try again later';
      }
      actions.showToast(errorMessage, 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Confirm Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebaseService.signOut();
              actions.showToast('You have been signed out successfully');
            } catch (error) {
              console.error('Sign out failed:', error);
              actions.showToast('Sign out failed, please try again', 'ERROR');
            }
          }
        }
      ]
    );
  };

  return (
    <FlingGestureHandler
    direction={Directions.RIGHT}
    enabled={!gestureState.isMenuOpen}
    onHandlerStateChange={backGestureHandler.onHandlerStateChange}
    >
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Header />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* --- MODIFICATION START --- */}
        {userProfile?.accountType === 'guest' ? (
          <>
            <GuestWarningSection onSignUp={handleSignOut} />
            <View style={{paddingHorizontal: 16, marginTop: 10}}>
               <TouchableOpacity 
                style={styles.menuItem}
                onPress={handleSignOut}
              >
                <Text style={[styles.menuItemText, styles.signOutText]}>Exit Guest Mode</Text>
                <Text style={styles.menuItemArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <AccountSection
              isEditing={isEditing}
              user={user}
              editForm={editForm}
              setEditForm={setEditForm}
              setIsEditing={setIsEditing}
              handleSaveProfile={handleSaveProfile}
            />
            <SubscriptionSection /> 
            <SecuritySection />
            <DataSection />
            <GeneralSection />
          </>
        )}
        {/* --- MODIFICATION END --- */}
      </ScrollView>

      <PasswordModal />
    </SafeAreaView>
  </FlingGestureHandler>
  );
};

const styles = StyleSheet.create({
  container:{
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  },
  backButton: {
    padding: 4,
    width: 40,
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#212529',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  headerSpace: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 4,
  },
  uid: {
    fontSize: 12,
    color: '#ADB5BD',
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: '#E7F5FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#003F5C',
    fontWeight: '500',
  },
  editContainer: {
    flex: 1,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  editEmail: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 12,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#F1F3F5',
  },
  cancelButtonText: {
    color: '#495057',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#212529',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  subscriptionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  proBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  proBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  creditsText: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  upgradeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buyCreditsButton: {
    backgroundColor: '#E7F5FF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buyCreditsButtonText: {
    color: '#003F5C',
    fontWeight: '500',
  },
  proExpiry: {
    fontSize: 16,
    color: '#6C757D',
    marginBottom: 16,
  },
  manageSubscriptionButton: {
    backgroundColor: '#E7F5FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageSubscriptionButtonText: {
    color: '#003F5C',
    fontWeight: '500',
  },
  proFeatures: {
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
    paddingTop: 16,
  },
  proFeaturesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  proFeature: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  menuItem: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#212529',
  },
  signOutText: {
    color: '#DC3545',
  },
  menuItemArrow: {
    fontSize: 18,
    color: '#ADB5BD',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    guestCard: {
    backgroundColor: '#FFF9DB',
    borderRadius: 12,
    padding: 20,
    borderColor: '#FAEBBC',
    borderWidth: 1,
  },
  guestText: {
    fontSize: 16,
    color: '#857134',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  },
});

// WRAP the component export in memo
export default memo(ProfileScreen);