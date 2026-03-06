const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const RAW_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-pro-latest";
const PRIMARY_MODEL = RAW_MODEL;
const FALLBACK_MODELS = [
  "gemini-1.5-pro-latest",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

type GeminiResp = {
  text: string;
};

export async function geminiJSON(prompt: string): Promise<GeminiResp> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

  const callGemini = async (model: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await r.json().catch(() => ({}));
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join("\n") || "";

    if (!r.ok || !text) {
      throw new Error(`Gemini error ${r.status}: ${JSON.stringify(data).slice(0, 500)}`);
    }

    return { text };
  };

  const errors: string[] = [];
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter(m => m !== PRIMARY_MODEL)];
  for (const model of modelsToTry) {
    try {
      return await callGemini(model);
    } catch (e: any) {
      const msg = String(e?.message || e);
      errors.push(`${model}: ${msg}`);
      if (!msg.includes('Gemini error 404')) throw e;
    }
  }
  throw new Error(`Gemini error 404: ${errors.join(' | ')}`);
}
