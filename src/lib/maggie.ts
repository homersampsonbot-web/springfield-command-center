import { prisma } from "@/lib/prisma";

export type MaggieEnvelope = {
  type: "idea" | "directive" | "question" | "issue" | "project";
  needsDebate: "yes" | "no";
  needsArchitecture: "yes" | "no";
  needsExecution: "yes" | "no";
  suggestedAgents: ("MARGE" | "LISA" | "HOMER" | "BART")[];
  confidence: "high" | "medium" | "low";
  asyncRelay: "yes" | "no";
};

export type MaggieResult = {
  envelope: MaggieEnvelope;
  isFallback: boolean;
};

const SAFE_FALLBACK_ENVELOPE: MaggieEnvelope = {
  type: "idea",
  needsDebate: "no",
  needsArchitecture: "no",
  needsExecution: "yes",
  suggestedAgents: ["HOMER"],
  confidence: "low",
  asyncRelay: "no"
};

export async function classifyMaggie(message: string): Promise<MaggieResult> {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY;

  let envelope: MaggieEnvelope | null = null;
  let isFallback = false;

  try {
    if (!apiKey) throw new Error("Missing API KEY");

    const prompt = `
You are Maggie, the first intelligence layer for the Springfield Team Thread.
Classify the following message from SMS (the human) into the approved envelope shape.

MESSAGE: "${message}"

RULES:
1. Return ONLY a valid JSON object.
2. type: idea (concept), directive (order), question (ask), issue (problem), project (complex work).
3. needsDebate: yes if it involves strategy/policy/conflict.
4. needsArchitecture: yes if it involves system design/Marge.
5. needsExecution: yes if it involves building/Homer.
6. suggestedAgents: array of MARGE, LISA, HOMER, BART.
7. asyncRelay: yes if it's long-form, complex, or requires "architecture/review/plan/migration/explain/design/assess/analyse".
8. confidence: high, medium, low.

SHAPE:
{
  "type": "idea | directive | question | issue | project",
  "needsDebate": "yes | no",
  "needsArchitecture": "yes | no",
  "needsExecution": "yes | no",
  "suggestedAgents": ["MARGE", "LISA", "HOMER", "BART"],
  "confidence": "high | medium | low",
  "asyncRelay": "yes | no"
}
`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
        }),
        signal: AbortSignal.timeout(2800)
      }
    );

    if (!res.ok) throw new Error(`Gemini API error: ${res.statusText}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) envelope = JSON.parse(text) as MaggieEnvelope;
  } catch (e: any) {
    console.error(`[Maggie] Classification attempt failed: ${e.message}`);
  }

  if (!envelope) {
    envelope = SAFE_FALLBACK_ENVELOPE;
    isFallback = true;
  }

  // Persist classification
  await prisma.event.create({
    data: {
      scope: "SYSTEM",
      type: "THREAD_CLASSIFICATION",
      level: isFallback ? "WARNING" : "INFO",
      message: `Maggie Classification: ${envelope.type}${isFallback ? " (FALLBACK)" : ""}`,
      payload: {
        thread: "team",
        sender: "SMS",
        message,
        envelope,
        isFallback
      }
    }
  });

  return { envelope, isFallback };
}
