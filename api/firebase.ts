// --- EDIT: Added 'getDoc' to the import list from firestore. ---
import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
// --- EDIT: Added 'Group' to the list of imported types. ---
import { Group, Mate, Reading } from '../types';

// The type for creating a new reading, omitting the auto-generated ID.
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

export const getUserProfile = async (uid: string): Promise<Mate | null> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    // This line now works correctly because getDoc is imported.
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as Mate;
    }
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

export const getGroupsForUser = async (userId: string): Promise<Group[]> => {
    if (!userId) return [];
    try {
        const groupsCol = collection(db, 'groups');
        const q = query(groupsCol, where('mateIds', 'array-contains', userId));
        const querySnapshot = await getDocs(q);

        const groups: Group[] = [];
        querySnapshot.forEach(doc => {
            groups.push({ id: doc.id, ...doc.data() } as Group);
        });
        return groups;

    } catch (error) {
        console.error("Error fetching groups for user: ", error);
        return [];
    }
}

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

// --- START: NEW FUNCTIONS for Joining a Group ---
/**
 * Finds a group document based on its unique invite code.
 * @param inviteCode The invite code to search for.
 * @returns A promise that resolves to the group document data or null if not found.
 */
export const findGroupByInviteCode = async (inviteCode: string): Promise<Group | null> => {
    if (!inviteCode) return null;
    try {
        const groupsCol = collection(db, 'groups');
        const q = query(groupsCol, where('inviteCode', '==', inviteCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log('No group found with that invite code.');
            return null;
        }

        const groupDoc = querySnapshot.docs[0];
        return { id: groupDoc.id, ...groupDoc.data() } as Group;
    } catch (error) {
        console.error("Error finding group by invite code: ", error);
        return null;
    }
};

/**
 * Adds a user's ID to a group's mateIds array.
 * @param groupId The ID of the group document to update.
 * @param userId The UID of the user to add.
 */
export const addUserToGroup = async (groupId: string, userId: string) => {
    if (!groupId || !userId) return;
    try {
        const groupRef = doc(db, 'groups', groupId);
        await updateDoc(groupRef, {
            mateIds: arrayUnion(userId)
        });
        console.log(`User ${userId} successfully added to group ${groupId}`);
    } catch (error) {
        console.error("Error adding user to group: ", error);
        throw new Error('Could not join the group.');
    }
};
// --- END: NEW FUNCTIONS for Joining a Group ---
