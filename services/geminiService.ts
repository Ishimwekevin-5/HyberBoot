
import { GoogleGenAI, Type } from "@google/genai";

export interface AIInsightResponse {
  riskLevel: string;
  efficiencyInsight: string;
  driverWellnessScore: number;
  summary: string;
  error?: string;
  errorType?: 'AUTH' | 'API' | 'NETWORK';
}

export const getDeliveryIntelligence = async (deliveryId: string, driver: string, vehicle: string): Promise<AIInsightResponse> => {
  // Obtain API key strictly from environment
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    return {
      riskLevel: "Data Unavailable",
      efficiencyInsight: "Connect Gemini API to enable operational coaching.",
      driverWellnessScore: 0,
      summary: "AI Ops Core Offline: Check environment variables.",
      error: "Gemini API Key is not configured. Please set your API_KEY in the environment.",
      errorType: 'AUTH'
    };
  }

  try {
    // Initialize GoogleGenAI strictly using process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    // Access text property directly (it is a property, not a method)
    const text = response.text?.trim();
    if (!text) throw new Error("Empty response from AI");
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Ops Error:", error);
    return {
      riskLevel: "Error",
      efficiencyInsight: "Failed to fetch AI insights.",
      driverWellnessScore: 0,
      summary: "An error occurred while communicating with the AI service.",
      error: error.message || "Failed to connect to Gemini API",
      errorType: error.message?.includes('401') ? 'AUTH' : 'API'
    };
  }
};
