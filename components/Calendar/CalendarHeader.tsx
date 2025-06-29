import { Feather, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type CalendarHeaderProps = {
  date: Date;
  onDateChange: (newDate: Date) => void;
  onLogout?: () => void;
  showBackButton?: boolean;
  onMenuPress?: () => void;
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const years = Array.from({length: 11}, (_, i) => currentYear - 5 + i);

export default function CalendarHeader({
  date,
  onDateChange,
  onLogout,
  showBackButton = false,
  onMenuPress,
}: CalendarHeaderProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth());
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());

  useEffect(() => {
    setSelectedMonth(date.getMonth());
    setSelectedYear(date.getFullYear());
  }, [date]);

  const displayMonth = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    onDateChange(newDate);
    setModalVisible(false);
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity style={styles.iconButton} onPress={onMenuPress}>
        <Feather name="menu" size={26} color="#222" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.monthContainer} onPress={() => setModalVisible(true)}>
        <Text style={styles.monthText}>{displayMonth}</Text>
        <MaterialIcons name="arrow-drop-down" size={24} color="#222" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
        <Feather name="log-out" size={24} color="#222" />
      </TouchableOpacity>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Select Month & Year</Text>
            <View style={styles.pickerRow}>
              <FlatList
                data={monthNames}
                keyExtractor={(item) => item}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.pickerItem, selectedMonth === index && styles.selectedPickerItem]}
                    onPress={() => setSelectedMonth(index)}
                  >
                    <Text style={selectedMonth === index ? styles.selectedPickerText : styles.pickerText}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 200 }}
                initialScrollIndex={selectedMonth}
                getItemLayout={(data, index) => ({ length: 38, offset: 38 * index, index })}
              />
              <FlatList
                data={years}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.pickerItem, selectedYear === item && styles.selectedPickerItem]}
                    onPress={() => setSelectedYear(item)}
                  >
                    <Text style={selectedYear === item ? styles.selectedPickerText : styles.pickerText}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 200 }}
                initialScrollIndex={years.indexOf(selectedYear)}
                getItemLayout={(data, index) => ({ length: 38, offset: 38 * index, index })}
              />
            </View>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: { height: 45, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 8, borderBottomWidth: 1, borderColor: '#eee' },
  iconButton: { padding: 8 },
  monthContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  monthText: { fontSize: 20, fontWeight: '500', color: '#222' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 8, padding: 16, width: 320 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  pickerItem: { paddingVertical: 8, paddingHorizontal: 16, margin: 2, borderRadius: 4 },
  selectedPickerItem: { backgroundColor: '#1976d2' },
  pickerText: { fontSize: 16, color: '#222' },
  selectedPickerText: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
  confirmButton: { marginTop: 14, backgroundColor: '#1976d2', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 24, alignSelf: 'center' },
  confirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
