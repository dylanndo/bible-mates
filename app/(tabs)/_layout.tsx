import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, Platform, Text } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Firebase imports
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase'; // Make sure db is exported from your firebase.js

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');

  // Fetch first name from Firestore
  useEffect(() => {
    const fetchFirstName = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            setFirstName(userDoc.data().firstName);
          }
        } catch (e) {
          // Optionally handle error
          setFirstName('');
        }
      }
    };
    fetchFirstName();
  }, []);

  // Logout button
  const logoutButton = () => (
    <Button
      title="Logout"
      onPress={async () => {
        try {
          await signOut(auth);
          router.replace('/LoginScreen');
        } catch (error) {
          console.error("Logout failed", error);
        }
      }}
    />
  );

  // Header left: Hi, [first name]!
  const headerLeft = () => (
    <Text style={{ marginLeft: 16, fontWeight: 'bold' }}>
      {firstName ? `Hi, ${firstName}!` : ''}
    </Text>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
        }),
        headerLeft,           // <-- Add this line
        headerRight: logoutButton,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
