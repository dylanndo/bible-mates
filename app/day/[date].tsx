// app/day/[date].tsx

import DateTimePicker from '@react-native-community/datetimepicker';
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
      const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));

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

    const getStreakLengthOnDate = (mateId: string, onDateStr: string): number => {
        const streak = streaks.find(s => s.userId === mateId && onDateStr >= s.startDate && onDateStr <= s.endDate);
        if (!streak) {
            return 0;
        }
        // Use UTC for reliable date math, avoiding timezone issues
        const [y, m, d] = onDateStr.split('-').map(Number);
        const currentDateUTC = Date.UTC(y, m - 1, d);
        const [sy, sm, sd] = streak.startDate.split('-').map(Number);
        const startDateUTC = Date.UTC(sy, sm - 1, sd);
        const length = Math.round((currentDateUTC - startDateUTC) / (1000 * 3600 * 24)) + 1;
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
    
    // The source of truth is the 'date' param from the URL
    const currentDate = useMemo(() => date ? new Date(date + 'T00:00:00') : new Date(), [date]);

    // Cached data state
    const [monthlyDataCache, setMonthlyDataCache] = useState<Record<string, {readings: Reading[], streaks: Streak[]}>>({});
    const [mates, setMates] = useState<Mate[]>([]);
    
    const [modalVisible, setModalVisible] = useState(false);
    const [book, setBook] = useState('');
    const [chapter, setChapter] = useState('');
    const [notes, setNotes] = useState('');
    const [logDate, setLogDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    useEffect(() => {
        const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;

        const fetchAndSetData = async () => {
            if (!user) return;
            
            // Only fetch mates once or if they haven't been fetched yet
            if (mates.length === 0) {
              const userGroups = await getGroupsForUser(user.uid);
              let currentMates: Mate[] = [];
              if (userGroups && userGroups.length > 0) {
                  const groupId = userGroups[0].id;
                  const groupMates = await getGroupMates(groupId);
                  const currentGroup = userGroups.find(g => g.id === groupId);
                  const mateIdsInOrder = currentGroup ? currentGroup.mateIds : [];
                  
                  currentMates = groupMates.map(mate => {
                      let color = getColorForUser(mate.id);
                      if (mate.id === user.uid) { color = USER_COLORS[0]; } 
                      else if (mateIdsInOrder.length > 0) {
                          const otherMatesOrder = mateIdsInOrder.filter(id => id !== user.uid);
                          const joinIndex = otherMatesOrder.indexOf(mate.id);
                          if (joinIndex !== -1) { color = USER_COLORS[(joinIndex + 1) % USER_COLORS.length]; }
                      }
                      return { ...mate, color };
                  });
              } else {
                  const ownProfile = await getUserProfile(user.uid);
                  if (ownProfile) { currentMates = [{ ...ownProfile, color: USER_COLORS[0]}]; }
              }
              setMates(currentMates);
            }

            // If we already have data for this month in cache, don't refetch
            if (monthlyDataCache[monthKey] || mates.length === 0) return;

            const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            
            const mateIds = mates.map(m => m.id);
            if(mateIds.length === 0) return;
            
            const fetchedReadings = await getReadingsForMatesByDateRange(mateIds, monthStart, monthEnd);
            const calculatedStreaks = processReadingsIntoStreaks(fetchedReadings, mates);
            
            setMonthlyDataCache(prevCache => ({
                ...prevCache,
                [monthKey]: { readings: fetchedReadings, streaks: calculatedStreaks }
            }));
        };
        fetchAndSetData();
    }, [date, user, currentDate, monthlyDataCache, mates]); // Reruns when URL date changes
    
    // This effect ensures the pager is always centered on the current day
    useEffect(() => {
        pagerRef.current?.setPageWithoutAnimation(1);
        setSharedDate(currentDate);
    }, [currentDate, setSharedDate]);

    const onPageSelected = (e: { nativeEvent: { position: number } }) => {
        if (e.nativeEvent.position === 1) return;
        
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (e.nativeEvent.position === 0 ? -1 : 1));

        // Use setParams to update the URL without a hard reload. This is the key to smooth swiping.
        router.setParams({ date: newDate.toISOString().slice(0, 10) });
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
            
            // Clear cache for the month of the new reading to force a refetch
            const monthKey = `${logDate.getFullYear()}-${logDate.getMonth()}`;
            setMonthlyDataCache(prevCache => {
                const newCache = { ...prevCache };
                delete newCache[monthKey];
                return newCache;
            });

            // Navigate to the date of the new reading
            router.setParams({ date: logDate.toISOString().slice(0,10) });

            setBook(''); setChapter(''); setNotes(''); setModalVisible(false);
            Alert.alert('Success', 'Your reading has been posted!');
        } catch (error) {
            Alert.alert('Error', 'Could not post your reading.');
            console.error(error);
        }
    };

    const handleBackPress = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };
    
    // Display data for the current month from the cache
    const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
    const { readings = [], streaks = [] } = monthlyDataCache[monthKey] || {};

    const daysToDisplay = [
        new Date(new Date(currentDate).setDate(currentDate.getDate() - 1)),
        currentDate,
        new Date(new Date(currentDate).setDate(currentDate.getDate() + 1)),
    ];

    return (
        <SafeAreaView style={styles.container}>
            <CalendarHeader
                date={currentDate}
                onDateChange={(d) => router.setParams({ date: d.toISOString().slice(0,10) })}
                showBackButton={true}
                onBackPress={handleBackPress}
            />

            <PagerView
                ref={pagerRef}
                style={styles.pagerView}
                initialPage={1}
                onPageSelected={onPageSelected}
                key={date} // Use date from URL to reset pager when navigating from another screen
            >
                {daysToDisplay.map((d, index) => (
                    <View key={index}>
                        <DayViewContent date={d} readings={readings} mates={mates} streaks={streaks}/>
                    </View>
                ))}
            </PagerView>

            <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
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
                                    <DateTimePicker value={logDate} mode="date" display="compact" onChange={(e,d) => d && setLogDate(d)} maximumDate={new Date()} style={styles.datePickerIOS} />
                                ) : (
                                    <Pressable onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}><Text style={styles.datePickerButtonText}>{logDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text></Pressable>
                                )}
                            </View>
                            {showDatePicker && Platform.OS === 'android' && (
                                <DateTimePicker value={logDate} mode="date" display="default" onChange={(e,d) => {setShowDatePicker(false); if(d) setLogDate(d)}} maximumDate={new Date()} />
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