import React, { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';

// Define the shape of the data and functions the context will provide.
interface CalendarContextType {
  viewedDate: Date;
  setViewedDate: Dispatch<SetStateAction<Date>>;
}

// Create the context with a default value of null.
const CalendarContext = createContext<CalendarContextType | null>(null);

/**
 * A custom hook to easily access the CalendarContext from any component.
 */
export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}

/**
 * The provider component that will wrap your app.
 * It holds the shared date state and makes it available to all children.
 */
export function CalendarProvider({ children }: { children: ReactNode }) {
  const [viewedDate, setViewedDate] = useState(new Date());

  const value = {
    viewedDate,
    setViewedDate,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}
