const apiKey = "AIzaSyDvbfQgUeS14jsA7oERt55NQ2nDJklXLkM";
const message = "We should review the Bart migration plan";

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

async function test() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
    })
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
