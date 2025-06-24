import { useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';

// Define the shape of the context value
interface AuthContextType {
  user: User | null;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to use the AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to protect routes
function useProtectedRoute(user: User | null) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // If segments isn't ready yet (is an empty array), do nothing.
    if (!segments[0]) {
      return;
    }

    // Check if the current route is one of the authentication screens.
    const inAuthScreen = segments[0] === 'LoginScreen' || segments[0] === 'SignUpScreen';

    // If the user is not signed in and they are NOT on an auth screen,
    // redirect them to the login screen.
    if (!user && !inAuthScreen) {
      router.replace('/LoginScreen');
    } 
    // If the user IS signed in and they ARE on an auth screen,
    // redirect them to the main app screen ('/').
    else if (user && inAuthScreen) {
      router.replace('/');
    }
  }, [user, segments, router]);
}

// The provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Watch for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Run the route protection
  useProtectedRoute(user);

  const handleSignOut = async () => {
    await signOut(auth);
    // The onAuthStateChanged listener will automatically set user to null
  };

  return (
    <AuthContext.Provider value={{ user, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}