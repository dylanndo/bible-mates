import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Dimensions, Keyboard, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addReading, getGroupMates, getGroupsForUser, getReadingsForMatesByMonth, getUserProfile } from '../api/firebase';
import CalendarHeader from '../components/Calendar/CalendarHeader';
import MonthView from '../components/Calendar/MonthView';
import JoinGroupModal from '../components/JoinGroupModal';
import SideMenu from '../components/SideMenu';
import { useAuth } from '../contexts/AuthContext';
import { useCalendar } from '../contexts/CalendarContext';
import { Group, Mate, Reading } from '../types';
import { USER_COLORS, getColorForUser } from '../utils/colorHelper';

export default function CalendarScreen() {
  const { viewedDate, setViewedDate } = useCalendar();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pagerRef = useRef<PagerView>(null);

  const [mates, setMates] = useState<Mate[]>([]);
  const [eventList, setEventList] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
      
      if (selectedGroupId) {
          // --- A specific group is selected ---
          const groupMates = await getGroupMates(selectedGroupId);
          const currentGroup = groups.find(g => g.id === selectedGroupId);
          const mateIdsInOrder = currentGroup ? currentGroup.mateIds : [];
          
          const matesWithColors = groupMates.map(mate => {
            let color = getColorForUser(mate.id);
            if (mate.id === user.uid) { color = USER_COLORS[0]; }
            else if (mateIdsInOrder.length > 0) {
                const otherMatesOrder = mateIdsInOrder.filter(id => id !== user.uid);
                const joinIndex = otherMatesOrder.indexOf(mate.id);
                if (joinIndex !== -1) { color = USER_COLORS[(joinIndex + 1) % USER_COLORS.length]; }
            }
            return { ...mate, color };
          });
          setMates(matesWithColors);

          if (matesWithColors.length > 0) {
              const mateIds = matesWithColors.map(m => m.id);
              const readings = await getReadingsForMatesByMonth(mateIds, viewedDate.getFullYear(), viewedDate.getMonth());
              setEventList(readings);
          }
      } else {
          // --- "My Calendar" is selected, or it's the default view for a solo user ---
          const ownReadings = await getReadingsForMatesByMonth([user.uid], viewedDate.getFullYear(), viewedDate.getMonth());
          setEventList(ownReadings);

          const ownProfile = await getUserProfile(user.uid);
          if (ownProfile) {
              const selfWithColor = { ...ownProfile, color: USER_COLORS[0] };
              setMates([selfWithColor]);
          } else {
              setMates([]);
          }
      }
      
      setIsLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [viewedDate, user, selectedGroupId]);

  const handleDateChange = (newDate: Date) => {
    const monthDiff = (newDate.getFullYear() - viewedDate.getFullYear()) * 12 + (newDate.getMonth() - viewedDate.getMonth());
    if (monthDiff === 1) pagerRef.current?.setPage(2);
    else if (monthDiff === -1) pagerRef.current?.setPage(0);
    else setViewedDate(newDate);
  };

  const onPageSelected = (e: { nativeEvent: { position: number } }) => {
    if (e.nativeEvent.position === 1) return; 
    const newDate = new Date(viewedDate.getFullYear(), viewedDate.getMonth() + (e.nativeEvent.position === 0 ? -1 : 1), 1);
    setViewedDate(newDate);
  };

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
      if (logDate.getMonth() === viewedDate.getMonth() && logDate.getFullYear() === viewedDate.getFullYear()) {
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

  const monthsToDisplay = [
    new Date(viewedDate.getFullYear(), viewedDate.getMonth() - 1, 1),
    viewedDate,
    new Date(viewedDate.getFullYear(), viewedDate.getMonth() + 1, 1),
  ];
  
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Drawer
        open={isDrawerOpen}
        onOpen={() => setIsDrawerOpen(true)}
        onClose={() => setIsDrawerOpen(false)}
        drawerStyle={{ width: Dimensions.get('window').width * 0.8 }}
        renderDrawerContent={() => (
            <SideMenu 
                userEmail={user?.email}
                groups={userGroups}
                selectedGroupId={selectedGroupId}
                onSelectGroup={(groupId) => {
                    setSelectedGroupId(groupId ?? null);
                    setIsDrawerOpen(false);
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
                date={viewedDate}
                onDateChange={handleDateChange}
                onLogout={handleLogout}
                onMenuPress={() => setIsDrawerOpen(true)}
            />
            <PagerView
              ref={pagerRef}
              style={styles.pagerView}
              initialPage={1}
              onPageSelected={onPageSelected}
              key={viewedDate.toISOString()}
            >
              {monthsToDisplay.map((monthDate, index) => (
                <View key={index} style={styles.page}>
                  <MonthView
                    events={eventList}
                    mates={mates} 
                    month={monthDate.getMonth()}
                    day={monthDate.getDate()}
                    year={monthDate.getFullYear()}
                    onDayPress={handleDayPress}
                  />
                </View>
              ))}
            </PagerView>
            
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
    pagerView: { flex: 1 },
    page: { flex: 1 },
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
