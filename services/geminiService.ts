
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function optimizeMessage(originalMessage: string, context: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional SMS marketing expert. Optimize the following message for maximum engagement and clarity. 
      Keep it concise (under 160 characters if possible).
      
      Original Message: "${originalMessage}"
      Target Audience/Context: "${context}"
      
      Provide the optimized message and a brief explanation of why it works.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimizedMessage: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["optimizedMessage", "explanation"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini optimization error:", error);
    return null;
  }
}

export async function analyzeCampaign(logs: any[]) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these SMS delivery logs and provide a summary of success rates and any potential issues identified.
      
      Logs: ${JSON.stringify(logs.slice(0, 50))}
      
      Provide a professional summary.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Analysis unavailable at this moment.";
  }
}
