import { describe, expect, it } from "vitest";
import { problem } from "@/shared/problem";

describe("problem", () => {
  it("builds an RFC 9457 body without a detail field when none is given", () => {
    expect(problem(404, "Not found")).toEqual({
      type: "about:blank",
      title: "Not found",
      status: 404,
    });
  });

  it("includes detail when provided", () => {
    expect(problem(400, "Bad request", "quantity must be positive").detail).toBe(
      "quantity must be positive",
    );
  });
});
