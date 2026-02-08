
import { GoogleGenAI, Type } from "@google/genai";

export const getDeliveryIntelligence = async (deliveryId: string, driver: string, vehicle: string) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    console.warn("Gemini API Key is not configured. AI insights are disabled.");
    return {
      riskLevel: "Data Unavailable",
      efficiencyInsight: "Connect Gemini API to enable operational coaching.",
      driverWellnessScore: 0,
      summary: "AI Ops Core Offline: Check environment variables.",
      suggestedAction: "Contact SysAdmin"
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a Fleet Command AI. Analyze delivery ${deliveryId} (${vehicle}) driven by ${driver}. Provide: 1. Risk Profile (Weather/Traffic). 2. Route Efficiency Insight. 3. Safety Rating. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING },
            efficiencyInsight: { type: Type.STRING },
            driverWellnessScore: { type: Type.NUMBER },
            summary: { type: Type.STRING }
          },
          required: ['riskLevel', 'efficiencyInsight', 'driverWellnessScore', 'summary']
        }
      }
    });

    return JSON.parse(response.text?.trim() || '{}');
  } catch (error) {
    console.error("Gemini Ops Error:", error);
    return null;
  }
};
