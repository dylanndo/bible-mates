import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase'; // Imports configured Firebase instance
import { Mate, Reading } from '../types';

type NewReadingData = Omit<Reading, 'id'>;

export const setUserProfile = async (uid: string, data: { firstName: string, lastName: string, email: string }) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, data);
  } catch (error) {
    console.error("Error setting user profile:", error);
    throw new Error("Failed to save user profile.");
  }
};

/**
 * Fetches a user's profile from the 'users' collection.
 * @param uid The user's unique ID.
 * @returns A promise that resolves to the user's profile data (Mate type) or null if not found.
 */
export const getUserProfile = async (uid: string): Promise<Mate | null> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as Mate;
    }
    console.log('No such user profile!');
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const addReading = async (readingData: NewReadingData): Promise<void> => {
  try {
    const readingsCol = collection(db, 'readings');
    await addDoc(readingsCol, readingData);
    console.log('Reading added successfully!');
  } catch (error) {
    console.error('Error adding reading:', error);
    throw new Error('Failed to post reading.');
  }
};

export const getReadingsForDate = async (date: string): Promise<Reading[]> => {
  try {
    const readingsCol = collection(db, 'readings');
    const q = query(readingsCol, where('date', '==', date));
    const querySnapshot = await getDocs(q);
    const readings: Reading[] = [];
    querySnapshot.forEach((doc) => {
      readings.push({ id: doc.id, ...doc.data() } as Reading);
    });
    return readings;
  } catch (error) {
    console.error('Error fetching readings for date:', error);
    return [];
  }
};

/**
 * Fetches all readings for a specific month and year.
 * @param year The full year (e.g., 2025).
 * @param month The month, 0-indexed (e.g., 5 for June).
 * @returns A promise that resolves to an array of Reading objects.
 */
export const getReadingsForMonth = async (year: number, month: number): Promise<Reading[]> => {
  try {
    // Calculate the start and end dates for the month
    const startDate = new Date(year, month, 1).toISOString().slice(0, 10);
    const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10);

    const readingsCol = collection(db, 'readings');
    // Create a query to get all documents where the 'date' is within the month
    const q = query(readingsCol, where('date', '>=', startDate), where('date', '<=', endDate));
    const querySnapshot = await getDocs(q);

    const readings: Reading[] = [];
    querySnapshot.forEach((doc) => {
      readings.push({ id: doc.id, ...doc.data() } as Reading);
    });

    return readings;
  } catch (error) {
    console.error('Error fetching readings for month:', error);
    return [];
  }
};
