// A curated list of 10 distinct, visually appealing pastel colors.
// The first color is the special "self" color.
export const USER_COLORS = [
  '#cfeff1', 
  '#fff2d2', 
  '#ffc9ae', 
  '#e6cbf3', 
  '#e7fbd9', 
  '#d7e4ff', 
  '#fec9d3', 
  '#ffe7ff', 
  '#ffc7f4', 
  '#f5e7d8', 
];

/**
 * A fallback function to generate a consistent color for a user if join order is not available.
 * @param userId The unique ID of the user.
 * @returns A color string from the USER_COLORS palette.
 */
export const getColorForUser = (userId: string): string => {
  if (!userId) {
    // Return the primary red/pink color as a safe default instead of gray.
    return USER_COLORS[0];
  }
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash % USER_COLORS.length);
  return USER_COLORS[index];
};
