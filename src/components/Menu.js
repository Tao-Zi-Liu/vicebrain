// src/components/Menu.js - FINAL WORKING VERSION

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, SafeAreaView, Modal, Alert
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75;

const iconComponents = { MaterialCommunityIcons, FontAwesome5 };

const MenuItem = ({ iconName, iconSet = 'MaterialCommunityIcons', text, onPress }) => {
  const IconComponent = iconComponents[iconSet];
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <IconComponent name={iconName} size={22} style={styles.menuIcon} />
      <Text style={styles.menuItemText}>{text}</Text>
    </TouchableOpacity>
  );
};

const Menu = ({ isVisible, onClose, onNavigate, onSearch, onSignOut, translateX }) => {
  const [slideAnim] = React.useState(new Animated.Value(-MENU_WIDTH));
  const [modalVisible, setModalVisible] = React.useState(false);

  React.useEffect(() => {
    if (isVisible) {
      // Opening: show modal immediately, then animate in
      setModalVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    } else {
      // Closing: animate out first, then hide modal
      Animated.timing(slideAnim, {
        toValue: -MENU_WIDTH,
        duration: 250,
        useNativeDriver: true
      }).start((finished) => {
        if (finished) {
          setModalVisible(false);
        }
      });
    }
  }, [isVisible]);

  const handleSignOutWithAlert = () => {
    onClose();
    Alert.alert( "Sign Out", "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: onSignOut }
      ]
    );
  };

  return (
    <Modal transparent visible={modalVisible} animationType="none">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View 
          style={[
            styles.menuContainer,
            {
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <SafeAreaView style={{ flex: 1, justifyContent: 'space-between' }}>
            <View>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Vicebrain</Text>
              </View>
              
              <MenuItem iconName="magnify" text="Search" onPress={onSearch} />
              <MenuItem iconName="fire" text="Shinning Firing" onPress={() => onNavigate('home')} />
              <MenuItem iconName="archive-arrow-down-outline" text="Archive" onPress={() => onNavigate('archive')} />
              <MenuItem iconName="dizzy" iconSet="FontAwesome5" text="Trash" onPress={() => onNavigate('trash')} />
              <MenuItem iconName="graphql" text="Graph" onPress={() => onNavigate('graph')} />
            </View>
            
            <View>
              <MenuItem iconName="user-secret" iconSet="FontAwesome5" text="Profile" onPress={() => onNavigate('profile')} />
              <MenuItem iconName="sign-out-alt" iconSet="FontAwesome5" text="Sign Out" onPress={handleSignOutWithAlert} />
            </View>
          </SafeAreaView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  menuContainer: { 
    position: 'absolute',
    left: 0,
    top: 0,
    width: MENU_WIDTH, 
    height: '100%', 
    backgroundColor: '#F8F9FA'
  },
  menuHeader: { 
    paddingHorizontal: 20, 
    paddingVertical: 30, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E9ECEF' 
  },
  menuTitle: { 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15, 
    paddingHorizontal: 20 
  },
  menuIcon: { 
    marginRight: 20, 
    width: 24, 
    textAlign: 'center', 
    color: '#495057' 
  },
  menuItemText: { 
    fontSize: 18, 
    fontWeight: '500', 
    color: '#212529' 
  },
});

export default Menu;