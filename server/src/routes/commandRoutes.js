import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { extractJsonFromResponse } from "../utils/aiClient.js";
import { executeParsedCommand } from "../modules/systemExecutor.js";
import {
  getClipboardText,
  copySelectedText,
  getActiveWindowText,
  setClipboardText,
  pasteClipboardContent,
} from "../modules/screenCapture.js";
import { openApplication, focusApplication } from "../modules/systemExecutor.js";

let clipboardMemory = {
  text: "",
  timestamp: null,
  source: null,
};

dotenv.config();
const router = express.Router();

function startsWithWakeWord(command) {
  if (!command || typeof command !== "string") return false;
  const trimmed = command.trim();
  if (/^(hey|hi|hello|ok)\s+aansh\b/i.test(trimmed)) return true;
  if (/^aansh\b/i.test(trimmed)) return true;
  return false;
}

function removeWakeWord(command) {
  return command
    .replace(/^(hey|hi|hello|ok)\s+aansh\s*/i, "")
    .replace(/^aansh\s*/i, "")
    .trim();
}

// INTELLIGENT DETECTION: Does this need AI content?
function needsAIContent(command) {
  const lower = command.toLowerCase();

  // Requests that NEED AI
  const aiTriggers = [
    "tell",
    "explain",
    "write about",
    "describe",
    "joke",
    "story",
    "poem",
    "quote",
    "suggest",
    "recommend",
    "advice",
    "translate",
    "meaning",
    "what is",
    "how to",
    "why",
    "when",
    "in hindi",
    "in english",
    "in marathi",
    "formal",
    "professional",
    "invitation",
    "about",
    "regarding",
    "concerning",
  ];

  // Simple direct messages that DON'T need AI
  const directPatterns = [
    /^(hi|hello|hey|kya|kaise|how|what|where)\s+/i,
    /\b(kya kar raha|kaise ho|how are you|what's up|sup)\b/i,
    /^(ok|okay|yes|no|thanks|thank you)\b/i,
  ];

  // Check if it's a direct casual message
  for (const pattern of directPatterns) {
    if (pattern.test(lower)) {
      return false;
    }
  }

  // Check if any AI trigger is present
  for (const trigger of aiTriggers) {
    if (lower.includes(trigger)) {
      return true;
    }
  }

  // If message is very short and simple, don't use AI
  if (command.split(" ").length <= 5 && !lower.includes("about")) {
    return false;
  }

  return false;
}

// GENERATE AI CONTENT
async function generateAIContent(command, apiKey) {
  const { intent, app, content, topic, recipient } = command;

  console.log("🧠 JARVIS: Generating AI content...");

  let prompt = "";
  const lower = (content || "").toLowerCase();

  // PowerPoint
  if (app && (app.includes("powerpoint") || app.includes("ppt"))) {
    prompt = `Create PowerPoint presentation content about: ${topic || content}

Generate:
Title: [Clear engaging title]
Content: [5 bullet points, each 10-15 words, informative and detailed]

Be specific and educational.`;
  }

  // Word Document
  else if (app && app.includes("word")) {
    prompt = `Write a detailed document about: ${topic || content}

Include:
- Title
- Introduction (3-4 sentences)
- Main content (2-3 detailed paragraphs)
- Conclusion (2 sentences)`;
  }

  // Email
  else if (intent === "send_email") {
    const isFormal =
      lower.includes("formal") ||
      lower.includes("invitation") ||
      lower.includes("professional");

    if (isFormal) {
      prompt = `Write a formal professional email.
Recipient: ${recipient}
Subject: ${topic || "Professional Communication"}
Context: ${content}

Include: greeting, 2-3 professional paragraphs, closing.
Keep it polished and respectful.`;
    } else {
      prompt = `Write a professional email.
To: ${recipient}
About: ${topic || content}

2-3 sentences, friendly but professional.`;
    }
  }

  // WhatsApp/Messages
  else if (intent === "send_message") {
    // Joke request
    if (lower.includes("joke")) {
      const language = lower.includes("hindi")
        ? "Hindi"
        : lower.includes("marathi")
        ? "Marathi"
        : "English";
      prompt = `Tell a funny clean joke in ${language}. Just the joke, 2-3 lines, make it genuinely funny.`;
    }

    // Story request
    else if (lower.includes("story")) {
      prompt = `Tell a short interesting story (4-5 sentences). Make it engaging.`;
    }

    // Explanation/Tell about something
    else if (
      lower.includes("tell") ||
      lower.includes("explain") ||
      lower.includes("about")
    ) {
      prompt = `Explain about: ${content}
Keep it conversational, 3-4 sentences, easy to understand for WhatsApp message.`;
    }

    // Translation request
    else if (
      lower.includes("in hindi") ||
      lower.includes("in marathi") ||
      lower.includes("translate")
    ) {
      const targetLang = lower.includes("hindi")
        ? "Hindi"
        : lower.includes("marathi")
        ? "Marathi"
        : "English";
      prompt = `Translate to ${targetLang}: ${content}
Just give the translation, nothing else.`;
    }

    // Quote/Advice
    else if (
      lower.includes("quote") ||
      lower.includes("advice") ||
      lower.includes("suggest")
    ) {
      prompt = `Give advice about: ${content}
2-3 sentences, helpful and friendly.`;
    }

    // Default: friendly message
    else {
      prompt = `Write a friendly WhatsApp message about: ${content}
To: ${recipient}
Topic: ${topic || content}

3-4 sentences, casual and conversational.`;
    }
  }

  // General
  else {
    prompt = `Generate content about: ${content || topic}
Be informative, 3-4 sentences.`;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    };

    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 20000,
    });

    const generated =
      response?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (generated) {
      console.log(
        "✨ JARVIS: Generated -",
        generated.substring(0, 100) + "..."
      );
      return generated;
    }

    return content;
  } catch (error) {
    console.error("AI generation failed:", error.message);
    return content;
  }
}

