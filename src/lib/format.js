export const initials = (name) =>
  (name || '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
export const clockTime = (date) =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(date));
export function recentTime(date) {
  const value = new Date(date);
  return value.toDateString() === new Date().toDateString()
    ? clockTime(date)
    : value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
export const dayLabel = (date) =>
  new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
export const fileSize = (bytes) =>
  bytes < 1048576 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
