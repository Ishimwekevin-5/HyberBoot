
import { GoogleGenAI, Type } from "@google/genai";

export interface AIInsightResponse {
  riskLevel: string;
  efficiencyInsight: string;
  driverWellnessScore: number;
  summary: string;
  error?: string;
  errorType?: 'AUTH' | 'API' | 'NETWORK';
}

export const getDeliveryIntelligence = async (
  deliveryId: string, 
  driver: string, 
  vehicle: string,
  h3Context?: string // Hex-based spatial context
): Promise<AIInsightResponse> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    return {
      riskLevel: "Data Unavailable",
      efficiencyInsight: "Connect Gemini API to enable operational coaching.",
      driverWellnessScore: 0,
      summary: "AI Ops Core Offline.",
      error: "Gemini API Key missing.",
      errorType: 'AUTH'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Fleet Command AI Analysis. 
      Target: Delivery ${deliveryId} (${vehicle}). Driver: ${driver}.
      Spatial Context: H3 Hex ${h3Context || 'Unknown'}.
      Task: Analyze spatial congestion and route efficiency based on H3 distance metrics. 
      Return JSON with riskLevel, efficiencyInsight, driverWellnessScore, and summary.`,
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

    const text = response.text?.trim();
    if (!text) throw new Error("Empty response from AI");
    
    return JSON.parse(text);
  } catch (error: any) {
    return {
      riskLevel: "Error",
      efficiencyInsight: "Hex-analysis failed.",
      driverWellnessScore: 0,
      summary: "AI Insight Engine timeout.",
      error: error.message
    };
  }
};
