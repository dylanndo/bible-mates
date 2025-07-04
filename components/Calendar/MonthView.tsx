import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Mate, Reading } from '../../types';

type MonthViewProps = {
  events: Reading[];
  mates: Mate[]; // Mates array now includes the 'color' property
  month: number;
  day: number;
  year: number;
  onDayPress: (date: Date) => void;
};

const daysOfWeek = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

function getMonthDays(year: number, month: number) {
  const numDays = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 1; i <= numDays; i++) {
    days.push(new Date(year, month, i));
  }
  return days;
}
function getPrevMonthDays(year: number, month: number, count: number) {
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate();
  const days = [];
  for (let i = prevMonthDays - count + 1; i <= prevMonthDays; i++) {
    days.push(new Date(prevYear, prevMonth, i));
  }
  return days;
}
function getNextMonthDays(year: number, month: number, count: number) {
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const days = [];
  for (let i = 1; i <= count; i++) {
    days.push(new Date(nextYear, nextMonth, i));
  }
  return days;
}

export default function MonthView({ events = [], mates = [], month, day, year, onDayPress }: MonthViewProps) {
  const days = getMonthDays(year, month);
  const firstDayOfWeek = days.length > 0 ? days[0].getDay() : 0;
  const prevMonthDays = getPrevMonthDays(year, month, firstDayOfWeek);
  let calendarCells = [...prevMonthDays, ...days];
  const totalCells = 6 * 7;
  const nextMonthDayCount = totalCells - calendarCells.length;
  if(nextMonthDayCount > 0){
    const nextMonthDays = getNextMonthDays(year, month, nextMonthDayCount);
    calendarCells = [...calendarCells, ...nextMonthDays];
  }
  const cellTypes = [
    ...Array(prevMonthDays.length).fill('prev'),
    ...Array(days.length).fill('current'),
    ...Array(nextMonthDayCount > 0 ? nextMonthDayCount : 0).fill('next'),
  ];
  const weeks = [];
  for (let i = 0; i < 6; i++) {
    weeks.push({
      days: calendarCells.slice(i * 7, (i + 1) * 7),
      types: cellTypes.slice(i * 7, (i + 1) * 7),
    });
  }
  
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();
  const todayDayOfWeek = today.getDay();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {daysOfWeek.map((dayName, idx) => (
            <Text
            key={idx}
            style={[
                styles.headerCell,
                idx === todayDayOfWeek && styles.currentDayOfWeekHeader,
            ]}
            >
            {dayName[0]}
            </Text>
        ))}
        </View>
      <View style={styles.grid}>
        {weeks.map((week, wIdx) => (
          <View key={wIdx} style={[styles.weekRow, wIdx === weeks.length - 1 && { borderBottomWidth: 0 }]}>
            {week.days.map((date, dIdx) => {
              const cellType = week.types[dIdx];
              const isToday =
                date.getFullYear() === todayYear &&
                date.getMonth() === todayMonth &&
                date.getDate() === todayDate;
              const isCurrentMonth = cellType === 'current';
              const dayEvents = events.filter(e => e.date === date.toISOString().slice(0, 10));
              const maxEventsToShow = 4;
              const extraCount = dayEvents.length - maxEventsToShow;

              return (
                <Pressable
                  key={date.toISOString()}
                  style={styles.dayCell}
                  onPress={() => onDayPress(date)}
                >
                  <View style={styles.dateNumberWrapper}>
                    {isToday && isCurrentMonth ? (
                      <View style={styles.todayCircle}>
                        <Text style={styles.todayText}>{date.getDate()}</Text>
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.dateText,
                          !isCurrentMonth && styles.outOfMonthDateText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.eventsContainer}>
                    {dayEvents.slice(0, maxEventsToShow).map(event => {
                      // Find the mate corresponding to this event to get their color.
                      const mate = mates.find(m => m.id === event.userId);
                      // Use the mate's color, or a fallback color if not found.
                      const eventColor = mate?.color || '#e0e0e0';

                      return (
                        <View key={event.id} style={[styles.eventBlock, { backgroundColor: eventColor }]}>
                          <Text style={styles.eventText} numberOfLines={1}>
                            {event.firstName}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                  {extraCount > 0 && (
                    <Text style={styles.ellipsis}>...</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column', backgroundColor: '#fff' },
  row: { flexDirection: 'row', height: 40, borderBottomWidth: 1, borderColor: '#e0e0e0' },
  headerCell: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', lineHeight: 40, color: '#666' },
  currentDayOfWeekHeader: { color: '#1976d2' },
  grid: { flex: 1, flexDirection: 'column' },
  weekRow: { flexDirection: 'row', flex: 1, borderBottomWidth: 0.5, borderColor: '#e0e0e0' },
  dayCell: {
    flex: 1,
    borderRightWidth: 0.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
    paddingTop: 2,
  },
  dateNumberWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 22,
    width: '100%',
  },
  todayCircle: {
    backgroundColor: '#1976d2',
    borderRadius: 16,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  todayText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  dateText: {
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
    width: 22,
    height: 22,
    textAlignVertical: 'center', 
    includeFontPadding: false,   
    lineHeight: 22,
  },
  outOfMonthDateText: { color: '#bbb' },
  eventsContainer: {
    flex: 1,
    width: '100%',
  },
  eventBlock: {
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingTop: 0.5,
    paddingBottom: 0.75,
    marginTop: 0.75,
    marginBottom: 1,
    width: '95%',
    alignSelf: 'stretch',
  },
  
  eventText: {
    fontSize: 10,
    color: '#333',
    fontWeight: '600',
  },
  ellipsis: {
    fontSize: 10,
    color: '#888',
    alignSelf: 'center',
  },
});
