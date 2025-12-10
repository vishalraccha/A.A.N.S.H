import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

if (!process.env.GOOGLE_API_KEY) {
  console.error("GOOGLE_API_KEY is missing. Please set it in your .env file");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const API_DELAY = 2000;
let lastApiCall = 0;

async function rateLimitDelay() {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;

  if (timeSinceLastCall < API_DELAY) {
    const waitTime = API_DELAY - timeSinceLastCall;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastApiCall = Date.now();
}

async function makeApiCall(prompt, maxTokens = 8000, retries = 2) {
  await rateLimitDelay();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`AI call ${attempt}/${retries}...`);

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.1,
          topP: 0.8,
          topK: 40,
        },
      });

      const response = result.response;
      if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("No valid response from AI");
      }

      const text = response.candidates[0].content.parts[0].text.trim();
      console.log(`AI generated response: ${text.length} chars`);
      return text;
    } catch (err) {
      if (err.message.includes('quota') || err.message.includes('429')) {
        console.error("API quota exceeded");
        throw new Error("API_QUOTA_EXCEEDED");
      }
      
      console.error(`AI call attempt ${attempt} failed:`, err.message);
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
    }
  }
}

function extractJsonFromResponse(text, context = "") {
  console.log(`Extracting JSON for ${context}...`);

  try {
    let cleaned = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .replace(/^[^{]*/, "")
      .replace(/[^}]*$/, "")
      .trim();

    let braceCount = 0;
    let start = -1;
    let end = -1;

    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === "{") {
        if (start === -1) start = i;
        braceCount++;
      } else if (cleaned[i] === "}") {
        braceCount--;
        if (braceCount === 0 && start !== -1) {
          end = i;
          break;
        }
      }
    }

    if (start === -1 || end === -1) {
      throw new Error("No valid JSON boundaries found");
    }

    const jsonStr = cleaned.substring(start, end + 1);
    const fixedJson = jsonStr
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
      .replace(/:\s*'([^']*)'/g, ': "$1"')
      .replace(/\n/g, " ")
      .replace(/\r/g, " ")
      .replace(/\s+/g, " ");

    const result = JSON.parse(fixedJson);
    console.log(`Successfully extracted ${context}`);
    return result;
  } catch (error) {
    console.error(`JSON extraction failed for ${context}:`, error.message);
    throw error;
  }
}

export async function testConnection() {
  try {
    console.log("Testing AI connection...");
    const text = await makeApiCall('Respond with exactly: {"test":"ok","status":"working"}', 200, 1);
    const result = extractJsonFromResponse(text, "test");
    return result.test === "ok";
  } catch (err) {
    if (err.message === "API_QUOTA_EXCEEDED") {
      return "quota_exceeded";
    }
    console.error("Connection test failed:", err.message);
    return false;
  }
}

export { makeApiCall, extractJsonFromResponse };