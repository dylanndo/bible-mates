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

const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function MonthView({ streaks = [], month, year, onDayPress }: MonthViewProps) {
  const weeks = useMemo(() => getMonthGrid(year, month), [year, month]);
  
  const today = new Date();

  // A map to store the vertical position (track) of each user's streak for a given week
  const weeklyTrackAssignments = useMemo(() => {
    const assignments = new Map<string, Map<string, number>>(); // weekKey -> (userId -> trackIndex)
    
    weeks.forEach((week, wIdx) => {
        const weekKey = `${year}-${month}-${wIdx}`;
        const weekAssignments = new Map<string, number>();
        const occupiedTracks = new Set<number>();

        const weekStartDate = week[0].date;
        const weekEndDate = week[6].date;
        
        // Find streaks active in this week
        const activeStreaks = streaks.filter(s => {
            const streakStart = new Date(s.startDate + 'T00:00:00');
            const streakEnd = new Date(s.endDate + 'T00:00:00');
            return streakStart <= weekEndDate && streakEnd >= weekStartDate;
        });

        // Assign tracks to each user with an active streak
        activeStreaks.forEach(streak => {
            if (!weekAssignments.has(streak.userId)) {
                let trackIndex = 0;
                while (occupiedTracks.has(trackIndex)) {
                    trackIndex++;
                }
                occupiedTracks.add(trackIndex);
                weekAssignments.set(streak.userId, trackIndex);
            }
        });
        assignments.set(weekKey, weekAssignments);
    });

    return assignments;
  }, [weeks, streaks, year, month]);

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
            {/* Render Streak Blocks */}
            <View style={styles.streakLayer}>
              {streaks.map(streak => {
                const streakStart = new Date(streak.startDate + 'T00:00:00');
                const streakEnd = new Date(streak.endDate + 'T00:00:00');

                const weekStartDate = week[0].date;
                const weekEndDate = week[6].date;

                // Check if streak is in this week
                if (streakStart > weekEndDate || streakEnd < weekStartDate) {
                  return null;
                }

                const startDayIndex = streakStart < weekStartDate ? 0 : streakStart.getDay();
                const endDayIndex = streakEnd > weekEndDate ? 6 : streakEnd.getDay();

                const weekKey = `${year}-${month}-${wIdx}`;
                const trackIndex = weeklyTrackAssignments.get(weekKey)?.get(streak.userId) ?? 0;
                
                const dayWidth = 100 / 7; // as a percentage
                const streakSpanInDays = endDayIndex - startDayIndex + 1;
                // Calculate the base width, then subtract 1% to create a gap on the right.
                const calculatedWidth = (streakSpanInDays * dayWidth) - 1;

                return (
                  <View
                    key={streak.id + `-${wIdx}`}
                    style={[
                      styles.streakBlock,
                      {
                        backgroundColor: streak.color,
                        left: `${startDayIndex * dayWidth}%`,
                        width: `${calculatedWidth}%`,
                        top: 25 + trackIndex * 15, // Position streaks vertically
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
