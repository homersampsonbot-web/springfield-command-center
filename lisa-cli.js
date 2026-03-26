const axios = require('axios');

const LISARELAY_URL = "http://18.190.203.220:3004/relay";

async function sendMessage(messageContent) {
  const payload = {
    origin: "lisa-cli",
    type: "message",
    content: messageContent,
    timestamp: new Date().toISOString()
  };
  try {
    const response = await axios.post(LISARELAY_URL, payload);
    console.log(`Message sent via Lisa relay: "${messageContent}"`);
    return payload;
  } catch (error) {
    console.error("Error sending message:", error.message);
    throw error;
  }
}

async function sendArtifact(artifactUrl, artifactDescription) {
  const payload = {
    origin: "lisa-cli",
    type: "artifact",
    content: {
      artifactType: "link",
      url: artifactUrl,
      description: artifactDescription || "Lisa CLI submitted artifact"
    },
    timestamp: new Date().toISOString()
  };
  try {
    const response = await axios.post(LISARELAY_URL, payload);
    console.log(`Artifact submitted via Lisa relay: "${artifactUrl}"`);
    return payload;
  } catch (error) {
    console.error("Error submitting artifact:", error.message);
    throw error;
  }
}

async function main() {
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  if (!command) {
    console.log('Usage: node lisa-cli.js <command> <arg1> [arg2]');
    console.log('Commands:');
    console.log('  message \"<your message>\"');
    console.log('  artifact \"<url>\" \"[description]\"');
    process.exit(1);
  }

  switch (command) {
    case 'message':
      if (!arg1) {
        console.error("Error: Message content is required.");
        process.exit(1);
      }
      await sendMessage(arg1);
      break;
    case 'artifact':
      if (!arg1) {
        console.error("Error: Artifact URL is required.");
        process.exit(1);
      }
      await sendArtifact(arg1, arg2);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Usage: node lisa-cli.js <command> <arg1> [arg2]');
      process.exit(1);
  }
}

main().catch(error => {
  console.error("CLI execution failed:", error);
  process.exit(1);
});