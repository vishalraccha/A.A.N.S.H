export async function processUserMessageAI(userMessage, parsedCommand = null, geminiApiKey = null) {
  try {
    if (!geminiAI && geminiApiKey) {
      initializeGeminiAI(geminiApiKey);
    }

    if (!geminiAI) {
      throw new Error("Gemini AI not initialized. Please provide API key.");
    }

    const lowerMsg = userMessage.toLowerCase().trim();

    // 🧠 Detect if it's a question/chat
    const isChatQuery =
      /^(what|who|when|where|why|how|explain|define|describe|difference|tell me|give me)/.test(lowerMsg) ||
      lowerMsg.endsWith("?") ||
      (!parsedCommand && !lowerMsg.includes("open") && !lowerMsg.includes("send"));

    if (isChatQuery) {
      console.log("💬 Detected chat question → Routing to Gemini AI...");
      const chatResponse = await chatWithAI(userMessage);
      return {
        success: true,
        type: "ai_chat",
        content: chatResponse.aiResponse,
        fullData: chatResponse,
      };
    }

    // ⚙️ Otherwise treat it as command
    console.log("⚙️ Detected command → Executing system action...");
    const response = await handleUserInput(userMessage, parsedCommand);

    return {
      success: true,
      type: response.type,
      content:
        response?.data?.aiResponse ||
        response?.data?.content ||
        response?.message ||
        "No content generated",
      fullData: response.data,
    };
  } catch (error) {
    console.error("❌ Error processing message:", error);
    return {
      success: false,
      content: `Sorry, I encountered an error: ${error.message}`,
      error: error.message,
    };
  }
}
