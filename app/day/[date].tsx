// app/day/[date].tsx

import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Keyboard, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { addReading, getGroupMates, getGroupsForUser, getReadingsForMatesByDateRange, getUserProfile } from '../../api/firebase';
import CalendarHeader from '../../components/Calendar/CalendarHeader';
import StatusCard from '../../components/Day/StatusCard';
import { useAuth } from '../../contexts/AuthContext';
import { useCalendar } from '../../contexts/CalendarContext';
import { Mate, Reading, Streak } from '../../types';
import { getColorForUser, USER_COLORS } from '../../utils/colorHelper';

const processReadingsIntoStreaks = (readings: Reading[], mates: Mate[]): Streak[] => {
  if (!readings.length || !mates.length) return [];
  const streaks: Streak[] = [];
  const mateMap = new Map(mates.map(m => [m.id, m]));
  const readingsByUser = readings.reduce((acc, reading) => {
    if (!acc[reading.userId]) { acc[reading.userId] = []; }
    acc[reading.userId].push(reading);
    return acc;
  }, {} as Record<string, Reading[]>);

  for (const userId in readingsByUser) {
    const userReadings = readingsByUser[userId].sort((a, b) => a.date.localeCompare(b.date));
    if (userReadings.length === 0) continue;
    const mateInfo = mateMap.get(userId);
    if (!mateInfo) continue;

    let currentStreak: Streak = { id: `${userId}-${userReadings[0].date}`, userId: userId, firstName: mateInfo.firstName, color: mateInfo.color, startDate: userReadings[0].date, endDate: userReadings[0].date, span: 1 };
    for (let i = 1; i < userReadings.length; i++) {
      const currentDate = new Date(userReadings[i].date + 'T00:00:00');
      const prevDate = new Date(currentStreak.endDate + 'T00:00:00');
      const diffDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24);

      if (diffDays === 1) {
        currentStreak.endDate = userReadings[i].date;
        currentStreak.span += 1;
      } else {
        streaks.push(currentStreak);
        currentStreak = { id: `${userId}-${userReadings[i].date}`, userId: userId, firstName: mateInfo.firstName, color: mateInfo.color, startDate: userReadings[i].date, endDate: userReadings[i].date, span: 1 };
      }
    }
    streaks.push(currentStreak);
  }
  return streaks;
};

