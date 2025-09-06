import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, SafeAreaView, Alert
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

const Menu = ({ onClose, onNavigate, onSearch, onSignOut }) => {
  const handleSignOutWithAlert = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: onSignOut }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'space-between', backgroundColor: '#FFFFFF' }}>
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
  );
};

const styles = StyleSheet.create({
  menuHeader: { 
    paddingHorizontal: 16,
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E9ECEF',
    backgroundColor: '#FFFFFF', 
    minHeight: 60 
  },
  menuTitle: { 
    fontSize: 24, 
    fontWeight: 'bold',
    color: '#212529'
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 15, 
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F3F5'
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