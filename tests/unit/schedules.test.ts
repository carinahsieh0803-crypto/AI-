import { describe, expect, it } from "vitest";
import { hasTimeConflict, isValidTimeRange } from "../../lib/schedules";

describe("schedule time rules", () => {
  it("AC-1.2-3 rejects an end time equal to or earlier than the start", () => {
    expect(isValidTimeRange({ start: 10, end: 10 })).toBe(false);
    expect(isValidTimeRange({ start: 11, end: 10 })).toBe(false);
  });

  it("AC-1.4-2 detects overlapping intervals", () => {
    expect(hasTimeConflict(
      { start: 9.5, end: 10.5 },
      [{ start: 9, end: 10 }],
    )).toBe(true);
  });

  it("AC-1.4-3 allows adjacent intervals", () => {
    expect(hasTimeConflict(
      { start: 10, end: 11 },
      [{ start: 9, end: 10 }],
    )).toBe(false);
  });
});
