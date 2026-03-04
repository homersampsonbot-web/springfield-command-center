import { Client } from "@upstash/qstash";

const q = new Client({ token: process.env.UPSTASH_QSTASH_TOKEN! });

export async function enqueueDirective(directiveId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/maggie/process-directive`;
  
  await q.publishJSON({
    url,
    body: { directiveId },
    retries: 2,
  });
}
