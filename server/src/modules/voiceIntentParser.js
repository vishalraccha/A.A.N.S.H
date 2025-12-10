import { makeApiCall, extractJsonFromResponse } from '../utils/aiClient.js';

export async function parseVoiceIntent(voiceText) {
  console.log("Parsing voice intent...");

  const intentPrompt = `Parse this voice command into structured JSON for task automation:
Voice Command: "${voiceText}"

Return JSON in this exact format:
{
  "family": "document|communication|file|web|system|project|app",
  "action": "create|send|open|search|control|run",
  "params": {
    "type": "word|excel|ppt|email|whatsapp|chrome|vscode|react|vue|angular|next|node|python|django|flutter",
    "topic": "extracted main topic/subject",
    "target": "recipient/app name/file path",
    "techStack": "react|vue|angular|next|nuxt|node|express|python|django|flask|php|laravel|java|spring|dotnet|flutter|react-native|vanilla",
    "additional": "any extra parameters or details"
  }
}

Examples:
"Create a Word document about AI" → {"family":"document","action":"create","params":{"type":"word","topic":"AI"}}
"Open Chrome browser" → {"family":"app","action":"open","params":{"type":"chrome","target":"chrome"}}
"Create a Vue.js project about dashboard" → {"family":"project","action":"create","params":{"type":"vue","techStack":"vue","topic":"dashboard"}}
"Create a Node.js API for users" → {"family":"project","action":"create","params":{"type":"node","techStack":"node","topic":"users API"}}
"Create a Django blog website" → {"family":"project","action":"create","params":{"type":"python","techStack":"django","topic":"blog"}}
"Create a Flutter mobile app for fitness" → {"family":"project","action":"create","params":{"type":"flutter","techStack":"flutter","topic":"fitness app"}}

Parse the voice command now:`;

  try {
    const response = await makeApiCall(intentPrompt, 1500);
    return extractJsonFromResponse(response, "voice intent");
  } catch (error) {
    if (error.message === "API_QUOTA_EXCEEDED") {
      throw new Error("API_QUOTA_EXCEEDED");
    }
    console.error("Intent parsing failed:", error.message);
    throw error;
  }
}
