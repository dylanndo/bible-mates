import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Keyboard, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { addReading, getReadingsForDate, getUserProfile } from '../../api/firebase'; // We already have this function
import { CalendarEvent } from '../../components/Calendar/MonthView';
import { useAuth } from '../../contexts/AuthContext';
import { Reading } from '../../types';

export default function DayViewScreen() {
    // Get the date from the URL parameter
    const { date } = useLocalSearchParams<{ date: string }>();
    const [readings, setReadings] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Logic for the FAB and Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [book, setBook] = useState('');
    const [chapter, setChapter] = useState('');
    const [notes, setNotes] = useState('');
    const [logDate, setLogDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (date) {
            const fetchReadings = async () => {
                setIsLoading(true);
                const fetchedReadings = await getReadingsForDate(date);
                setReadings(fetchedReadings);
                setIsLoading(false);
            };
            fetchReadings();
        }
    }, [date]); // Re-fetch if the date changes

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
                userId: user.uid, firstName: userProfile.firstName, book, chapter, notes, date: logDate.toISOString().slice(0, 10),
            };
            await addReading(newReading);
            // If the user adds a reading for the currently viewed day, update the list
            if (logDate.toISOString().slice(0, 10) === date) {
                setReadings(prev => [...prev, { ...newReading, id: Math.random().toString() }]);
            }
            setBook(''); setChapter(''); setNotes(''); setModalVisible(false);
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
    const openModal = () => {
        setLogDate(new Date()); setShowDatePicker(false); setModalVisible(true);
    };

    if (isLoading) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Functional, un-styled version of the header and content */}
            <Text style={styles.headerText}>Readings for {date}</Text>
            
            <ScrollView style={styles.contentContainer}>
                {readings.length > 0 ? (
                    readings.map(reading => (
                        <View key={reading.id} style={styles.eventBlock}>
                            <Text>{reading.firstName}: {reading.book} {reading.chapter}</Text>
                        </View>
                    ))
                ) : (
                    <Text>No readings for this day.</Text>
                )}
            </ScrollView>

            {/* --- Reused FAB and Modal --- */}
            <Pressable style={styles.fab} onPress={openModal}>
                <Text style={styles.fabIcon}>+</Text>
            </Pressable>
            <Modal visible={modalVisible} onRequestClose={() => setModalVisible(false)} animationType="slide" transparent={true}>
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
                            <View style={{ marginTop: 10 }}><Button title="Cancel" onPress={() => setModalVisible(false)} color="grey" /></View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerText: { fontSize: 24, fontWeight: 'bold', padding: 16 },
    contentContainer: { flex: 1, paddingHorizontal: 16 },
    eventBlock: { padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
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
