export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  // Pad the seconds with a leading zero if less than 10
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
