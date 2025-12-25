
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getLuckyMantra = async (name: string, prize: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User ${name} has entered for a ${prize} draw. Generate a world-class, 1-sentence lucky blessing. Focus on victory, VIP status, and luxury. Keep it concise.`,
      config: {
        temperature: 0.9,
        maxOutputTokens: 80,
        thinkingConfig: { thinkingBudget: 40 }
      }
    });
    return response.text?.trim() || "Fortune has recognized your name today.";
  } catch (error) {
    return "The stars align for your inevitable victory.";
  }
};

export const verifyPaymentScreenshot = async (base64Image: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: "Analyze this transaction receipt. Verify: 1. It is a bank/UPI/JazzCash payment for approx 100 PKR. 2. It looks legitimate and recent. Return only 'VALID' if good, or 'SUSPICIOUS: [reason]' if not. If the user name is visible, mention it at the end like 'VALID: [name]'."
          }
        ]
      }
    });
    return response.text || "Awaiting verification.";
  } catch (error) {
    return "Offline verification active.";
  }
};
