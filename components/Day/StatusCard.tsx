import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Mate, Reading } from '../../types';

type StatusCardProps = {
  mate: Mate;
  reading: Reading | undefined;
};

export default function StatusCard({ mate, reading }: StatusCardProps) {
  const hasRead = !!reading;

  const handleNudge = () => {
    Alert.alert("Nudge Sent!", `A friendly nudge has been sent to ${mate.firstName}.`);
  };

  return (
    <View style={[styles.cardBase, { backgroundColor: hasRead ? mate.color : '#fafafa' }, !hasRead && styles.cardUnread]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.nameText, !hasRead && styles.nameTextUnread]}>
          {mate.firstName} {mate.lastName}
        </Text>
        
        {hasRead ? (
          <Feather name="check-circle" size={18} color="green" style={styles.checkIcon} />
        ) : (
          <Pressable style={styles.nudgeButton} onPress={handleNudge}>
            <Text style={styles.nudgeButtonText}>Nudge</Text>
          </Pressable>
        )}
      </View>

      {hasRead && reading && (
        <Text style={styles.readingText}>
          Read: {reading.book} {reading.chapter}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Styles reverted to match your original design
  cardBase: {
    marginVertical: 4,
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 8,
  },
  cardUnread: {
    borderColor: '#eee',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0d47a1', // Original color for "Read" state
  },
  nameTextUnread: {
    color: '#aaa',     // Original color for "Unread" state
    fontWeight: 'normal',
  },
  checkIcon: {
    marginLeft: 8,
  },
  readingText: {
    fontSize: 16,
    color: '#1565c0', // Original color
    marginTop: 8,
    fontStyle: 'italic',
  },
  // New styles for the Nudge button positioning
  nudgeButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 15,
  },
  nudgeButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
});