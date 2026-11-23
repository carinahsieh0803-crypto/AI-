import { describe, expect, it } from "vitest";
import { viewScheduleForMember } from "../../lib/schedules";

describe("group schedule privacy", () => {
  const memberIds = ["member-a", "member-b"];
  const privateSchedule = {
    id: "private-1",
    title: "家庭私事",
    category: "娛樂",
    notes: "機密備註",
  };

  it("AC-4.1-1 masks title, category, and notes for another member", () => {
    const visible = viewScheduleForMember(
      privateSchedule,
      "member-b",
      "member-a",
      memberIds,
    );

    expect(visible).toEqual({
      id: "private-1",
      title: "忙碌中",
      category: "忙碌中",
    });
  });

  it("AC-4.1-2 returns full information for a public-to-group schedule", () => {
    expect(viewScheduleForMember(
      { ...privateSchedule, publicToGroup: true },
      "member-b",
      "member-a",
      memberIds,
    )).toEqual({
      id: "private-1",
      title: "家庭私事",
      category: "娛樂",
      notes: "機密備註",
    });
  });

  it("AC-4.1-3 returns full information to the owner", () => {
    expect(viewScheduleForMember(
      privateSchedule,
      "member-a",
      "member-a",
      memberIds,
    )).toEqual(privateSchedule);
  });

  it("AC-4.1-4 returns no schedule data to a non-member", () => {
    expect(viewScheduleForMember(
      privateSchedule,
      "outsider",
      "member-a",
      memberIds,
    )).toBeNull();
  });
});
