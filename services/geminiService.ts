
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Strictly follow initialization guideline: new GoogleGenAI({ apiKey: process.env.API_KEY })
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartRouteInsight = async (origin: string, destination: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a logistical risk assessment and optimization strategy for a shipment from ${origin} to ${destination}. Mention potential "Danger zones" (weather or regional delays) and recommend the most efficient modality (air, sea, rail). Return the response in a concise JSON structure.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, description: 'Low, Medium, or High' },
            optimalModality: { type: Type.STRING },
            dangerZones: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            summary: { type: Type.STRING },
            estimatedSavings: { type: Type.STRING, description: 'Percentage or dollar amount' }
          },
          required: ['riskLevel', 'optimalModality', 'dangerZones', 'summary']
        }
      }
    });

    // Fix: Access response.text as a property and trim it before parsing as per guideline example.
    const text = response.text;
    return JSON.parse(text?.trim() || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
