// ============================================================================
// routes/aiRoutes.js - AI Chat Routes with Command Integration
// ============================================================================

import express from "express";
import axios from "axios";
import Conversation from "../models/Conversation.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { testConnection } from "../utils/aiClient.js";
import { executeParsedCommand } from "../modules/systemExecutor.js";

const router = express.Router();

// ============================================================================
// COMMAND DETECTION
// ============================================================================
function detectCommand(prompt) {
  const lowerPrompt = prompt.toLowerCase().trim();

  // Email patterns
  const emailPatterns = [
    /(?:send|write|compose)\s+(?:an?\s+)?(?:email|mail)\s+to\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    /(?:email|mail)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+(?:about|regarding|for)/i
  ];

  // Message patterns
  const messagePatterns = [
    /(?:send|text|message|say)\s+(?:to\s+)?(\w+)\s+(.+)/i,
    /(?:tell|inform)\s+(\w+)\s+(?:that\s+)?(.+)/i
  ];

  // App opening patterns
  const appPatterns = [
    /(?:open|launch|start)\s+(.+)/i
  ];

  // Search patterns
  const searchPatterns = [
    /(?:search|google|find)\s+(?:for\s+)?(.+)/i
  ];

  // Check for email
  for (const pattern of emailPatterns) {
    const match = lowerPrompt.match(pattern);
    if (match) {
      const email = match[1];
      const content = lowerPrompt.replace(match[0], '').trim();
      
      return {
        type: 'command',
        intent: 'send_email',
        recipient: email,
        content: content || 'email content',
        needsAIGeneration: true
      };
    }
  }

  // Check for messaging
  for (const pattern of messagePatterns) {
    const match = lowerPrompt.match(pattern);
    if (match) {
      return {
        type: 'command',
        intent: 'send_message',
        recipient: match[1],
        content: match[2],
        app: 'whatsapp',
        needsAIGeneration: lowerPrompt.includes('about') || lowerPrompt.includes('regarding')
      };
    }
  }

  // Check for app opening
  for (const pattern of appPatterns) {
    const match = lowerPrompt.match(pattern);
    if (match) {
      const appName = match[1].trim();
      
      return {
        type: 'command',
        intent: 'open_app',
        app: appName,
        content: null
      };
    }
  }

  // Check for search
  for (const pattern of searchPatterns) {
    const match = lowerPrompt.match(pattern);
    if (match) {
      return {
        type: 'command',
        intent: 'search',
        content: match[1],
        app: 'chrome'
      };
    }
  }

  return null;
}

// ============================================================================
// AI CONTENT GENERATION FOR COMMANDS
// ============================================================================
async function generateCommandContent(command) {
  if (!command.needsAIGeneration) return command.content;

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  let prompt = '';

  if (command.intent === 'send_email') {
    const isFormal = command.content.toLowerCase().includes('formal') || 
                     command.content.toLowerCase().includes('invitation');
    
    if (isFormal) {
      prompt = `Generate a formal professional email.
Recipient: ${command.recipient}
Context: ${command.content}

Format:
- Professional greeting (Dear Sir/Madam)
- Clear, professional body (2-3 paragraphs)
- Professional closing (Sincerely, Best regards)

Output ONLY the email body text, no subject line.`;
    } else {
      prompt = `Generate a professional email.
Recipient: ${command.recipient}
Context: ${command.content}

Format: greeting, body (2-3 sentences), closing.
Output only the email text.`;
    }
  } else if (command.intent === 'send_message') {
    prompt = `Generate a friendly WhatsApp message for ${command.recipient}.
Context: ${command.content}
Keep it natural, casual, under 50 words.
Output only the message text.`;
  }

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Content generation failed:', error.message);
    return command.content;
  }
}

