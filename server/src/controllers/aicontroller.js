import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateAIResponse = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: "Prompt required" });

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    return res.status(200).json({ response: result.response.text() });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "AI failed", error: error.message });
  }
};
