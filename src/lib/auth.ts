import { cookies, headers } from "next/headers";

export async function requireAppAuth(req: Request) {
  // Check for Springfield API Key first (for agent/worker access)
  const headerList = await headers();
  const apiKey = headerList.get("x-springfield-key");
  const validKey = process.env.HOMER_GATEWAY_TOKEN || "314e60bced474eb381ac8655eefd3525";

  if (apiKey === validKey) {
    return; // Authorized via API key
  }

  // Fallback to session cookie (for UI access)
  const cookieStore = await cookies();
  const session = cookieStore.get("cc_session");
  
  if (session && session.value === "authenticated") {
    return; // Authorized via session
  }

  // If neither, throw error for the catch block in routes
  throw new Error("unauthorized");
}
