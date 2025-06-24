import { Link } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';
import { setUserProfile } from '../api/firebase'; // Import our new API function
import AppButton from '../components/core/AppButton';
import AppTextInput from '../components/core/AppTextInput';
import { auth } from '../firebase';

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Missing Information', 'Please fill out all fields.');
      return;
    }
    try {
      // Step 1: Create the user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Save the user's additional details to Firestore
      if (user) {
        await setUserProfile(user.uid, { 
          firstName, 
          lastName, 
          email 
        });
      }
      
      // Automatic navigation is handled by AuthContext upon successful auth state change
    } catch (error: any) {
      // Handle potential errors, e.g., email already in use
      Alert.alert('Sign Up Failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        
        <AppTextInput
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <AppTextInput
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />
        <AppTextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AppTextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <AppButton title="Sign Up" onPress={handleSignUp} />
        
        <Link href="/LoginScreen" style={styles.link}>
          <Text>Already have an account? Login</Text>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#0a7ea4'
  },
  link: {
    marginTop: 15,
    textAlign: 'center',
    color: 'blue',
  },
});