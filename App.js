// App.js - FINAL CORRECTED VERSION

import React, { useState } from 'react';
import { View, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import './src/services/firebaseService';
import firebaseService from './src/services/firebaseService';
import { AppProvider, useAppContext } from './src/context/AppContext';
import useShinnings from './src/hooks/useShinnings';
import AuthScreen from './src/screens/AuthScreen';
import MainView from './src/screens/MainView';
import DetailView from './src/screens/DetailView';
import ProfileScreen from './src/screens/ProfileScreen';
import KnowledgeGraphScreen from './src/screens/KnowledgeGraphScreen';
import SplashScreen from './src/components/SplashScreen';
import Toast from './src/components/Toast';
import AddModal from './src/components/AddModal';
import Menu from './src/components/Menu';
import { GestureProvider } from './src/context/GestureContext';
import useScreenNavigation from './src/hooks/useScreenNavigation';
import { useMenuGesture } from './src/hooks/useMenuGesture';

const MENU_WIDTH = Dimensions.get('window').width * 0.75;
const AppContent = () => {
  const { state, actions } = useAppContext();
  useShinnings();

  const [currentScreen, setCurrentScreen] = useState('main');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  const {
    panGesture,
    contentStyle,
    openMenu,
    closeMenu
  } = useMenuGesture((isOpen) => {
    setIsMenuVisible(isOpen);
  });
  
  const { navigateToScreen, navigateBack, getScreenStyles } = useScreenNavigation();

  const handleNavigate = (screen, data = null) => {
    if (data) actions.setSelectedShinning(data);
    setCurrentScreen(screen);
    navigateToScreen();
  };

  const handleBack = () => {
    navigateBack(() => {
      if (currentScreen === 'detail' || currentScreen === 'profile' || currentScreen === 'graph') {
        setCurrentScreen('main');
      }
    });
  };

  const handleMenuNavigate = (view) => {
    closeMenu();
    setTimeout(() => {
      setIsSearchVisible(false);
      if (view === 'profile' || view === 'graph') {
        setCurrentScreen(view);
        navigateToScreen();
      } else {
        actions.setCurrentView(view);
        setCurrentScreen('main');
      }
    }, 300);
  };

  const handleMenuSearch = () => {
    closeMenu();
    setTimeout(() => {
      setIsSearchVisible(true);
    }, 300);
  };

  const handleSignOut = () => {
    closeMenu();
    setTimeout(async () => {
      try {
        await firebaseService.signOut();
        actions.showToast("You have been signed out.");
      } catch (error) {
        actions.showToast("Sign out failed, please try again.", "ERROR");
      }
    }, 300);
  };
  
  const renderCurrentScreen = () => {
    if (state.initializing) return <SplashScreen />;
    if (!state.user) return <AuthScreen showToast={actions.showToast} />;

    const mainScreen = (
      <MainView
        shinnings={state.shinnings} 
        loading={state.loading} 
        currentView={state.currentView}
        onOpenMenu={openMenu}
        isSearchVisible={isSearchVisible} 
        onToggleSearch={() => setIsSearchVisible(false)}
        isMenuVisible={isMenuVisible}
        onSelectShinning={(shinning) => handleNavigate('detail', shinning)}
        onOpenAddModal={() => actions.toggleModal('add', true)}
        onOpenEditModal={(shinning) => {
          actions.setSelectedShinning(shinning);
          actions.toggleModal('add', true);
        }}
        onSetStatus={(id, status) => firebaseService.updateShinningStatus(state.user.uid, id, status)}
        onDeletePermanently={(id) => firebaseService.deleteShinning(state.user.uid, id)}
      />
    );

    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {mainScreen}
        </View>
        
        {currentScreen !== 'main' && (
          <View style={[StyleSheet.absoluteFill]}>
            {(() => {
              switch (currentScreen) {
                case 'detail':
                  return <DetailView shinning={state.selectedShinning} onBack={handleBack} onSelectLinkedItem={(item) => handleNavigate('detail', item)} linkedData={state.linkedData} />;
                case 'profile':
                  return <ProfileScreen onBack={handleBack} />;
                case 'graph':
                  return <KnowledgeGraphScreen onBack={handleBack} onSelectShinning={(item) => handleNavigate('detail', item)} />;
                default:
                  return null;
              }
            })()}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Menu Layer */}
      <View style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: MENU_WIDTH,
        zIndex: 0
      }}>
        <Menu
          onClose={closeMenu}
          onNavigate={handleMenuNavigate}
          onSearch={handleMenuSearch}
          onSignOut={handleSignOut}
        />
      </View>

      {/* Content Layer */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[
          { 
            flex: 1, 
            backgroundColor: '#F8F9FA',
            zIndex: 1
          }, 
          contentStyle
        ]}>
          {renderCurrentScreen()}
          
          {isMenuVisible && (
            <TouchableOpacity 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.3)'
              }}
              onPress={closeMenu}
              activeOpacity={1}
            />
          )}
        </Animated.View>
      </GestureDetector>

      {state.toast.visible && (
        <Toast message={state.toast.message} type={state.toast.type} onHide={actions.hideToast} />
      )}
      {state.modals.add && (
        <AddModal
          visible={state.modals.add}
          onClose={() => {
            actions.toggleModal('add', false);
            actions.setSelectedShinning(null);
          }}
          shinningToEdit={state.selectedShinning}
        />
      )}
    </View>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <GestureProvider>
          <AppContent />
        </GestureProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}