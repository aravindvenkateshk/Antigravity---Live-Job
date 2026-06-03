import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import pdf from "pdf-parse";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let resumeText = "";
    try {
      const data = await pdf(buffer);
      resumeText = data.text;
    } catch (err: any) {
      console.error("Error parsing PDF:", err);
      return NextResponse.json({ error: "Failed to parse PDF file: " + err.message }, { status: 400 });
    }


    if (!resumeText || resumeText.trim() === "") {
      return NextResponse.json({ error: "No text found in PDF" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      You are an expert technical recruiter and AI resume parser. 
      Analyze the following resume text and extract the following details in a strict JSON format. 
      Only return valid JSON, nothing else.

      JSON structure:
      {
        "skills": ["skill1", "skill2"],
        "experienceLevel": "Entry / Mid / Senior",
        "domainExpertise": "e.g., Cybersecurity, Full Stack, Frontend",
        "atsScore": <a number from 0 to 100>
      }

      Resume Text:
      ${resumeText}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const aiText = response.text;
    if (!aiText) throw new Error("No response from AI");

    let parsedData;
    try {
      parsedData = JSON.parse(aiText);
    } catch (e) {
      console.error("Failed to parse Gemini JSON output:", e);
      return NextResponse.json({ error: "Failed to parse AI output" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      rawText: resumeText
    });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
