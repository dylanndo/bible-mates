import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Streak } from '../../types';
import { getMonthGrid, isSameDay } from '../../utils/calendarUtils'; // We'll create this new utility file next

type MonthViewProps = {
  streaks: Streak[];
  month: number;
  year: number;
  onDayPress: (date: Date) => void;
};

// Represents a piece of a streak that is rendered in a single week
type StreakSegment = {
  streak: Streak;
  trackIndex: number;
  startDayIndex: number;
  endDayIndex: number;
};

const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function MonthView({ streaks = [], month, year, onDayPress }: MonthViewProps) {
  const weeks = useMemo(() => getMonthGrid(year, month), [year, month]);
  
  const today = new Date();

  const weeklyLayouts = useMemo(() => {
    const layouts = new Map<number, StreakSegment[]>();

    // Sort all streaks by priority just once
    const sortedStreaks = [...streaks].sort((a, b) => {
      if (b.span !== a.span) {
        return b.span - a.span; // Longer streaks first
      }
      return a.startDate.localeCompare(b.startDate); // Then by start date
    });

    weeks.forEach((week, wIdx) => {
      // A 2D array to keep track of occupied slots for the week
      // e.g., weekTracks[dayIndex][trackIndex]
      const weekTracks: (string | null)[][] = Array(7).fill(null).map(() => []);
      const segmentsForWeek: StreakSegment[] = [];

      const weekStartDate = week[0].date;
      const weekEndDate = week[6].date;

      sortedStreaks.forEach(streak => {
        const streakStart = new Date(streak.startDate + 'T00:00:00');
        const streakEnd = new Date(streak.endDate + 'T00:00:00');

        // Check if the streak is visible in the current week
        if (streakStart > weekEndDate || streakEnd < weekStartDate) {
          return;
        }

        const startDayIndex = Math.max(0, (streakStart.getTime() - weekStartDate.getTime()) / (1000 * 3600 * 24));
        const endDayIndex = Math.min(6, (streakEnd.getTime() - weekStartDate.getTime()) / (1000 * 3600 * 24));

        // Find the first available vertical track for this streak's duration
        let trackIndex = 0;
        let foundTrack = false;
        while (!foundTrack) {
          let isTrackAvailable = true;
          for (let i = Math.floor(startDayIndex); i <= Math.floor(endDayIndex); i++) {
            if (weekTracks[i][trackIndex] !== undefined) {
              isTrackAvailable = false;
              break;
            }
          }

          if (isTrackAvailable) {
            foundTrack = true;
          } else {
            trackIndex++;
          }
        }
        
        // Occupy the slots for the found track
        for (let i = Math.floor(startDayIndex); i <= Math.floor(endDayIndex); i++) {
            weekTracks[i][trackIndex] = streak.userId;
        }
        
        segmentsForWeek.push({
          streak,
          trackIndex,
          startDayIndex: Math.floor(startDayIndex),
          endDayIndex: Math.floor(endDayIndex)
        });
      });
      layouts.set(wIdx, segmentsForWeek);
    });

    return layouts;
  }, [weeks, streaks]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {daysOfWeek.map((dayName, idx) => (
            <Text key={idx} style={styles.headerCell}>{dayName}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {weeks.map((week, wIdx) => (
          <View key={wIdx} style={styles.weekRow}>
            <View style={styles.streakLayer} pointerEvents="box-none">
              {(weeklyLayouts.get(wIdx) || []).map(({ streak, trackIndex, startDayIndex, endDayIndex }) => {
                const dayWidth = 100 / 7;
                
                let leftPercentage = startDayIndex * dayWidth;
                let widthPercentage = (endDayIndex - startDayIndex + 1) * dayWidth;
                
                // If the streak starts in the first column (Sunday), add a gap on the left
                if (startDayIndex === 0) {
                  const leftGap = 1; // A 1% gap
                  leftPercentage += leftGap;
                  widthPercentage -= leftGap;
                }
                
                // Subtract a small percentage for the gap on the right
                widthPercentage -= 1;

                return (
                  <View
                    key={streak.id + `-${wIdx}`}
                    style={[
                      styles.streakBlock,
                      {
                        backgroundColor: streak.color,
                        left: `${leftPercentage}%`,
                        width: `${widthPercentage}%`,
                        top: 28 + trackIndex * 15, // Position streaks vertically
                      },
                    ]}
                  >
                    <Text style={styles.streakText} numberOfLines={1}>{streak.firstName}</Text>
                  </View>
                );
              })}
            </View>

            {/* Render Day Cells */}
            {week.map(({ date, type }, dIdx) => {
              const isCurrentMonth = type === 'current';
              const isToday = isSameDay(date, today);

              return (
                <Pressable
                  key={date.toISOString()}
                  style={styles.dayCell}
                  onPress={() => onDayPress(date)}
                >
                  <View style={[styles.dateNumberWrapper, isToday && styles.todayCircle]}>
                    <Text
                      style={[
                        styles.dateText,
                        !isCurrentMonth && styles.outOfMonthDateText,
                        isToday && styles.todayText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
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
  headerRow: { flexDirection: 'row', height: 40, borderBottomWidth: 1, borderColor: '#e0e0e0' },
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
  streakLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1, // Streaks render behind day numbers
  },
  streakBlock: {
    position: 'absolute',
    height: 14,
    borderRadius: 3,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  streakText: {
    fontSize: 10,
    color: '#333',
    fontWeight: '600',
  },
});
