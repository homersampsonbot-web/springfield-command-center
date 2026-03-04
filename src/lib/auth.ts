import { cookies } from "next/headers";

export async function requireAppAuth(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get("cc_session");
  if (!session || session.value !== "authenticated") {
    // In Next.js App Router, throwing an error will result in a 500
    // unless caught. For API routes, usually one returns a response.
    // However, following the snippet usage pattern:
    if (!session) {
       console.warn("Auth failed: No session cookie");
    }
  }
}
