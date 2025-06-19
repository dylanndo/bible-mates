// Import the functions you need from the SDKs you need
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBEnQFXJdFM1RiZW4jdQn8C1VjmSrxg6xU",
  authDomain: "bible-mates.firebaseapp.com",
  projectId: "bible-mates",
  storageBucket: "bible-mates.firebasestorage.app",
  messagingSenderId: "814066919376",
  appId: "1:814066919376:web:3c313b0405075c60affbd5",
  measurementId: "G-SMREYX79VL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);