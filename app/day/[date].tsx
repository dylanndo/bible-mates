import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Keyboard, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { addReading, getReadingsForDate, getUserProfile } from '../../api/firebase';
import CalendarHeader from '../../components/Calendar/CalendarHeader';
import { CalendarEvent } from '../../components/Calendar/MonthView';
import { useAuth } from '../../contexts/AuthContext';
import { Reading } from '../../types';

const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function DayViewScreen() {
    const { date } = useLocalSearchParams<{ date: string }>();
    const router = useRouter();
    
    const [viewedDate, setViewedDate] = useState<Date | null>(null);
    const [readings, setReadings] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [modalVisible, setModalVisible] = useState(false);
    const [book, setBook] = useState('');
    const [chapter, setChapter] = useState('');
    const [notes, setNotes] = useState('');
    const [logDate, setLogDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (date) {
            const fetchAndSetData = async () => {
                setIsLoading(true);
                const initialDate = new Date(date + 'T00:00:00');
                setViewedDate(initialDate);
                
                const fetchedReadings = await getReadingsForDate(date);
                setReadings(fetchedReadings);
                setIsLoading(false);
            };
            fetchAndSetData();
        }
    }, [date]);

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
            if (viewedDate && logDate.toISOString().slice(0, 10) === viewedDate.toISOString().slice(0, 10)) {
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

    if (!viewedDate) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1976d2" /></View>;
    }
    
    const handleDateChangeInHeader = (newDate: Date) => {
        const newDateString = newDate.toISOString().slice(0, 10);
        router.replace(`/day/${newDateString}`);
    };

    const isToday = new Date().toDateString() === viewedDate.toDateString();

    return (
        <SafeAreaView style={styles.container}>
            <CalendarHeader
                date={viewedDate}
                onDateChange={handleDateChangeInHeader}
                showBackButton={true}
                onBackPress={() => router.back()}
            />

            <View style={styles.dayHeader}>
                <Text style={styles.dayNameText}>{daysOfWeek[viewedDate.getDay()]}</Text>
                <View style={isToday ? styles.todayCircle : styles.dateCircle}>
                    <Text style={isToday ? styles.todayDateText : styles.dateText}>{viewedDate.getDate()}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                {isLoading ? (
                    <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 50 }} />
                ) : readings.length > 0 ? (
                    readings.map(reading => (
                        <View key={reading.id} style={[styles.eventBlock, { minHeight: 80, flex: 1/Math.max(4, readings.length) }]}>
                            <Text style={styles.eventTextName}>{reading.firstName}</Text>
                            <Text style={styles.eventTextReading}>{reading.book} {reading.chapter}</Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.noEventsContainer}>
                        <Text style={styles.noEventsText}>No readings for this day.</Text>
                    </View>
                )}
            </ScrollView>

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
    dayHeader: { paddingVertical: 10, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
    dayNameText: { fontSize: 14, fontWeight: '500', color: '#666', marginBottom: 8 },
    dateCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    todayCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1976d2' },
    dateText: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    todayDateText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    scrollContentContainer: { flexGrow: 1, padding: 8 },
    eventBlock: { backgroundColor: '#e3f2fd', margin: 4, padding: 12, borderRadius: 8, justifyContent: 'center' },
    eventTextName: { fontSize: 16, fontWeight: 'bold', color: '#0d47a1' },
    eventTextReading: { fontSize: 14, color: '#1565c0', marginTop: 4 },
    noEventsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
    noEventsText: { fontSize: 16, color: '#888' },
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
