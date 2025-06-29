import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getGroupMates, getGroupsForUser, getReadingsForMatesByMonth } from '../api/firebase';
import CalendarHeader from '../components/Calendar/CalendarHeader';
import MonthView from '../components/Calendar/MonthView';
import JoinGroupModal from '../components/JoinGroupModal';
import JoinGroupScreen from '../components/JoinGroupScreen';
import SideMenu from '../components/SideMenu';
import { useAuth } from '../contexts/AuthContext';
import { Group, Mate, Reading } from '../types';

export default function CalendarScreen() {
  const [date, setDate] = useState(new Date());
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [mates, setMates] = useState<Mate[]>([]);
  const [eventList, setEventList] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [isSideMenuVisible, setIsSideMenuVisible] = useState(false);
  const [isJoinGroupModalVisible, setIsJoinGroupModalVisible] = useState(false);

  const fetchAllData = async () => {
      if (!user) {
          setIsLoading(false);
          return;
      }
      setIsLoading(true);
      
      const groups = await getGroupsForUser(user.uid);
      setUserGroups(groups);
      
      if (groups && groups.length > 0) {
          const currentGroupId = selectedGroupId || groups[0].id;
          if (!selectedGroupId) {
              setSelectedGroupId(currentGroupId);
          }
          
          const groupMates = await getGroupMates(currentGroupId);
          setMates(groupMates);

          if (groupMates.length > 0) {
              const mateIds = groupMates.map(m => m.id);
              const readings = await getReadingsForMatesByMonth(mateIds, date.getFullYear(), date.getMonth());
              setEventList(readings);
          }
      } else {
          // No groups, clear the data
          setMates([]);
          setEventList([]);
      }
      
      setIsLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [date, user, selectedGroupId]);

  const handleDayPress = (pressedDate: Date) => {
    const dateString = pressedDate.toISOString().slice(0, 10);
    router.push(`/day/${dateString}`);
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/LoginScreen');
  };
  
  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1976d2" /></View>;
  }

  // If the user has no groups, show the JoinGroupScreen
  if (userGroups.length === 0) {
      return <JoinGroupScreen onGroupJoined={fetchAllData} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CalendarHeader
          date={date}
          onDateChange={setDate}
          onLogout={handleLogout}
          onMenuPress={() => setIsSideMenuVisible(true)}
      />
      <MonthView
          events={eventList}
          mates={mates} 
          month={date.getMonth()}
          day={date.getDate()}
          year={date.getFullYear()}
          onDayPress={handleDayPress}
      />
      
      <SideMenu 
        visible={isSideMenuVisible}
        onClose={() => setIsSideMenuVisible(false)}
        userEmail={user?.email}
        groups={userGroups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={(groupId) => {
            setSelectedGroupId(groupId);
            setIsSideMenuVisible(false);
        }}
        onJoinGroupPress={() => {
            setIsSideMenuVisible(false); // Close menu first
            setIsJoinGroupModalVisible(true); // Then open join modal
        }}
        onCreateGroupPress={() => Alert.alert("Coming Soon!", "The ability to create new groups is coming soon.")}
      />

      <JoinGroupModal 
        visible={isJoinGroupModalVisible}
        onClose={() => setIsJoinGroupModalVisible(false)}
        onGroupJoined={fetchAllData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
