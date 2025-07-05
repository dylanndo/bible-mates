export type Reading = {
  id: string;      // Document ID from Firestore
  userId: string;  // ID of the user who made the reading
  firstName: string; // User's first name for display
  book: string;
  chapter: string;
  notes?: string;
  date: string;    // Date of the reading, formatted as "YYYY-MM-DD"
};

export type Mate = {
  id: string;      // User ID from Firebase Auth
  firstName: string;
  lastName: string; // Add lastName
  email: string;
  color: string;
};

export type Group = {
  id: string;
  name: string;
  mateIds: string[];
  inviteCode: string;
};