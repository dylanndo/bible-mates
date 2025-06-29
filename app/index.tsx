import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Keyboard, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addReading, getGroupMates, getGroupsForUser, getReadingsForMatesByMonth, getUserProfile } from '../api/firebase';
import CalendarHeader from '../components/Calendar/CalendarHeader';
import MonthView from '../components/Calendar/MonthView';
import JoinGroupModal from '../components/JoinGroupModal';
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
  
  // --- START: FIX ---
  // The drawer's visibility is now controlled by a simple state variable.
  // This is a more stable pattern than using a ref for this library.
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // --- END: FIX ---

  const [isJoinGroupModalVisible, setIsJoinGroupModalVisible] = useState(false);
  const [isLogReadingModalVisible, setIsLogReadingModalVisible] = useState(false);

  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [notes, setNotes] = useState('');
  const [logDate, setLogDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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
          const ownReadings = await getReadingsForMatesByMonth([user.uid], date.getFullYear(), date.getMonth());
          setEventList(ownReadings);
          setMates([]);
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
  
  const handleAddReading = async () => {
    if (!book || !chapter) { Alert.alert('Missing Info', 'Please provide a book and chapter.'); return; }
    if (!user) { Alert.alert('Not Logged In', 'You must be logged in to post a reading.'); return; }
    try {
      const userProfile = await getUserProfile(user.uid);
      if (!userProfile) throw new Error('Could not find user profile.');
      const newReading: Omit<Reading, 'id' | 'userId'> & { userId: string } = {
        userId: user.uid, firstName: userProfile.firstName, book, chapter, notes, date: logDate.toISOString().slice(0, 10),
      };
      await addReading(newReading);
      if (logDate.getMonth() === date.getMonth() && logDate.getFullYear() === date.getFullYear()) {
        setEventList(prev => [...prev, { ...newReading, id: Math.random().toString() }]);
      }
      setBook(''); setChapter(''); setNotes(''); setIsLogReadingModalVisible(false);
      Alert.alert('Success', 'Your reading has been posted!');
    } catch (error) {
      Alert.alert('Error', 'Could not post your reading.');
      console.error(error);
    }
  };
  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') { setShowDatePicker(false); }
    if (event.type === 'set' && selectedDate) { setLogDate(selectedDate); }
  };
  const openLogReadingModal = () => {
    setLogDate(new Date());
    setShowDatePicker(false);
    setIsLogReadingModalVisible(true);
  };

  if (isLoading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1976d2" /></View>;
  }
  
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Drawer
        // --- START: FIX ---
        // The drawer's state is now controlled by the `open` prop.
        open={isDrawerOpen}
        onOpen={() => setIsDrawerOpen(true)}
        onClose={() => setIsDrawerOpen(false)}
        // The prop `renderNavigationView` has been replaced with the correct `renderDrawerContent`.
        renderDrawerContent={() => (
        // --- END: FIX ---
            <SideMenu 
                userEmail={user?.email}
                groups={userGroups}
                selectedGroupId={selectedGroupId}
                onSelectGroup={(groupId) => {
                    setSelectedGroupId(groupId);
                    setIsDrawerOpen(false); // Close drawer after selection
                }}
                onJoinGroupPress={() => {
                    setIsDrawerOpen(false);
                    setIsJoinGroupModalVisible(true);
                }}
                onCreateGroupPress={() => Alert.alert("Coming Soon!", "The ability to create new groups is coming soon.")}
            />
        )}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
            <CalendarHeader
                date={date}
                onDateChange={setDate}
                onLogout={handleLogout}
                onMenuPress={() => setIsDrawerOpen(true)}
            />
            <MonthView
                events={eventList}
                mates={mates} 
                month={date.getMonth()}
                day={date.getDate()}
                year={date.getFullYear()}
                onDayPress={handleDayPress}
            />
            
            <Pressable style={styles.fab} onPress={openLogReadingModal}>
                <Text style={styles.fabIcon}>+</Text>
            </Pressable>
        </SafeAreaView>
      </Drawer>

      <JoinGroupModal 
          visible={isJoinGroupModalVisible}
          onClose={() => setIsJoinGroupModalVisible(false)}
          onGroupJoined={fetchAllData}
      />

      <Modal visible={isLogReadingModalVisible} onRequestClose={() => setIsLogReadingModalVisible(false)} animationType="slide" transparent={true}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.modalOverlay}>
                  <View style={styles.modalView}>
                      <Text style={styles.modalTitle}>Log Your Reading</Text>
                      <View style={styles.datePickerContainer}>
                          <Text style={styles.dateLabel}>Date</Text>
                          {Platform.OS === 'ios' ? (
                              <DateTimePicker value={logDate} mode="date" display="compact" onChange={onChangeDate} maximumDate={new Date()} style={styles.datePickerIOS} />
                          ) : (
                              <Pressable onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}><Text style={styles.datePickerButtonText}>{logDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text></Pressable>
                          )}
                      </View>
                      {showDatePicker && Platform.OS === 'android' && (
                          <DateTimePicker value={logDate} mode="date" display="default" onChange={onChangeDate} maximumDate={new Date()} />
                      )}
                      <TextInput style={styles.input} placeholder="Book (e.g., Genesis)" value={book} onChangeText={setBook} />
                      <TextInput style={styles.input} placeholder="Chapter (e.g., 1)" value={chapter} onChangeText={setChapter} keyboardType="numeric" />
                      <TextInput style={[styles.input, styles.notesInput]} placeholder="Notes/Reflections" value={notes} onChangeText={setNotes} multiline numberOfLines={4} />
                      <Button title="Post Reading" onPress={handleAddReading} />
                      <View style={{ marginTop: 10 }}><Button title="Cancel" onPress={() => setIsLogReadingModalVisible(false)} color="grey" /></View>
                  </View>
              </View>
          </TouchableWithoutFeedback>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    fab: { position: 'absolute', right: 25, bottom: 25, width: 60, height: 60, borderRadius: 30, backgroundColor: '#1976d2', justifyContent: 'center', alignItems: 'center', elevation: 8 },
    fabIcon: { fontSize: 30, color: 'white', lineHeight: 32 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { width: '98%', backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 10, marginBottom: 15, borderRadius: 5 },
    notesInput: { height: 80, textAlignVertical: 'top', paddingTop: 10 },
    datePickerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    dateLabel: { fontSize: 16, color: '#333' },
    datePickerButton: { backgroundColor: '#f0f0f0', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 5 },
    datePickerButtonText: { fontSize: 16, color: '#1976d2', fontWeight: '500' },
    datePickerIOS: { justifyContent: 'flex-end' },
});
