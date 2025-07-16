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

// Represents a continuous streak of readings for a user.
export type Streak = {
  id: string;          // A unique ID for the streak (e.g., `userId-startDate`)
  userId: string;
  firstName: string;
  color: string;
  startDate: string;   // "YYYY-MM-DD"
  endDate: string;     // "YYYY-MM-DD"
  span: number;        // Number of days in the streak
};