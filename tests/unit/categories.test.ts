import { describe, expect, it } from "vitest";
import {
  isValidCategoryName,
  isValidHexColor,
} from "../../lib/schedules";

describe("custom schedule categories", () => {
  it("AC-1.3-1 accepts a unique category name and valid hex color", () => {
    expect(isValidCategoryName("運動", ["學習", "工作", "娛樂"])).toBe(true);
    expect(isValidHexColor("#b16bd4")).toBe(true);
  });

  it("AC-1.3-2 rejects a blank category name", () => {
    expect(isValidCategoryName("   ", ["學習"])).toBe(false);
  });

  it("AC-1.3-3 rejects duplicate names", () => {
    expect(isValidCategoryName("運動", ["運動", "學習"])).toBe(false);
  });

  it("AC-1.3-4 rejects invalid hex colors", () => {
    expect(isValidHexColor("藍色")).toBe(false);
    expect(isValidHexColor("#123")).toBe(false);
  });

  it("AC-1.3-2 enforces the category name length boundary", () => {
    expect(isValidCategoryName("a".repeat(50), [], 50)).toBe(true);
    expect(isValidCategoryName("a".repeat(51), [], 50)).toBe(false);
  });
});
