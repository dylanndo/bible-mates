import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Group } from '../types';

type Props = {
  userEmail?: string | null;
  groups: Group[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | void) => void;
  onJoinGroupPress: () => void;
  onCreateGroupPress: () => void;
};

const { width } = Dimensions.get('window');

export default function SideMenu({
  userEmail,
  groups,
  selectedGroupId,
  onSelectGroup,
  onJoinGroupPress,
  onCreateGroupPress
}: Props) {
  return (
    <View style={styles.drawer} onStartShouldSetResponder={() => true}>
      <ScrollView style={styles.topSection}>
        <Text style={styles.headerTitle}>Bible Mates</Text>
        <View style={styles.userInfo}>
          <Feather name="user" size={20} color="#555" />
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>
        <View style={styles.divider} />
        <TouchableOpacity
            key="personal-calendar"
            style={[
            styles.groupRow,
            // It is only highlighted if NO group is selected
            selectedGroupId === null && styles.selectedGroupRow,
            ]}
            onPress={() => onSelectGroup(null)}
        >
            <Feather name="calendar" size={20} color={selectedGroupId === null ? '#fff' : '#333'} />
            <Text style={[styles.groupName, selectedGroupId === null && styles.selectedGroupName]}>
            My Calendar
            </Text>
        </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    width: width * 0.8,
    backgroundColor: '#fff',
    paddingTop: 60,
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
