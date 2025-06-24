import { Link } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import AppButton from '../components/core/AppButton';
import AppTextInput from '../components/core/AppTextInput';
import { auth } from '../firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The router protection in AuthContext will handle navigation
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bible Mates</Text>
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
        <AppButton title="Login" onPress={handleLogin} />
        <Link href="/SignUpScreen" style={styles.link}>
          <Text>Don&rsquo;t have an account? Sign Up</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  content: {
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