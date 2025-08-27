// App.js - FINAL CORRECTED VERSION

import React, { useState, useRef } from 'react';
// FIX: Added View and StyleSheet to the import
import { Animated, Dimensions, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView, State } from 'react-native-gesture-handler';

// Other imports remain the same...
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

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75;

const AppContent = () => {
  const { state, actions } = useAppContext();
  const [currentScreen, setCurrentScreen] = useState('main');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  
  useShinnings();

  const menuTranslateX = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const lastPosition = useRef(-MENU_WIDTH);
  const screenTransition = useRef(new Animated.Value(0)).current;

  const onGestureEvent = (event) => {
    const { translationX } = event.nativeEvent;
    console.log('Gesture event:', translationX);
    let newX = lastPosition.current + translationX;
    newX = Math.max(-MENU_WIDTH, Math.min(newX, 0));
    menuTranslateX.setValue(newX);
  };

  const onHandlerStateChange = (event) => {
    const { state: gestureState, translationX, velocityX } = event.nativeEvent;
    console.log('State change:', gestureState, translationX); 
    if (gestureState === State.END) {
      const finalPosition = lastPosition.current + translationX;
      const projectedPosition = finalPosition + 0.2 * velocityX;
      if (projectedPosition > -MENU_WIDTH / 3 || translationX > 50) { // Changed threshold
        openMenu();
    }
      else closeMenu();
    }
  };

  const openMenu = () => {
    actions.setMenuVisible(true);
    Animated.spring(menuTranslateX, { toValue: 0, useNativeDriver: true }).start(() => {
      lastPosition.current = 0;
    });
  };

  const closeMenu = (onComplete) => {
    Animated.spring(menuTranslateX, { toValue: -MENU_WIDTH, useNativeDriver: true }).start(() => {
      lastPosition.current = -MENU_WIDTH;
      actions.setMenuVisible(false);
      if (typeof onComplete === 'function') {
        onComplete();
      }
    });
  };

  const handleNavigate = (screen, data = null) => {
    if (data) actions.setSelectedShinning(data);
    setCurrentScreen(screen);
    Animated.timing(screenTransition, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleBack = () => {
    Animated.timing(screenTransition, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (currentScreen === 'detail' || currentScreen === 'profile' || currentScreen === 'graph') {
        setCurrentScreen('main');
      }
    });
  };

  const handleMenuNavigate = (view) => {
    closeMenu(() => {
        setIsSearchVisible(false);
        if (view === 'profile' || view === 'graph') {
            // For detail screens, navigate directly
            handleNavigate(view);
        } else {
            // For main views, set the view and reset the animation
            actions.setCurrentView(view);
            screenTransition.setValue(0); // Ensure main screen is visible
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
  
  const mainScreenStyle = {
    opacity: screenTransition.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0],
    }),
    transform: [{
        translateX: screenTransition.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -width / 4],
        })
    }]
  };

  const detailScreenStyle = {
      transform: [{
          translateX: screenTransition.interpolate({
              inputRange: [0, 1],
              outputRange: [width, 0],
          })
      }]
  };
  
  const renderCurrentScreen = () => {
    if (state.initializing) return <SplashScreen />;
    if (!state.user) return <AuthScreen showToast={actions.showToast} />;

    const mainScreen = (
        <MainView
            shinnings={state.shinnings} loading={state.loading} 
            currentView={state.currentView} // FIX: Corrected the typo here
            onOpenMenu={openMenu} onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}
            isSearchVisible={isSearchVisible} onToggleSearch={() => setIsSearchVisible(false)}
            isMenuVisible={state.isMenuVisible}
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
            <Animated.View style={[{ flex: 1 }, mainScreenStyle]}>
                {mainScreen}
            </Animated.View>
            
            {currentScreen !== 'main' && (
                <Animated.View style={[StyleSheet.absoluteFill, detailScreenStyle]}>
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
                                 // --- KEY CHANGE: Pass the gesture handlers down ---
                                 onGestureEvent={onGestureEvent}
                                 onHandlerStateChange={onHandlerStateChange}
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
        isVisible={state.isMenuVisible || lastPosition.current > -MENU_WIDTH}
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
        <AppContent />
      </AppProvider>
    </GestureHandlerRootView>
  );
}