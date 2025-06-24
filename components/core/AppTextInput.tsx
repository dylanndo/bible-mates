import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

export default function AppTextInput(props: TextInputProps) {
  return (
    <TextInput
      style={styles.input}
      placeholderTextColor="#888"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginVertical: 10,
  },
});