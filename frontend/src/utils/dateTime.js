export function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLocalTime(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getDefaultStartTime(now = new Date()) {
  const start = new Date(now.getTime() - 60 * 60 * 1000);
  return formatLocalDate(start) === formatLocalDate(now)
    ? formatLocalTime(start)
    : '00:00';
}

export function combineLocalDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}
