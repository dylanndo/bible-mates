type DayCell = {
  date: Date;
  type: 'prev' | 'current' | 'next';
};

/**
 * Generates a 6x7 grid of day cells for a given month and year.
 */
export function getMonthGrid(year: number, month: number): DayCell[][] {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  const numDaysInMonth = endDate.getDate();

  const startDayOfWeek = startDate.getDay(); // 0 (Sun) to 6 (Sat)
  
  const calendarCells: DayCell[] = [];

  // Previous month's days
  const prevMonthEndDate = new Date(year, month, 0);
  const prevMonthNumDays = prevMonthEndDate.getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    calendarCells.push({
      date: new Date(year, month - 1, prevMonthNumDays - i),
      type: 'prev',
    });
  }

  // Current month's days
  for (let i = 1; i <= numDaysInMonth; i++) {
    calendarCells.push({
      date: new Date(year, month, i),
      type: 'current',
    });
  }

  // Next month's days
  const totalCells = 42; // 6 weeks * 7 days
  let nextMonthDay = 1;
  while (calendarCells.length < totalCells) {
    calendarCells.push({
      date: new Date(year, month + 1, nextMonthDay),
      type: 'next',
    });
    nextMonthDay++;
  }

  const weeks: DayCell[][] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7));
  }
  
  return weeks;
}

/**
 * Checks if two Date objects represent the same calendar day.
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}