import { describe, expect, it } from "vitest";
import { formatBytes, formatETA, formatPercent, formatSpeed } from "@/lib/format";

describe("format helpers", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.00 KB");
  });

  it("formats speed", () => {
    expect(formatSpeed(1048576)).toContain("/s");
  });

  it("formats percentages", () => {
    expect(formatPercent(0)).toBe("0%");
    expect(formatPercent(100)).toBe("100%");
  });

  it("formats eta", () => {
    expect(formatETA(0)).toBe("Ready");
    expect(formatETA(3720)).toBe("1h 2m");
  });
});

