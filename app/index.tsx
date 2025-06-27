import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Keyboard, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addReading, getGroupMates, getGroupsForUser, getReadingsForMatesByMonth, getUserProfile } from '../api/firebase';
import CalendarHeader from '../components/Calendar/CalendarHeader';
import MonthView from '../components/Calendar/MonthView';
import { useAuth } from '../contexts/AuthContext'; // Necessary for user info
import { Mate, Reading } from '../types';

export default function CalendarScreen() {
  const [date, setDate] = useState(new Date());

  const { user, signOut } = useAuth();
  const router = useRouter();

  const [mates, setMates] = useState<Mate[]>([]);
  const [eventList, setEventList] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [notes, setNotes] = useState('');

  const [logDate, setLogDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchGroupData = async () => {
        // Don't do anything if the user isn't logged in yet
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        
        // Step 1: Find which group(s) the current user belongs to.
        const userGroups = await getGroupsForUser(user.uid);
        
        // Step 2: If they are in a group, use that group's data.
        if (userGroups && userGroups.length > 0) {
            // For now, we'll just use the first group the user is in.
            const groupId = userGroups[0].id;
            
            // Step 2a: Get all the user profiles for the mates in that group.
            const groupMates = await getGroupMates(groupId);
            setMates(groupMates);

            // Step 2b: Get all the readings for those specific mates for the current month.
            if (groupMates.length > 0) {
                const mateIds = groupMates.map(m => m.id);
                const readings = await getReadingsForMatesByMonth(mateIds, date.getFullYear(), date.getMonth());
                setEventList(readings);
            }
        } else {
            // If the user is not in any group, clear the data.
            setMates([]);
            setEventList([]);
        }
        
        setIsLoading(false);
    };

    fetchGroupData();
    // This hook re-runs whenever the user logs in/out or changes the month.
  }, [date, user]);

  const handleDayPress = (date: Date) => {
    const dateString = date.toISOString().slice(0, 10);
    router.push(`/day/${dateString}`);
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/LoginScreen');
  };

  const handleAddReading = async () => {
    if (!book || !chapter) {
      Alert.alert('Missing Info', 'Please provide a book and chapter.');
      return;
    }
    if (!user) {
      Alert.alert('Not Logged In', 'You must be logged in to post a reading.');
      return;
    }

    try {
      const userProfile = await getUserProfile(user.uid);
      if (!userProfile) throw new Error('Could not find user profile.');

      const newReading: Omit<Reading, 'id' | 'userId'> & { userId: string } = {
        userId: user.uid,
        firstName: userProfile.firstName,
        book,
        chapter,
        notes,
        date: logDate.toISOString().slice(0, 10),
      };

      await addReading(newReading);
      
      if (logDate.getMonth() === date.getMonth() && logDate.getFullYear() === date.getFullYear()) {
        setEventList(prev => [...prev, { ...newReading, id: Math.random().toString() }]);
      }

      // Reset form and close modal
      setBook('');
      setChapter('');
      setNotes('');
      setModalVisible(false);
      Alert.alert('Success', 'Your reading has been posted!');
    } catch (error) {
      Alert.alert('Error', 'Could not post your reading.');
      console.error(error);
    }
  };

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // For Android, we need to hide the picker manually
    if (Platform.OS === 'android') {
        setShowDatePicker(false);
    }
    // event.type === 'set' means the user picked a date.
    // 'dismissed' means they cancelled.
    if (event.type === 'set' && selectedDate) {
      setLogDate(selectedDate);
    }
  };

  return (
    // Your original SafeAreaView is preserved
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
        <CalendarHeader
            date={date}
            onDateChange={setDate}
            onLogout={handleLogout}
        />
        {/* Show a loading indicator while fetching data */}
        {isLoading ? (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1976d2" />
            </View>
        ) : (
            <MonthView
                events={eventList}
                month={date.getMonth()}
                day={date.getDate()}
                year={date.getFullYear()}
                onDayPress={handleDayPress} 
            />
        )}

        <Pressable style={styles.fab} onPress={() => {
            // Reset the log date to today every time the modal is opened
            setLogDate(new Date());
            setModalVisible(true);
        }}>
            <Text style={styles.fabIcon}>+</Text>
        </Pressable>

        <Modal
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
            animationType="slide"
            transparent={true}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Log Your Reading</Text>
                        
                        <View style={styles.datePickerContainer}>
                            <Text style={styles.dateLabel}>Date</Text>
                            {/* On iOS, we render the picker directly as a button. On Android, we use a Pressable to trigger the dialog. */}
                            {Platform.OS === 'ios' ? (
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={logDate}
                                    mode="date"
                                    display="compact" // This style renders as a tappable gray button on iOS
                                    onChange={onChangeDate}
                                    maximumDate={new Date()}
                                    style={styles.datePickerIOS}
                                />
                            ) : (
                                <Pressable onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                                    <Text style={styles.datePickerButtonText}>{logDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text>
                                </Pressable>
                            )}
                        </View>

                        {/* This is now only for Android */}
                        {showDatePicker && Platform.OS === 'android' && (
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={logDate}
                                mode="date"
                                display="default"
                                onChange={onChangeDate}
                                maximumDate={new Date()}
                            />
                        )}
                        <TextInput style={styles.input} placeholder="Book (e.g., Genesis)" value={book} onChangeText={setBook} />
                        <TextInput style={styles.input} placeholder="Chapter (e.g., 1)" value={chapter} onChangeText={setChapter} keyboardType="numeric" />
                        <TextInput 
                            style={[styles.input, styles.notesInput]} 
                            placeholder="Notes/Reflections" 
                            value={notes} 
                            onChangeText={setNotes} 
                            multiline
                            numberOfLines={4}
                        />
                        <Button title="Post Reading" onPress={handleAddReading} />
                        <View style={{ marginTop: 10 }}>
                            <Button title="Cancel" onPress={() => setModalVisible(false)} color="grey" />
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute', 
        right: 25,
        bottom: 25,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1976d2', 
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
    },
    fabIcon: {
        fontSize: 30,
        color: 'white',
        lineHeight: 32,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        marginBottom: 15,
        borderRadius: 5,
    },
    notesInput: {
        height: 80, textAlignVertical: 'top', paddingTop: 10,
    },
    datePickerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    dateLabel: {
        fontSize: 16,
        color: '#333',
    },
    datePickerButton: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    datePickerButtonText: {
        fontSize: 16,
        color: '#1976d2',
        fontWeight: '500',
    },
    datePicker: {
        marginBottom: Platform.OS === 'ios' ? -20 : 0,
    },
    datePickerIOS: {
        justifyContent: 'flex-end',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
