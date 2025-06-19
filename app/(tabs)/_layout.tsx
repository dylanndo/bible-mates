import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Button, Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Import Firebase signOut and auth
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase'; // Adjust path as needed

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  // Create a reusable logout button for the header
  const logoutButton = () => (
    <Button
      title="Logout"
      onPress={async () => {
      console.log("Logout button pressed");
        try {
          await signOut(auth);
          console.log("Sign out complete");
          router.replace('/LoginScreen');
        } catch (error) {
          console.error("Logout failed", error);
        }
      }}
    />
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
        headerRight: logoutButton,    // Add this line to show logout on all tabs
        headerShown: true,            // Show the header so Logout appears
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
