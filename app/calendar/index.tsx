import React, { useState } from 'react';
import { Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CalendarHeader from '../../components/Calendar/CalendarHeader';
import MonthView, { CalendarEvent } from '../../components/Calendar/MonthView';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Helper to get month/year with offset
function getMonthYearOffset(month: number, year: number, offset: number) {
  let newMonth = month + offset;
  let newYear = year;
  while (newMonth < 0) {
    newMonth += 12;
    newYear -= 1;
  }
  while (newMonth > 11) {
    newMonth -= 12;
    newYear += 1;
  }
  return { month: newMonth, year: newYear };
}

const events: CalendarEvent[] = [
  {
    id: '1',
    firstName: 'Dylan',
    reading: 'Genesis 1',
    notes: 'Powerful start to the Bible!',
    date: '2025-06-20',
  },
  {
    id: '2',
    firstName: 'Nate',
    reading: 'Psalm 23',
    date: '2025-06-02',
  },
  {
    id: '3',
    firstName: 'Christy',
    reading: 'Matthew 5',
    notes: 'Loved the Beatitudes.',
    date: '2025-06-05',
  },
  {
  id: '3',
    firstName: 'Tov',
    reading: 'Matthew 5',
    notes: 'Loved the Beatitudes.',
    date: '2025-06-05',
  },
  {
  id: '3',
    firstName: 'Dylan',
    reading: 'Matthew 5',
    notes: 'Loved the Beatitudes.',
    date: '2025-06-05',
  },
  {
  id: '3',
    firstName: 'Nate',
    reading: 'Matthew 5',
    notes: 'Loved the Beatitudes.',
    date: '2025-06-05',
  },
  {
  id: '3',
    firstName: 'Dylan',
    reading: 'Matthew 5',
    notes: 'Loved the Beatitudes.',
    date: '2025-06-05',
  },
];

export default function CalendarScreen() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth()); // June (0-indexed)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate())

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
        <CalendarHeader
            month={selectedMonth}
            year={selectedYear}
            // Add props for switching months or views if needed
        />
        <MonthView events={events} month={selectedMonth} day={selectedDay} year={selectedYear} />
    </SafeAreaView>
  );
}
