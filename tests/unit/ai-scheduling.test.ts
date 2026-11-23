import { describe, expect, it } from "vitest";
import {
  commitConfirmedProposals,
  findAvailableRanges,
  isValidDuration,
  type ProposalItem,
} from "../../lib/schedules";

describe("AI scheduling proposals", () => {
  it("AC-2.2-1 returns a free range before the requested deadline", () => {
    const available = findAvailableRanges(
      [
        { start: 9, end: 10 },
        { start: 14, end: 15 },
      ],
      { start: 8, end: 18 },
      3,
    );

    expect(available).toEqual([
      { start: 10, end: 14 },
      { start: 15, end: 18 },
    ]);
  });

  it("AC-2.2-2 returns no proposal when there is insufficient available time", () => {
    expect(findAvailableRanges(
      [
        { start: 8, end: 15 },
        { start: 16, end: 18 },
      ],
      { start: 8, end: 18 },
      3,
    ).length).toBe(0);
  });

  it("AC-2.2-3 rejects zero, negative, and over-day durations", () => {
    expect(isValidDuration(0)).toBe(false);
    expect(isValidDuration(-2)).toBe(false);
    expect(isValidDuration(25)).toBe(false);
  });

  it("AC-2.3-1 adds confirmed proposals exactly once", () => {
    const proposal: ProposalItem = {
      title: "複習微積分",
      category: "學習",
      day: 2,
      start: 15,
      end: 17,
    };

    expect(commitConfirmedProposals([], [proposal])).toEqual([proposal]);
  });

  it("AC-2.3-2 leaves existing items unchanged when no proposal is confirmed", () => {
    const existing: ProposalItem[] = [{
      title: "既有行程",
      category: "工作",
      day: 0,
      start: 9,
      end: 10,
    }];

    expect(commitConfirmedProposals(existing, [])).toEqual(existing);
  });

  it("AC-2.3-3 throws CONFLICT when a proposal overlaps a newer item", () => {
    const existing: ProposalItem[] = [{
      title: "新行程",
      category: "工作",
      day: 2,
      start: 16,
      end: 17,
    }];
    const proposal: ProposalItem = {
      title: "複習微積分",
      category: "學習",
      day: 2,
      start: 15,
      end: 17,
    };

    expect(() => commitConfirmedProposals(existing, [proposal])).toThrow("CONFLICT");
  });

  it("AC-2.3-4 does not duplicate an already confirmed proposal", () => {
    const proposal: ProposalItem = {
      title: "複習微積分",
      category: "學習",
      day: 2,
      start: 15,
      end: 17,
    };

    const firstCommit = commitConfirmedProposals([], [proposal]);
    expect(commitConfirmedProposals(firstCommit, [proposal])).toEqual(firstCommit);
  });
});
