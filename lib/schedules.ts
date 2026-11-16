export type TimeRange = {
  start: number;
  end: number;
};

export function isValidTimeRange({ start, end }: TimeRange) {
  return Number.isFinite(start) && Number.isFinite(end) && end > start;
}

export function hasTimeConflict(candidate: TimeRange, existing: TimeRange[]) {
  return existing.some((item) => candidate.start < item.end && candidate.end > item.start);
}
