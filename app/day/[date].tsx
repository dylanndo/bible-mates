import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, Keyboard, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { addReading, getGroupMates, getGroupsForUser, getReadingsForMatesByDateRange, getUserProfile } from '../../api/firebase';
import CalendarHeader from '../../components/Calendar/CalendarHeader';
import { useAuth } from '../../contexts/AuthContext';
import { Mate, Reading } from '../../types';
import { getColorForUser, USER_COLORS } from '../../utils/colorHelper';

const DayViewContent = ({ date, readings, mates }: { date: Date, readings: Reading[], mates: Mate[] }) => {
    const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const isToday = new Date().toDateString() === date.toDateString();
    const dateString = date.toISOString().slice(0,10);
    return (
        <View style={styles.pageContainer}>
            <View style={styles.dayHeader}>
                <Text style={styles.dayNameText}>{daysOfWeek[date.getDay()]}</Text>
                <View style={isToday ? styles.todayCircle : styles.dateCircle}>
                    <Text style={isToday ? styles.todayDateText : styles.dateText}>{date.getDate()}</Text>
                </View>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                {mates.map(mate => {
                    const readingForMate = readings.find(r => r.userId === mate.id && r.date === dateString);
                    const hasRead = !!readingForMate;
                    return (
                        <View key={mate.id} style={[styles.eventBlock, { backgroundColor: hasRead ? mate.color || '#e3f2fd' : '#fafafa' }, !hasRead && styles.eventBlockUnread]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={[styles.eventTextName, !hasRead && styles.eventTextUnread]}>{mate.firstName} {mate.lastName}</Text>
                                {hasRead && <Feather name="check-circle" size={18} color="green" style={{ marginLeft: 8 }} />}
                            </View>
                            {hasRead && <Text style={styles.eventTextReading}>Read: {readingForMate.book} {readingForMate.chapter}</Text>}
                        </View>
                    )
                })}
            </ScrollView>
        </View>
    );
};
export default function DayViewScreen() {
    const { date } = useLocalSearchParams<{ date: string }>();
    const router = useRouter();
    const pagerRef = useRef<PagerView>(null);
    
    const [viewedDate, setViewedDate] = useState<Date | null>(null);
    const [readings, setReadings] = useState<Reading[]>([]);
    const [mates, setMates] = useState<Mate[]>([]);
    
    const { user } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);
    const [book, setBook] = useState('');
    const [chapter, setChapter] = useState('');
    const [notes, setNotes] = useState('');
    const [logDate, setLogDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    useEffect(() => {
        const fetchAndSetData = async () => {
            if (!date || !user) return;
            
            const initialDate = new Date(date + 'T00:00:00');
            setViewedDate(initialDate);

            const userGroups = await getGroupsForUser(user.uid);
            let mateIds = [user.uid]
            if (userGroups && userGroups.length > 0) {
                const groupId = userGroups[0].id;
                const groupMates = await getGroupMates(groupId);
                const currentGroup = userGroups.find(g => g.id === groupId);
                const mateIdsInOrder = currentGroup ? currentGroup.mateIds : [];
                
                const matesWithColors = groupMates.map(mate => {
                    let color = getColorForUser(mate.id);
                    if (mate.id === user.uid) {
                        color = USER_COLORS[0];
                    } else if (mateIdsInOrder.length > 0) {
                        const otherMatesOrder = mateIdsInOrder.filter(id => id !== user.uid);
                        const joinIndex = otherMatesOrder.indexOf(mate.id);
                        if (joinIndex !== -1) {
                            color = USER_COLORS[(joinIndex + 1) % USER_COLORS.length];
                        }
                    }
                    return { ...mate, color };
                });
                setMates(matesWithColors);

                if (groupMates.length > 0) {
                    mateIds = groupMates.map(m => m.id);
                }
            } else {
                const ownProfile = await getUserProfile(user.uid);
                if (ownProfile) {
                    setMates([{ ... ownProfile, color: USER_COLORS[0]}]);
                }
            }
            const startDate = new Date(initialDate);
            startDate.setDate(startDate.getDate() - 3);
            const endDate = new Date(initialDate);
            endDate.setDate(endDate.getDate() + 3);
            
            const fetchedReadings = await getReadingsForMatesByDateRange(mateIds, startDate, endDate);
            setReadings(fetchedReadings);
        };
        fetchAndSetData();
        pagerRef.current?.setPageWithoutAnimation(1);
    }, [date, user]);

    const handleDateChange = (newDate: Date) => {
        const dateString = newDate.toISOString().slice(0, 10);
        router.replace(`/day/${dateString}`);
    };

    const onPageSelected = (e: { nativeEvent: { position: number } }) => {
        if (!viewedDate || e.nativeEvent.position === 1) return;
        let newDate = new Date(viewedDate);
        if (e.nativeEvent.position === 0) newDate.setDate(newDate.getDate() - 1);
        else if (e.nativeEvent.position === 2) newDate.setDate(newDate.getDate() + 1);
        handleDateChange(newDate);
    };

    if (!viewedDate) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1976d2" /></View>;
    }

    const daysToDisplay = [
        new Date(new Date(viewedDate).setDate(viewedDate.getDate() - 1)),
        viewedDate,
        new Date(new Date(viewedDate).setDate(viewedDate.getDate() + 1)),
    ];

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

    const handleBackPress = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };

    if (!viewedDate) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1976d2" /></View>;
    }
    
    const isToday = new Date().toDateString() === viewedDate.toDateString();

    return (
        <SafeAreaView style={styles.container}>
            <CalendarHeader
                date={viewedDate}
                onDateChange={handleDateChange}
                showBackButton={true}
                onBackPress={handleBackPress}
            />

            <PagerView
                ref={pagerRef}
                style={styles.pagerView}
                initialPage={1}
                onPageSelected={onPageSelected}
                key={viewedDate.toISOString()}
            >
                {daysToDisplay.map((d, index) => (
                    <View key={index}>
                        <DayViewContent date={d} readings={readings} mates={mates} />
                    </View>
                ))}
            </PagerView>

            {/* <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                {isLoading ? (
                    <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 50 }} />
                ) : (
                    mates.map(mate => {
                        const readingForMate = readings.find(r => r.userId === mate.id);
                        const hasRead = !!readingForMate;
                        return (
                            <View key={mate.id} style={[styles.eventBlock, { backgroundColor: hasRead ? mate.color || '#e3f2fd' : '#fafafa' }, !hasRead && styles.eventBlockUnread]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={[styles.eventTextName, !hasRead && styles.eventTextUnread]}>
                                        {mate.firstName} {mate.lastName}
                                    </Text>
                                    {hasRead && <Feather name="check-circle" size={18} color="green" style={{ marginLeft: 8 }} />}
                                </View>
                                {hasRead && (
                                    <Text style={styles.eventTextReading}>
                                        Read: {readingForMate.book} {readingForMate.chapter}
                                    </Text>
                                )}
                            </View>
                        )
                    })
                )}
            </ScrollView> */}

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
    pagerView: { flex: 1 },
    pageContainer: { flex: 1 },
    dayHeader: { paddingVertical: 10, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
    dayNameText: { fontSize: 14, fontWeight: '500', color: '#666', marginBottom: 8 },
    dateCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    todayCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1976d2' },
    dateText: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    todayDateText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    scrollContentContainer: { flexGrow: 1, padding: 8 },
    eventBlock: { marginVertical: 4, padding: 16, borderRadius: 8 },
    eventBlockUnread: { backgroundColor: '#fafafa', borderColor: '#eee', borderWidth: 1 },
    eventTextName: { fontSize: 18, fontWeight: 'bold', color: '#0d47a1' },
    eventTextUnread: { color: '#aaa', fontWeight: 'normal' },
    eventTextReading: { fontSize: 16, color: '#1565c0', marginTop: 8, fontStyle: 'italic' },
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
