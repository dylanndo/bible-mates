import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, Keyboard, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addReading, getUserProfile } from '../api/firebase';
import CalendarHeader from '../components/Calendar/CalendarHeader';
import MonthView, { CalendarEvent } from '../components/Calendar/MonthView';
import { useAuth } from '../contexts/AuthContext'; // Necessary for user info
import { Reading } from '../types';

// Updated to use the new data structure and with unique IDs
const events: CalendarEvent[] = [
  { id: '1', firstName: 'Dylan', book: 'Genesis', chapter: '1', notes: 'Powerful start!', date: '2025-06-20' },
  { id: '2', firstName: 'Nate', book: 'Psalm', chapter: '23', date: '2025-06-02' },
  { id: '3', firstName: 'Christy', book: 'Matthew', chapter: '5', notes: 'Beatitudes.', date: '2025-06-05' },
  { id: '4', firstName: 'Tov', book: 'Matthew', chapter: '5', notes: 'Beatitudes.', date: '2025-06-05' },
  { id: '5', firstName: 'Dylan', book: 'John', chapter: '1', date: '2025-06-05' },
  { id: '6', firstName: 'Nate', book: 'Proverbs', chapter: '3', date: '2025-06-05' },
];

export default function CalendarScreen() {
  // Your original state management is preserved
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  
  // State needed for the new feature
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [eventList, setEventList] = useState(events); // Manage events in state
  const [modalVisible, setModalVisible] = useState(false);
  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [notes, setNotes] = useState('');

  const [logDate, setLogDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);


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
      
      // Update local state to see the change immediately
      setEventList(prev => [...prev, { ...newReading, id: Math.random().toString() }]);
      
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
            month={selectedMonth}
            year={selectedYear}
            onChangeMonthYear={(m, y) => {
              setSelectedMonth(m);
              setSelectedYear(y);
            }}
            onLogout={handleLogout}
        />
        <MonthView events={eventList} month={selectedMonth} day={selectedDay} year={selectedYear} />

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
                            {/* --- START: EDIT --- */}
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
                        {/* --- END: EDIT --- */}
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
        marginBottom: Platform.OS === 'ios' ? -20 : 0, // Negative margin to reduce space on iOS
    },
    datePickerIOS: {
        // This ensures the button-like picker aligns nicely on the right
        justifyContent: 'flex-end',
    },
});
