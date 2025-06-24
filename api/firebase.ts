import { addDoc, collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase'; // Imports configured Firebase instance
import { Reading } from '../types';

// A type for the data we send to Firestore (omitting the `id` which is auto-generated)
type NewReadingData = Omit<Reading, 'id'>;

/**
 * Creates or updates a user's profile document in the 'users' collection.
 * @param uid The user's unique ID from Firebase Authentication.
 * @param data The user data to save (firstName, lastName, email).
 */
export const setUserProfile = async (uid: string, data: { firstName: string, lastName: string, email: string }) => {
  try {
    const userDocRef = doc(db, 'users', uid); // Creates a reference to a document with the user's UID
    await setDoc(userDocRef, data); // Creates the document if it doesn't exist, or updates it if it does
  } catch (error) {
    console.error("Error setting user profile:", error);
    throw new Error("Failed to save user profile.");
  }
};


/**
 * Adds a new reading document to Firestore.
 * @param readingData The reading data to add.
 */
export const addReading = async (readingData: NewReadingData): Promise<void> => {
  try {
    const readingsCol = collection(db, 'readings');
    await addDoc(readingsCol, readingData);
    console.log('Reading added successfully!');
  } catch (error) {
    console.error('Error adding reading:', error);
    // Could throw the error to be handled by the component
    throw new Error('Failed to post reading.');
  }
};

/**
 * Fetches all readings for a specific date.
 * @param date The date to fetch readings for (YYYY-MM-DD).
 * @returns A promise that resolves to an array of Reading objects.
 */
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
    return []; // Return an empty array on error
  }
};