/** YYYY-MM-DD in the user's own timezone (toISOString() would use UTC and can be off by a day). */
export const toLocalDateString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
