import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

export type CalendarEvent = {
  id: string;
  firstName: string;
  book: string;
  chapter: string;
  notes?: string;
  date: string; // 'YYYY-MM-DD'
};

type MonthViewProps = {
  events?: CalendarEvent[];
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

export default function MonthView({ events = [], month, day, year, onDayPress }: MonthViewProps) {
  const days = getMonthDays(year, month);
  const firstDayOfWeek = days[0].getDay();
  const prevMonthDays = getPrevMonthDays(year, month, firstDayOfWeek);
  let calendarCells = [...prevMonthDays, ...days];
  const totalCells = 6 * 7;
  const nextMonthDayCount = totalCells - calendarCells.length;
  const nextMonthDays = getNextMonthDays(year, month, nextMonthDayCount);
  calendarCells = [...calendarCells, ...nextMonthDays];
  const cellTypes = [
    ...Array(prevMonthDays.length).fill('prev'),
    ...Array(days.length).fill('current'),
    ...Array(nextMonthDays.length).fill('next'),
  ];
  const weeks = [];
  for (let i = 0; i < 6; i++) {
    weeks.push({
      days: calendarCells.slice(i * 7, (i + 1) * 7),
      types: cellTypes.slice(i * 7, (i + 1) * 7),
    });
  }
  const screenHeight = Dimensions.get('window').height;
  const headerHeight = 40;
  const numWeeks = weeks.length;
  const cellHeight = (screenHeight - headerHeight - 60) / numWeeks;
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();
  const todayDayOfWeek = today.getDay();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {daysOfWeek.map((day, idx) => (
            <Text
            key={idx}
            style={[
                styles.headerCell,
                idx === todayDayOfWeek && styles.currentDayOfWeekHeader,
            ]}
            >
            {day[0]}
            </Text>
        ))}
        </View>
      <View style={styles.grid}>
        {weeks.map((week, wIdx) => (
          <View key={wIdx} style={styles.weekRow}>
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
                  style={[styles.dayCell, { height: cellHeight }]}
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
                  {dayEvents.slice(0, maxEventsToShow).map(event => (
                      <View key={event.id} style={styles.eventBlock}>
                        <Text style={styles.eventText}>{event.firstName}</Text>
                      </View>
                    ))}
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
  container: { flex: 1, padding: 0, backgroundColor: '#fff' },
  row: {
    flexDirection: 'row',
    height: 40,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 40,
    color: '#666',
  },
  currentDayOfWeekHeader: {
  color: '#1976d2',
  },
  grid: { flex: 1 },
  weekRow: { flexDirection: 'row', flex: 1 },
  dayCell: {
    flex: 1,
    borderWidth: 0.5,
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
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  todayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
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
  outOfMonthDateText: {
    color: '#bbb',
  },
  eventBlock: {
    backgroundColor: '#ADD8E6',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingTop: 0.75,
    marginTop: 0.75,
    marginBottom: 1,
    minHeight: 14,
    width: '95%',
    alignSelf: 'stretch',
  },
  eventText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  moreText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  ellipsis: {
    fontSize: 16,
    color: '#888',
    marginTop: -5,
    fontWeight: '900',
    letterSpacing: 1,
    alignSelf: 'flex-start',
    paddingLeft: 4,
    },

});
