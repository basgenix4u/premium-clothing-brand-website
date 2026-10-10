import type { z } from "zod";
import { AppError, BadRequestError, ValidationFailedError } from "@/server/http/errors";

export const MAX_JSON_BYTES = 16_384;

export function flattenIssues(issues: readonly z.core.$ZodIssue[]): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join(".") : "_root";
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

/** Parses a JSON body. Enforces content type, size and schema before any business logic runs. */
export async function readJson<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<z.output<S>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new AppError(415, "Unsupported media type", "Send the request body as application/json.");
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_JSON_BYTES) {
    throw new AppError(413, "Payload too large", `Bodies must be ${MAX_JSON_BYTES} bytes or less.`);
  }
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_JSON_BYTES) {
    throw new AppError(413, "Payload too large", `Bodies must be ${MAX_JSON_BYTES} bytes or less.`);
  }
  let raw: unknown;
  try {
    raw = text.length === 0 ? {} : JSON.parse(text);
  } catch {
    throw new BadRequestError("The request body is not valid JSON.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw new ValidationFailedError(flattenIssues(result.error.issues));
  return result.data;
}

/** Parses query-string parameters against a schema. */
export function parseQuery<S extends z.ZodType>(url: URL, schema: S): z.output<S> {
  const raw = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) throw new ValidationFailedError(flattenIssues(result.error.issues));
  return result.data;
}
