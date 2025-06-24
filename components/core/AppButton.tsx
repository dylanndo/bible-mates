import React from 'react';
import { Pressable, PressableProps, StyleSheet, Text } from 'react-native';

interface AppButtonProps extends PressableProps {
  title: string;
}

export default function AppButton({ title, onPress, ...props }: AppButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress} {...props}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0a7ea4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});