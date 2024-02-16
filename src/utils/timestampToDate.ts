/**
 * Converts millisecond timestamp to date
 */
export function timestampToDate(timestamp: number) {
  const date = new Date(timestamp);
  const formattedDate = new Intl.DateTimeFormat('en-US').format(date);
  return formattedDate;
}
