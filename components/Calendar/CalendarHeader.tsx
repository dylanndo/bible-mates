import { Feather, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type CalendarHeaderProps = {
  month: number; // 0-indexed (0 = January)
  year: number;
  onLogout?: () => void;  
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarHeader({ month, year, onLogout }: CalendarHeaderProps) {
  const displayMonth = `${monthNames[month]} ${year}`;

  return (
    <View style={styles.headerContainer}>
      {/* Hamburger button */}
      <TouchableOpacity style={styles.iconButton}>
        <Feather name="menu" size={26} color="#222" />
      </TouchableOpacity>

      {/* Month name with dropdown */}
      <TouchableOpacity style={styles.monthContainer}>
        <Text style={styles.monthText}>{displayMonth}</Text>
        <MaterialIcons name="arrow-drop-down" size={24} color="#222" />
      </TouchableOpacity>

      {/* Right side reserved for future icons */}
      <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
        <Feather name="log-out" size={24} color="#222" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 2,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
  },
  monthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#222',
    marginRight: 2,
  },
});
