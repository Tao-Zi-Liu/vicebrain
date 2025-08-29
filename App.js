// App.js - FINAL CORRECTED VERSION

import React, { useState, useRef } from 'react';
import { Animated, Dimensions, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView, State } from 'react-native-gesture-handler';
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
import useGestureManager from './src/hooks/useGestureManager';
import useScreenNavigation from './src/hooks/useScreenNavigation';

const AppContent = () => {
  const { state, actions } = useAppContext();
  useShinnings();

  const [currentScreen, setCurrentScreen] = useState('main');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const { menuTranslateX, openMenu, closeMenu, onGestureEvent, onHandlerStateChange, isMenuOpen } = useGestureManager();
  const { navigateToScreen, navigateBack, getScreenStyles } = useScreenNavigation();

  const handleNavigate = (screen, data = null) => {
  if (data) actions.setSelectedShinning(data);
  setCurrentScreen(screen);
  navigateToScreen();
  }

  const handleBack = () => {
  navigateBack(() => {
    if (currentScreen === 'detail' || currentScreen === 'profile' || currentScreen === 'graph') {
      setCurrentScreen('main');
    }
  });
};

  const handleMenuNavigate = (view) => {
  closeMenu(() => {
    setIsSearchVisible(false);
    if (view === 'profile' || view === 'graph') {
      setCurrentScreen(view);
      navigateToScreen();
    } else {
      actions.setCurrentView(view);
      setCurrentScreen('main');
    }
  });
};

  const handleMenuSearch = () => {
  closeMenu(() => {
    setIsSearchVisible(true);
  });
  };

  const handleSignOut = () => {
  closeMenu(async () => {
    try {
      await firebaseService.signOut();
      actions.showToast("You have been signed out.");
    } catch (error) {
      actions.showToast("Sign out failed, please try again.", "ERROR");
    }
    });
  };
  const screenStyles = getScreenStyles();
  
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
        isMenuVisible={isMenuOpen}
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
            <Animated.View style={[{ flex: 1 }, screenStyles.mainScreen]}>
                {mainScreen}
            </Animated.View>
            
            {currentScreen !== 'main' && (
                <Animated.View style={[StyleSheet.absoluteFill, screenStyles.detailScreen]}>
                    {(() => {
                        switch (currentScreen) {
                            case 'detail':
                                return <DetailView shinning={state.selectedShinning} onBack={handleBack} onSelectLinkedItem={(item) => handleNavigate('detail', item)} linkedData={state.linkedData} />;
                            case 'profile':
                                return <ProfileScreen onBack={handleBack} />;
                            case 'graph':
                                return (
                                 <KnowledgeGraphScreen
                                 onBack={handleBack}
                                 onSelectShinning={(item) => handleNavigate('detail', item)}
                                  />
                                      );
                            default:
                                return null;
                        }
                    })()}
                </Animated.View>
            )}
        </View>
    );
  };

  return (
    <>
      <Menu
        isVisible={isMenuOpen}
        onClose={closeMenu}
        onNavigate={handleMenuNavigate}
        onSearch={handleMenuSearch}
        onSignOut={handleSignOut}
        translateX={menuTranslateX}
      />
      {renderCurrentScreen()}
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
    </>
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