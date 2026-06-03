const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: "AIzaSyD3XynNBCSjwuf8DYkJ5ZQP2e0oq-RYmGg" });

async function run() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'hello',
    });
    console.log("gemini-2.0-flash SUCCESS", response.text);
  } catch (e) {
    console.log("gemini-2.0-flash ERROR", e.message);
  }
}
run();
