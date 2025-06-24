import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext'; // Import the new provider

// Re-export the useAuth hook from its new location for convenience.
// Components can now import it from `app/_layout` or `contexts/AuthContext`.
export { useAuth } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    // Wrap the entire app in the AuthProvider
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="SignUpScreen" options={{ headerShown: false }} />
        {/* Add the future Day View screen to the stack navigator */}
        <Stack.Screen 
          name="day/[date]" 
          options={{ 
            title: "Day View", 
            headerBackTitle: "Calendar",
            headerShown: true, // Make sure the header is visible for this screen
          }} 
        />
      </Stack>
    </AuthProvider>
  );
}