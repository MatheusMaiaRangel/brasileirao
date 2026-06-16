export function getTimeId(time) {
  return time?.id ?? time?._id ?? null;
}