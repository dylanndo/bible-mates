import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Group } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  userEmail?: string | null;
  groups: Group[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onJoinGroupPress: () => void;
  onCreateGroupPress: () => void;
};

const { width } = Dimensions.get('window');
const drawerWidth = width * 0.8;

export default function SideMenu({
  visible,
  onClose,
  userEmail,
  groups,
  selectedGroupId,
  onSelectGroup,
  onJoinGroupPress,
  onCreateGroupPress
}: Props) {
  // --- START: ANIMATION EDIT ---
  // Create an animated value for the slide-in position
  const slideAnim = useRef(new Animated.Value(-drawerWidth)).current;

  // Use an effect to animate the drawer in or out when visibility changes
  useEffect(() => {
    if (visible) {
      // Animate in (from -drawerWidth to 0)
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      // Animate out (from 0 to -drawerWidth)
      Animated.timing(slideAnim, {
        toValue: -drawerWidth,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);
  // --- END: ANIMATION EDIT ---

  return (
    <Modal
      animationType="fade" // The background overlay will fade in
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* --- START: ANIMATION EDIT --- */}
        {/* The drawer is now an Animated.View with a transform style */}
        <Animated.View 
          style={[
            styles.drawer, 
            { transform: [{ translateX: slideAnim }] }
          ]} 
          onStartShouldSetResponder={() => true}
        >
        {/* --- END: ANIMATION EDIT --- */}
          <ScrollView style={styles.topSection}>
            <Text style={styles.headerTitle}>Bible Mates</Text>
            <View style={styles.userInfo}>
              <Feather name="user" size={20} color="#555" />
              <Text style={styles.userEmail}>{userEmail}</Text>
            </View>
            <View style={styles.divider} />
            {groups.map(group => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.groupRow,
                  group.id === selectedGroupId && styles.selectedGroupRow
                ]}
                onPress={() => onSelectGroup(group.id)}
              >
                <Feather name="users" size={20} color={group.id === selectedGroupId ? '#fff' : '#333'} />
                <Text style={[styles.groupName, group.id === selectedGroupId && styles.selectedGroupName]}>
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.bottomSection}>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem} onPress={onJoinGroupPress}>
              <Feather name="plus-circle" size={20} color="#333" />
              <Text style={styles.menuItemText}>Join a Group</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={onCreateGroupPress}>
              <Feather name="plus-square" size={20} color="#333" />
              <Text style={styles.menuItemText}>Create a Group</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: drawerWidth,
    backgroundColor: '#fff',
    paddingTop: 60,
    elevation: 16,
  },
  topSection: {
    flex: 1,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976d2',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  userEmail: {
    marginLeft: 10,
    fontSize: 16,
    color: '#555',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
    marginHorizontal: -10,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
  },
  selectedGroupRow: {
    backgroundColor: '#1976d2',
  },
  groupName: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  selectedGroupName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomSection: {
    paddingHorizontal: 10,
    paddingBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
});
