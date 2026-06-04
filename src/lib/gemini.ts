import { GoogleGenAI } from "@google/genai";

const MODEL_CANDIDATES = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
];

export async function generateGeminiContent(
  prompt: string,
  config?: Record<string, unknown>
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it in Vercel and local .env.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const errors: string[] = [];

  for (const model of MODEL_CANDIDATES) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });

        if (response.text) {
          return { text: response.text, model };
        }
      } catch (error: any) {
        const message = normalizeGeminiError(error);
        errors.push(`${model}: ${message}`);

        if (message.includes("API key was reported as leaked")) {
          throw new Error("Your Gemini API key was reported as leaked. Revoke it, create a new key, and update Vercel/local .env.");
        }

        if (!message.includes("503") && !message.includes("overloaded") && !message.includes("UNAVAILABLE")) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
      }
    }
  }

  throw new Error(`Gemini request failed for all configured models. ${errors.at(-1) || ""}`);
}

export function normalizeGeminiError(error: any) {
  if (!error) return "Unknown Gemini error";
  if (typeof error.message === "string") return error.message;
  return String(error);
}
