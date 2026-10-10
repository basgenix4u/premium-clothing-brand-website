import { describe, expect, it } from "vitest";
import { createLogger, getLogger } from "@/server/logging/logger";

type Sink = { lines: Record<string, unknown>[]; write: (chunk: string) => void };

const memorySink = (): Sink => {
  const sink: Sink = {
    lines: [],
    write: (chunk: string) => {
      sink.lines.push(JSON.parse(chunk) as Record<string, unknown>);
    },
  };
  return sink;
};

describe("createLogger", () => {
  it("emits structured JSON with the service name", () => {
    const sink = memorySink();
    createLogger("info", sink).info({ requestId: "r-1" }, "hello");
    expect(sink.lines).toHaveLength(1);
    expect(sink.lines[0]).toMatchObject({
      service: "vellum-storefront",
      msg: "hello",
      requestId: "r-1",
    });
  });

  it("redacts secrets and credentials at any depth", () => {
    const sink = memorySink();
    createLogger("info", sink).info(
      {
        password: "hunter2",
        token: "tok-abc",
        headers: { authorization: "Bearer xyz", cookie: "session=123" },
        user: { password: "nested-secret" },
      },
      "auth attempt",
    );
    const serialised = JSON.stringify(sink.lines[0]);
    expect(serialised).not.toContain("hunter2");
    expect(serialised).not.toContain("tok-abc");
    expect(serialised).not.toContain("Bearer xyz");
    expect(serialised).not.toContain("session=123");
    expect(serialised).not.toContain("nested-secret");
    expect(serialised).toContain("[REDACTED]");
  });

  it("respects the configured level", () => {
    const sink = memorySink();
    const logger = createLogger("error", sink);
    logger.info("ignored");
    logger.error("kept");
    expect(sink.lines.map((line) => line.msg)).toEqual(["kept"]);
  });
});

describe("getLogger", () => {
  it("returns a singleton logger", () => {
    expect(getLogger()).toBe(getLogger());
  });
});
