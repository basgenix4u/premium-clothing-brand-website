import { getServices } from "@/server/composition";
import { apiRoute, json } from "@/server/http/api";
import { readJson } from "@/server/http/request";
import { clientIpKey } from "@/server/http/client-ip";
import { registerSchema } from "@/server/modules/auth/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = apiRoute(async (request) => {
  const body = await readJson(request, registerSchema);
  const user = await getServices().auth.register(body, {
    ipKey: clientIpKey(request),
    ...(request.headers.get("user-agent")
      ? { userAgent: request.headers.get("user-agent") ?? "" }
      : {}),
  });
  return json({ user }, { status: 201 });
});