// ============================================================================
// EXECUTE COMMAND
// ============================================================================
async function executeCommand(command) {
  try {
    // Generate AI content if needed
    if (command.needsAIGeneration) {
      console.log('🧠 Generating AI content...');
      command.content = await generateCommandContent(command);
      console.log('✨ Generated:', command.content.substring(0, 100) + '...');
    }

    // Execute the command
    const result = await executeParsedCommand(command, {
      autoTypeAfterOpen: true,
      perCharDelayMs: 35
    });

    return {
      success: true,
      message: getSuccessMessage(command, result),
      result
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to execute command: ${error.message}`,
      error: error.message
    };
  }
}

function getSuccessMessage(command, result) {
  switch (command.intent) {
    case 'send_email':
      return `Email composed to ${command.recipient}. Please review and send.`;
    case 'send_message':
      return `Message sent to ${command.recipient} successfully.`;
    case 'open_app':
      return `${command.app} opened successfully.`;
    case 'search':
      return `Search completed for: ${command.content}`;
    case 'type_text':
      return `Content typed successfully.`;
    default:
      return 'Command executed successfully.';
  }
}

// ============================================================================
// CHAT ENDPOINT
// ============================================================================
router.post("/chat", async (req, res) => {
  try {
    const { userId, prompt } = req.body;
    
    if (!userId || !prompt) {
      return res.status(400).json({ message: "userId and prompt required" });
    }

    console.log(`\n💬 Chat from user ${userId}: "${prompt}"`);

    // Check for commands first
    const commandInfo = detectCommand(prompt);

    if (commandInfo) {
      console.log('🎯 Command detected:', commandInfo.intent);
      
      const result = await executeCommand(commandInfo);
      const responseText = result.message;

      // Save to conversation
      let conversation = await Conversation.findOne({ userId });
      if (!conversation) {
        conversation = new Conversation({
          userId,
          messages: [
            { role: "user", content: prompt },
            { role: "assistant", content: responseText }
          ]
        });
      } else {
        conversation.messages.push(
          { role: "user", content: prompt },
          { role: "assistant", content: responseText }
        );
      }
      await conversation.save();

      return res.status(200).json({
        message: "Command executed",
        response: responseText,
        commandExecuted: true,
        commandInfo: {
          type: commandInfo.intent,
          success: result.success
        },
        messages: conversation.messages,
      });
    }

    // Regular AI chat if no command
    const connectionResult = await testConnection();

    if (connectionResult === "quota_exceeded") {
      return res.status(429).json({
        message: "API quota exceeded",
        quotaExceeded: true,
        response: "I'm currently unable to process requests due to API quota limits."
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const enhancedPrompt = `You are Aansh, a helpful AI assistant with automation capabilities.

I can help you with:
- Sending emails (e.g., "send email to john@example.com about meeting")
- Sending messages (e.g., "message John about tomorrow's plans")
- Opening applications (e.g., "open Chrome", "launch Notepad")
- Searching the web (e.g., "search for AI tutorials")
- Creating documents (e.g., "open Word and write report")

User message: ${prompt}

Respond naturally and helpfully. If the user wants to perform an action, suggest the specific command format.`;

    const result = await model.generateContent(enhancedPrompt);
    const responseText = result.response.text().trim();

    // Save conversation
    let conversation = await Conversation.findOne({ userId });
    if (!conversation) {
      conversation = new Conversation({
        userId,
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: responseText }
        ]
      });
    } else {
      conversation.messages.push(
        { role: "user", content: prompt },
        { role: "assistant", content: responseText }
      );
    }
    await conversation.save();

    return res.status(200).json({
      message: "Chat success",
      response: responseText,
      messages: conversation.messages,
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    if (error.message && (error.message.includes('429') || error.message.includes('quota'))) {
      return res.status(429).json({
        message: "API quota exceeded",
        quotaExceeded: true
      });
    }
    
    res.status(500).json({ 
      message: "Chat failed", 
      error: error.message 
    });
  }
});

// ============================================================================
// GET CONVERSATION HISTORY
// ============================================================================
router.get("/conversation/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const conversation = await Conversation.findOne({ userId });
    
    if (!conversation) {
      return res.status(404).json({ 
        message: "No conversation found",
        messages: []
      });
    }

    res.status(200).json({
      message: "Conversation retrieved",
      messages: conversation.messages
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to get conversation", 
      error: error.message 
    });
  }
});

// ============================================================================
// CLEAR CONVERSATION
// ============================================================================
router.delete("/conversation/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    await Conversation.findOneAndDelete({ userId });
    
    res.status(200).json({ 
      message: "Conversation cleared successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to clear conversation", 
      error: error.message 
    });
  }
});

export default router;