const DayViewContent = ({ date, readings, mates, streaks }: { date: Date, readings: Reading[], mates: Mate[], streaks: Streak[] }) => {
    const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const isToday = new Date().toDateString() === date.toDateString();
    const dateString = date.toISOString().slice(0,10);

    const getStreakLengthOnDate = (mateId: string, onDate: string): number => {
        const streak = streaks.find(s => s.userId === mateId && onDate >= s.startDate && onDate <= s.endDate);
        if (!streak) {
            return 0;
        }
        const startDate = new Date(streak.startDate + 'T00:00:00');
        const currentDate = new Date(onDate + 'T00:00:00');
        // Calculate days from streak start to the day being viewed
        const length = Math.round((currentDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
        return length;
    };

    const sortedMates = useMemo(() => {
        return [...mates].sort((a, b) => {
            const aStreakLen = getStreakLengthOnDate(a.id, dateString);
            const bStreakLen = getStreakLengthOnDate(b.id, dateString);

            // Priority 1: Sort by streak length on that day (descending).
            if (aStreakLen !== bStreakLen) {
                return bStreakLen - aStreakLen;
            }

            // Priority 2: Alphabetical as a tie-breaker.
            return a.firstName.localeCompare(b.firstName);
        });
    }, [dateString, mates, streaks]);
    
    return (
        <View style={styles.pageContainer}>
            <View style={styles.dayHeader}>
                <Text style={styles.dayNameText}>{daysOfWeek[date.getDay()]}</Text>
                <View style={isToday ? styles.todayCircle : styles.dateCircle}>
                    <Text style={isToday ? styles.todayDateText : styles.dateText}>{date.getDate()}</Text>
                </View>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContentContainer}>
                {sortedMates.map(mate => {
                    const readingForMate = readings.find(r => r.userId === mate.id && r.date === dateString);
                    const streakLength = getStreakLengthOnDate(mate.id, dateString);
                    return <StatusCard key={mate.id} mate={mate} reading={readingForMate} streakLength={streakLength} />;
                })}
            </ScrollView>
        </View>
    );
};

export default function DayViewScreen() {
    const { date } = useLocalSearchParams<{ date: string }>();
    const router = useRouter();
    const pagerRef = useRef<PagerView>(null);
    
    const { setViewedDate: setSharedDate } = useCalendar();
    const { user } = useAuth();
    if (user) { (global as any).currentUserId = user.uid; }
    
    const initialDate = date ? new Date(date + 'T00:00:00') : new Date();
    const [viewedDate, setViewedDate] = useState<Date>(initialDate);
    const [readings, setReadings] = useState<Reading[]>([]);
    const [mates, setMates] = useState<Mate[]>([]);
    const [streaks, setStreaks] = useState<Streak[]>([]);
    
    const [modalVisible, setModalVisible] = useState(false);
    const [book, setBook] = useState('');
    const [chapter, setChapter] = useState('');
    const [notes, setNotes] = useState('');
    const [logDate, setLogDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    // This effect now only runs when the screen is first loaded
    useEffect(() => {
        const fetchAndSetData = async () => {
            if (!date || !user) return;
            
            const currentDate = new Date(date + 'T00:00:00');
            setViewedDate(currentDate);
            setSharedDate(currentDate);

            const userGroups = await getGroupsForUser(user.uid);
            let mateIds = [user.uid]
            let currentMates: Mate[] = [];
            if (userGroups && userGroups.length > 0) {
                const groupId = userGroups[0].id;
                const groupMates = await getGroupMates(groupId);
                const currentGroup = userGroups.find(g => g.id === groupId);
                const mateIdsInOrder = currentGroup ? currentGroup.mateIds : [];
                
                currentMates = groupMates.map(mate => {
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

                if (groupMates.length > 0) {
                    mateIds = groupMates.map(m => m.id);
                }
            } else {
                const ownProfile = await getUserProfile(user.uid);
                if (ownProfile) {
                    currentMates = [{ ... ownProfile, color: USER_COLORS[0]}];
                }
            }
            setMates(currentMates);
            
            const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            
            const fetchedReadings = await getReadingsForMatesByDateRange(mateIds, monthStart, monthEnd);
            setReadings(fetchedReadings);

            const calculatedStreaks = processReadingsIntoStreaks(fetchedReadings, currentMates);
            setStreaks(calculatedStreaks);
        };
        fetchAndSetData();
    }, [date, user, setSharedDate]);
    
    // This new effect handles the pager reset after a swipe
    useEffect(() => {
        pagerRef.current?.setPageWithoutAnimation(1);
    }, [viewedDate]);

    const handleDateChange = (newDate: Date) => {
        setViewedDate(newDate);
        setSharedDate(newDate);
    };

    const onPageSelected = (e: { nativeEvent: { position: number } }) => {
        if (e.nativeEvent.position === 1) return;
        
        // Directly update the date state instead of reloading the whole route
        const newDate = new Date(viewedDate);
        newDate.setDate(viewedDate.getDate() + (e.nativeEvent.position === 0 ? -1 : 1));

        // If the swipe crosses into a new month, we need to refetch data
        if (newDate.getMonth() !== viewedDate.getMonth()) {
            router.replace(`/day/${newDate.toISOString().slice(0, 10)}`);
        } else {
            setViewedDate(newDate);
        }
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
            
            // To ensure streaks are correct, we must refetch by reloading the route
            router.replace(`/day/${logDate.toISOString().slice(0, 10)}`);

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
        if (viewedDate) {
            setSharedDate(viewedDate);
        }
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };

    const daysToDisplay = [
        new Date(new Date(viewedDate).setDate(viewedDate.getDate() - 1)),
        viewedDate,
        new Date(new Date(viewedDate).setDate(viewedDate.getDate() + 1)),
    ];

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
            >
                {daysToDisplay.map((d, index) => (
                    <View key={index}>
                        <DayViewContent date={d} readings={readings} mates={mates} streaks={streaks}/>
                    </View>
                ))}
            </PagerView>

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
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    pagerView: { flex: 1 },
    pageContainer: { flex: 1 },
    dayHeader: { paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
    dayNameText: { fontSize: 14, fontWeight: '500', color: '#666', marginBottom: 8 },
    dateCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    todayCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1976d2' },
    dateText: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    todayDateText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
    scrollContentContainer: { flexGrow: 1, paddingVertical: 8 },
    eventBlock: { marginVertical: 4, padding: 16, borderRadius: 8 },
    eventBlockUnread: { backgroundColor: '#fafafa', borderColor: '#eee', borderWidth: 1 },
    eventTextName: { fontSize: 18, fontWeight: 'bold', color: '#0d47a1' },
    eventTextUnread: { color: '#aaa', fontWeight: 'normal' },
    eventTextReading: { fontSize: 16, color: '#1565c0', marginTop: 8, fontStyle: 'italic' },
    fab: { position: 'absolute', right: 25, bottom: 25, width: 60, height: 60, borderRadius: 30, backgroundColor: '#1976d2', justifyContent: 'center', alignItems: 'center', elevation: 8 },
    fabIcon: { fontSize: 30, color: 'white', lineHeight: 32 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { width: '95%', backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    input: { borderWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 15, borderRadius: 8 },
    notesInput: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
    datePickerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    dateLabel: { fontSize: 16, color: '#333' },
    datePickerButton: { backgroundColor: '#f0f0f0', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 5 },
    datePickerButtonText: { fontSize: 16, color: '#1976d2', fontWeight: '500' },
    datePickerIOS: { flex: 1, justifyContent: 'flex-end' },
});