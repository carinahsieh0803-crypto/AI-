import { describe, expect, it } from "vitest";
import {
  hasTimeConflict,
  isValidTimeRange,
  validateEventInput,
} from "../../lib/schedules";

describe("schedule time rules", () => {
  it("AC-1.2-1 accepts a valid event title and time range", () => {
    expect(validateEventInput("  完成介面提案  ", { start: 10, end: 11 })).toEqual({
      title: "完成介面提案",
      range: { start: 10, end: 11 },
    });
  });

  it("AC-1.2-2 throws for a blank event title", () => {
    expect(() => validateEventInput("   ", { start: 10, end: 11 }))
      .toThrow("請輸入標題");
  });

  it("AC-1.2-3 rejects an end time equal to or earlier than the start", () => {
    expect(isValidTimeRange({ start: 10, end: 10 })).toBe(false);
    expect(isValidTimeRange({ start: 11, end: 10 })).toBe(false);
    expect(() => validateEventInput("讀書", { start: 11, end: 10 }))
      .toThrow("結束時間必須晚於開始時間");
  });

  it("AC-1.4-1 allows moving an event to a free interval", () => {
    expect(hasTimeConflict(
      { start: 13, end: 14 },
      [{ start: 9, end: 10 }, { start: 11, end: 12 }],
    )).toBe(false);
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
