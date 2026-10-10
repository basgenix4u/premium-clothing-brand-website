import { apiRoute } from "@/server/http/api";
import { NotFoundError } from "@/server/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Catch-all for any /api path that no route file matches. Returns an RFC 9457 problem
 * instead of the framework's HTML 404, so clients always get one error format.
 */
const unknownApiRoute = apiRoute(() => {
  throw new NotFoundError("No API route matches this address.");
});

export const GET = unknownApiRoute;
export const POST = unknownApiRoute;
export const PUT = unknownApiRoute;
export const PATCH = unknownApiRoute;
export const DELETE = unknownApiRoute;
