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
 * Finds all groups that a user is a member of.
 * @param userId The UID of the user.
 * @returns A promise that resolves to an array of group objects.
 */
export const getGroupsForUser = async (userId: string) => {
    if (!userId) return [];
    try {
        const groupsCol = collection(db, 'groups');
        // Use 'array-contains' to query for the user's ID within the mateIds array
        const q = query(groupsCol, where('mateIds', 'array-contains', userId));
        const querySnapshot = await getDocs(q);

        const groups: any[] = [];
        querySnapshot.forEach(doc => {
            groups.push({ id: doc.id, ...doc.data() });
        });
        return groups;

    } catch (error) {
        console.error("Error fetching groups for user: ", error);
        return [];
    }
}

/**
 * Fetches the profiles of all mates in a given group.
 * @param groupId The ID of the group document.
 * @returns A promise that resolves to an array of Mate objects.
 */
export const getGroupMates = async (groupId: string): Promise<Mate[]> => {
    if (!groupId) return [];
    try {
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            console.log('No such group!');
            return [];
        }

        const mateIds = groupSnap.data().mateIds || [];
        if (mateIds.length === 0) return [];

        const usersCol = collection(db, 'users');
        const q = query(usersCol, where('__name__', 'in', mateIds));
        const usersSnap = await getDocs(q);

        const mates: Mate[] = [];
        usersSnap.forEach(doc => {
            mates.push({ id: doc.id, ...doc.data() } as Mate);
        });
        return mates;

    } catch (error) {
        console.error("Error fetching group mates: ", error);
        return [];
    }
}

/**
 * Fetches all readings for a list of users within a specific month.
 * @param userIds An array of user IDs.
 * @param year The full year.
 * @param month The month (0-indexed).
 * @returns A promise that resolves to an array of Reading objects.
 */
export const getReadingsForMatesByMonth = async (userIds: string[], year: number, month: number): Promise<Reading[]> => {
    if (userIds.length === 0) return [];
    try {
        const startDate = new Date(year, month, 1).toISOString().slice(0, 10);
        const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10);

        const readingsCol = collection(db, 'readings');
        const q = query(
            readingsCol,
            where('userId', 'in', userIds),
            where('date', '>=', startDate),
            where('date', '<=', endDate)
        );

        const querySnapshot = await getDocs(q);
        const readings: Reading[] = [];
        querySnapshot.forEach(doc => {
            readings.push({ id: doc.id, ...doc.data() } as Reading);
        });
        return readings;

    } catch (error) {
        console.error('Error fetching readings for mates:', error);
        return [];
    }
}

/**
 * Fetches all readings for a list of users on a specific day.
 * @param userIds An array of user IDs.
 * @param date The date string in 'YYYY-MM-DD' format.
 * @returns A promise that resolves to an array of Reading objects.
 */
export const getReadingsForMatesByDate = async (userIds: string[], date: string): Promise<Reading[]> => {
    if (userIds.length === 0) return [];
    try {
        const readingsCol = collection(db, 'readings');
        // Query for readings from the specific users on the specific date.
        const q = query(
            readingsCol,
            where('userId', 'in', userIds),
            where('date', '==', date)
        );
        const querySnapshot = await getDocs(q);
        const readings: Reading[] = [];
        querySnapshot.forEach(doc => {
            readings.push({ id: doc.id, ...doc.data() } as Reading);
        });
        return readings;
    } catch (error) {
        console.error('Error fetching readings for mates on date:', error);
        return [];
    }
}
