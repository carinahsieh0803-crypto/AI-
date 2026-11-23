import { describe, expect, it } from "vitest";
import { findAvailableRanges, type TimeRange } from "../../lib/schedules";

function findCommonAvailability(
  memberBusyRanges: TimeRange[][],
  window: TimeRange,
  durationHours: number,
) {
  const occupied: TimeRange[] = memberBusyRanges.flat();
  return findAvailableRanges(occupied, window, durationHours);
}

describe("common availability matrix", () => {
  it("AC-4.2-1 marks only ranges free from every member", () => {
    expect(findCommonAvailability(
      [
        [{ start: 9, end: 11 }, { start: 16, end: 18 }],
        [{ start: 13, end: 15 }, { start: 17, end: 18 }],
      ],
      { start: 9, end: 18 },
      2,
    )).toEqual([
      { start: 11, end: 13 },
    ]);
  });

  it("AC-4.2-2 returns no ranges when no continuous free interval remains", () => {
    expect(findCommonAvailability(
      [[{ start: 9, end: 18 }], [{ start: 9, end: 18 }]],
      { start: 9, end: 18 },
      2,
    )).toEqual([]);
  });

  it("AC-4.2-3 shows one member's available ranges", () => {
    expect(findCommonAvailability(
      [[{ start: 12, end: 14 }]],
      { start: 9, end: 18 },
      2,
    )).toEqual([
      { start: 9, end: 12 },
      { start: 14, end: 18 },
    ]);
  });
});
