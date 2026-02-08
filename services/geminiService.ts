
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDeliveryIntelligence = async (deliveryId: string, driver: string, vehicle: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a Delivery Operations AI. Analyze delivery ${deliveryId} assigned to driver ${driver} using a ${vehicle}. Provide operational insights: 1. Risk Level (Traffic/Weather). 2. Fleet Efficiency Tip. 3. Driver Safety Rating. Return a concise JSON structure.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, description: 'Low, Medium, or Critical' },
            efficiencyInsight: { type: Type.STRING },
            driverWellnessScore: { type: Type.NUMBER, description: '1-100 score' },
            summary: { type: Type.STRING },
            suggestedAction: { type: Type.STRING }
          },
          required: ['riskLevel', 'efficiencyInsight', 'driverWellnessScore', 'summary']
        }
      }
    });

    return JSON.parse(response.text?.trim() || '{}');
  } catch (error) {
    console.error("Gemini Intelligence Error:", error);
    return null;
  }
};
