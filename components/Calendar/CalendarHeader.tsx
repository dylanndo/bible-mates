import { Feather, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


type CalendarHeaderProps = {
  month: number; // 0-indexed (0 = January)
  year: number;
  onChangeMonthYear: (month: number, year: number) => void;
  onLogout?: () => void; 
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const years = Array.from({length: 11}, (_, i) => 2025 + i)

export default function CalendarHeader({ month, year, onChangeMonthYear, onLogout }: CalendarHeaderProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);

  const displayMonth = `${monthNames[month]} ${year}`;

  const handleOpen = () => {
    console.log("yay")
    setSelectedMonth(month);
    setSelectedYear(year);
    setModalVisible(true);
  };

  const handleConfirm = () => {
    onChangeMonthYear(selectedMonth, selectedYear);
    setModalVisible(false);
  };

  return (
    <View style={styles.headerContainer}>
      {/* Hamburger button */}
      <TouchableOpacity style={styles.iconButton}>
        <Feather name="menu" size={26} color="#222" />
      </TouchableOpacity>

      {/* Month name with dropdown */}
      <TouchableOpacity style={styles.monthContainer} onPress={handleOpen}>
        <Text style={styles.monthText}>{displayMonth}</Text>
        <MaterialIcons name="arrow-drop-down" size={24} color="#222" />
      </TouchableOpacity>

      {/* Right side reserved for future icons */}
      <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
        <Feather name="log-out" size={24} color="#222" />
      </TouchableOpacity>

      {/* Modal for Month/Year Picker */}
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
              {/* Months */}
              <FlatList
                data={monthNames}
                keyExtractor={(item, idx) => idx.toString()}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      selectedMonth === index && styles.selectedPickerItem,
                    ]}
                    onPress={() => setSelectedMonth(index)}
                  >
                    <Text style={selectedMonth === index ? styles.selectedPickerText : styles.pickerText}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 200 }}
              />
              {/* Years */}
              <FlatList
                data={years}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      selectedYear === item && styles.selectedPickerItem,
                    ]}
                    onPress={() => setSelectedYear(item)}
                  >
                    <Text style={selectedYear === item ? styles.selectedPickerText : styles.pickerText}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 200 }}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    width: 320,
    alignItems: 'center',
    minHeight: 300,
    zIndex: 100,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  pickerItem: {
    padding: 8,
    margin: 2,
    borderRadius: 4,
  },
  selectedPickerItem: {
    backgroundColor: '#1976d2',
  },
  pickerText: {
    fontSize: 16,
    color: '#222',
  },
  selectedPickerText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  confirmButton: {
    marginTop: 14,
    backgroundColor: '#1976d2',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
