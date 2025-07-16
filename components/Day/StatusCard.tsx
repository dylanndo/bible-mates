import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Mate, Reading } from '../../types';

type StatusCardProps = {
  mate: Mate;
  reading: Reading | undefined;
  streakLength: number;
};

export default function StatusCard({ mate, reading, streakLength }: StatusCardProps) {
  const hasRead = !!reading;

  const handleNudge = () => {
    Alert.alert("Nudge Sent!", `A friendly nudge has been sent to ${mate.firstName}.`);
  };

  return (
    <View style={[styles.cardBase, { backgroundColor: hasRead ? mate.color : '#fafafa' }, !hasRead && styles.cardUnread]}>
      <View style={styles.cardHeader}>
        <View style={styles.nameContainer}>
          <Text style={[styles.nameText, !hasRead && styles.nameTextUnread]}>
            {mate.firstName} {mate.lastName}
          </Text>
          {/* Display streak count if the user has read */}
          {hasRead && streakLength > 0 && (
            <View style={styles.streakContainer}>
              <Text style={styles.streakText}>{streakLength}</Text>
              <Text style={styles.streakEmoji}>🔥</Text>
            </View>
          )}
        </View>
        
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
         {reading.book} {reading.chapter}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  nameTextUnread: {
    color: '#aaa',
    fontWeight: 'normal',
  },
  checkIcon: {
    marginLeft: 8,
  },
  readingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 8,
    fontStyle: 'italic',
  },
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
   streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  streakText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  streakEmoji: {
    fontSize: 14,
    marginLeft: 3,
  },
});