// MAIN ROUTE
router.post("/runCommand", async (req, res) => {
  try {
    const { command } = req.body || {};

    if (!command) {
      return res.status(400).json({ error: "command is required" });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: "GOOGLE_API_KEY not configured" });
    }

    // if (!startsWithWakeWord(command)) {
    //   return res.status(400).json({
    //     error: 'Command must start with "Aansh"',
    //   });
    // }

    console.log(`\n🎤 USER: "${command}"`);

    const cleanCommand = removeWakeWord(command);

    // ============================================================================
    // COPY OPERATIONS
    // ============================================================================
    if (cleanCommand.toLowerCase().includes('copy') && 
        (cleanCommand.toLowerCase().includes('text') || 
         cleanCommand.toLowerCase().includes('screen') || 
         cleanCommand.toLowerCase().includes('this'))) {
      console.log('📋 Copy operation detected');
      
      try {
        const extractedText = await getActiveWindowText();
        
        if (extractedText && extractedText.length > 0) {
          clipboardMemory.text = extractedText;
          clipboardMemory.timestamp = new Date();
          clipboardMemory.source = 'screen';
          
          await setClipboardText(extractedText);
          
          console.log('✅ Text copied:', extractedText.substring(0, 100) + '...');
          
          return res.json({
            status: 'success',
            action: 'copy',
            message: 'Text copied from screen successfully',
            textLength: extractedText.length,
            preview: extractedText.substring(0, 200),
            fullText: extractedText,
            timestamp: clipboardMemory.timestamp
          });
        } else {
          return res.json({
            status: 'warning',
            action: 'copy',
            message: 'No text found in active window',
            suggestion: 'Make sure text is visible and try again'
          });
        }
      } catch (error) {
        return res.status(500).json({
          status: 'error',
          action: 'copy',
          error: error.message
        });
      }
    }

    // ============================================================================
    // PASTE OPERATIONS
    // ============================================================================
    if ((cleanCommand.toLowerCase().includes('paste') || cleanCommand.toLowerCase().includes('send')) && 
        (cleanCommand.toLowerCase().includes('this') || 
         cleanCommand.toLowerCase().includes('it') || 
         cleanCommand.toLowerCase().includes('text'))) {
      
      console.log('📋 Paste/Send operation detected');
      
      if (!clipboardMemory.text) {
        return res.json({
          status: 'error',
          message: 'No text in memory. Please copy text first.',
          suggestion: 'Use: "Aansh copy text from screen"'
        });
      }
      
      const parsePrompt = `Extract where to paste/send:
Command: "${cleanCommand}"

If mentions:
- "whatsapp" or name like "mahesh", "john" → {"app":"whatsapp","recipient":"name"}
- "word" → {"app":"word"}
- "notepad" → {"app":"notepad"}
- "excel" → {"app":"excel"}
- If no app mentioned → {"app":"active"}

JSON only:`;
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(process.env.GOOGLE_API_KEY)}`;
      const payload = {
        contents: [{ role: "user", parts: [{ text: parsePrompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
      };

      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000
      });

      const candidateText = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const parsed = extractJsonFromResponse(candidateText, "paste");
      
      const targetApp = parsed.app || 'active';
      const recipient = parsed.recipient || null;
      
      console.log('🎯 Target:', targetApp, recipient ? `(${recipient})` : '');
      
      if (targetApp === 'whatsapp' && recipient) {
        const command = {
          intent: 'send_message',
          app: 'whatsapp',
          recipient: recipient,
          content: clipboardMemory.text,
          needsAIGeneration: false
        };
        
        const result = await executeParsedCommand(command, { perCharDelayMs: 35 });
        
        return res.json({
          status: 'success',
          action: 'send',
          app: 'whatsapp',
          recipient: recipient,
          message: `Text sent to ${recipient} on WhatsApp`,
          textLength: clipboardMemory.text.length,
          result
        });
        
      } else if (targetApp === 'word' || targetApp === 'notepad' || targetApp === 'excel') {
        await openApplication(targetApp);
        await new Promise(r => setTimeout(r, 2000));
        
        try {
          await focusApplication(targetApp);
        } catch (e) {
          console.log('Focus failed, continuing...');
        }
        
        await new Promise(r => setTimeout(r, 500));
        await pasteClipboardContent();
        
        return res.json({
          status: 'success',
          action: 'paste',
          app: targetApp,
          message: `Text pasted in ${targetApp}`,
          textLength: clipboardMemory.text.length
        });
        
      } else {
        await pasteClipboardContent();
        
        return res.json({
          status: 'success',
          action: 'paste',
          app: 'active window',
          message: 'Text pasted in active window',
          textLength: clipboardMemory.text.length
        });
      }
    }

    // ============================================================================
    // COPY AND SEND COMBINED
    // ============================================================================
    if (cleanCommand.toLowerCase().includes('copy') && 
        (cleanCommand.toLowerCase().includes('send') || cleanCommand.toLowerCase().includes('whatsapp'))) {
      console.log('📋 Copy + Send operation detected');
      
      const extractedText = await getActiveWindowText();
      
      if (!extractedText || extractedText.length === 0) {
        return res.json({
          status: 'error',
          message: 'No text found to copy'
        });
      }
      
      clipboardMemory.text = extractedText;
      clipboardMemory.timestamp = new Date();
      
      const parsePrompt = `Extract recipient name from: "${cleanCommand}"
Example: "copy and send to mahesh" → {"recipient":"mahesh"}
JSON only:`;
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(process.env.GOOGLE_API_KEY)}`;
      const payload = {
        contents: [{ role: "user", parts: [{ text: parsePrompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 128 }
      };

      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000
      });

      const candidateText = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const parsed = extractJsonFromResponse(candidateText, "recipient");
      
      const recipient = parsed.recipient;
      
      if (!recipient) {
        return res.json({
          status: 'error',
          message: 'Could not identify recipient',
          suggestion: 'Try: "Aansh copy this text and send it to mahesh"'
        });
      }
      
      const command = {
        intent: 'send_message',
        app: 'whatsapp',
        recipient: recipient,
        content: extractedText,
        needsAIGeneration: false
      };
      
      const result = await executeParsedCommand(command, { perCharDelayMs: 35 });
      
      return res.json({
        status: 'success',
        action: 'copy_and_send',
        message: `Text copied and sent to ${recipient}`,
        recipient: recipient,
        textLength: extractedText.length,
        preview: extractedText.substring(0, 200),
        result
      });
    }

    // ============================================================================
    // MAIN COMMAND PARSING (WhatsApp, Email, Apps, etc.)
    // ============================================================================
    
    console.log("🔍 Parsing command with AI...");
    
    const parsePrompt = `You are a voice assistant. Parse this command into JSON.

Command: "${cleanCommand}"

Detect:
1. **intent**: open_app, type_text, send_message, send_email, search, other
2. **app**: whatsapp, chrome, notepad, word, excel, powerpoint, outlook, gmail, etc.
3. **recipient**: person's name (for messages/emails)
4. **content**: message text or email body
5. **topic**: email subject or document title
6. **action**: send, open, type, search
7. **execution**: how to execute (send/open/type/search)
8. **needsAIGeneration**: true if content needs AI enhancement (like "tell a joke", "write formal email")

Examples:
- "send whatsapp message to vishal and say hello vishal"
  → {"intent":"send_message","app":"whatsapp","recipient":"vishal","content":"hello vishal","action":"send","execution":"send","needsAIGeneration":false}

- "send whatsapp message to mahesh tell him a joke"
  → {"intent":"send_message","app":"whatsapp","recipient":"mahesh","content":"tell him a joke","action":"send","execution":"send","needsAIGeneration":true}

- "send email to john@example.com about meeting tomorrow"
  → {"intent":"send_email","app":"gmail","recipient":"john@example.com","content":"meeting tomorrow","topic":"Meeting Tomorrow","action":"send","execution":"send","needsAIGeneration":true}

- "open notepad and type hello world"
  → {"intent":"type_text","app":"notepad","content":"hello world","action":"type","execution":"open","needsAIGeneration":false}

- "search for python tutorials"
  → {"intent":"search","app":"chrome","content":"python tutorials","action":"search","execution":"open","needsAIGeneration":false}

Return only valid JSON, no explanation.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
      process.env.GOOGLE_API_KEY
    )}`;
    
    const payload = {
      contents: [{ role: "user", parts: [{ text: parsePrompt }] }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        maxOutputTokens: 512,
      },
    };

    const parseResponse = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });

    const candidateText =
      parseResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    console.log("📝 AI Response:", candidateText);

    const parsedCommand = extractJsonFromResponse(candidateText, cleanCommand);
    
    console.log("✅ Parsed Command:", JSON.stringify(parsedCommand, null, 2));

    // Check if AI content generation is needed
    if (parsedCommand.needsAIGeneration && parsedCommand.content) {
      console.log("🤖 Generating AI content...");
      const aiContent = await generateAIContent(
        parsedCommand,
        process.env.GOOGLE_API_KEY
      );
      parsedCommand.content = aiContent;
      console.log("✨ AI Content:", aiContent);
    }

    // Execute the command
    console.log("⚡ Executing command...");
    const result = await executeParsedCommand(parsedCommand, {
      autoTypeAfterOpen: true,
      perCharDelayMs: 40,
    });

    console.log("✅ Command executed:", result);

    return res.json({
      status: "success",
      command: cleanCommand,
      parsed: parsedCommand,
      result: result,
      message: `Command executed successfully`,
    });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

router.get("/clipboard", (req, res) => {
  res.json({
    hasText: !!clipboardMemory.text,
    textLength: clipboardMemory.text?.length || 0,
    preview: clipboardMemory.text?.substring(0, 200) || '',
    timestamp: clipboardMemory.timestamp,
    source: clipboardMemory.source
  });
});

router.delete("/clipboard", (req, res) => {
  clipboardMemory = { text: '', timestamp: null, source: null };
  res.json({ message: 'Clipboard memory cleared' });
});

router.get("/voiceStatus", (req, res) => {
  res.json({
    status: "online",
    platform: process.platform,
    aiEnabled: !!process.env.GOOGLE_API_KEY,
  });
});

export default router;