const { classifyMaggie } = require("./src/lib/maggie");
require("dotenv").config();

async function test() {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = "AIzaSyDvbfQgUeS14jsA7oERt55NQ2nDJklXLkM";
  console.log("Testing Maggie classification...");
  const envelope = await classifyMaggie("We should review the Bart migration plan");
  console.log("Envelope:", JSON.stringify(envelope, null, 2));
}

test().catch(console.error);
