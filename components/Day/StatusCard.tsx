// components/Day/StatusCard.tsx

import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Mate, Reading } from '../../types';

type StatusCardProps = {
  mate: Mate;
  reading: Reading | undefined;
  streakLength: number;
  isExpanded: boolean;
  onPress: () => void;
};

export default function StatusCard({ mate, reading, streakLength, isExpanded, onPress }: StatusCardProps) {
  const hasRead = !!reading;
  const animation = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    // Animate based on the isExpanded prop and the measured content height
    Animated.timing(animation, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, contentHeight]);

  const handleNudge = () => {
    Alert.alert("Nudge Sent!", `A friendly nudge has been sent to ${mate.firstName}.`);
  };

  // Animate the height of the container from 0 to the measured content height
  const animatedStyle = {
    height: animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, contentHeight],
    }),
    opacity: animation,
  };

  const NotesContent = () => (
    <View style={styles.notesWrapper}>
      {reading?.notes ? (
        <Text style={styles.notesText}>{reading.notes}</Text>
      ) : (
        <Text style={styles.noNotesText}>No notes for this reading.</Text>
      )}
    </View>
  );


  return (
    <Pressable onPress={onPress} disabled={!hasRead}>
      {/* This invisible view measures the content's height */}
      <View style={styles.measuringWrapper}>
        <View onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}>
          <NotesContent />
        </View>
      </View>
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

        {/* This animated container expands and collapses */}
        <Animated.View style={[styles.notesContainer, animatedStyle]}>
          <NotesContent />
        </Animated.View>
      </View>
    </Pressable>
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
  // New styles for animation
  notesContainer: {
    overflow: 'hidden',
  },
  measuringWrapper: {
    position: 'absolute',
    opacity: 0,
    top: 0,
    left: 0,
    right: 0,
    zIndex: -1, // Ensure it's not interactable
  },
  notesWrapper: {
    marginTop: 12,
    borderTopColor: 'rgba(0,0,0,0.1)',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  notesText: {
    fontSize: 15,
    color: '#333',
    fontStyle: 'italic',
  },
  noNotesText: {
    fontSize: 15,
    color: '#888',
    fontStyle: 'italic',
  }
});