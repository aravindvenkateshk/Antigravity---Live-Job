import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeData, jobDescription } = body;

    if (!resumeData || !jobDescription) {
      return NextResponse.json({ error: "Missing resumeData or jobDescription" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
      You are an expert AI recruiter matching a candidate to a job description.
      
      Candidate Profile:
      Skills: ${resumeData.skills?.join(', ')}
      Experience Level: ${resumeData.experienceLevel}
      Domain Expertise: ${resumeData.domainExpertise}
      Raw Resume Extract: ${resumeData.rawText?.substring(0, 1000)}

      Job Description:
      ${jobDescription}

      Compare the candidate profile against the job description.
      Provide the following output in strict JSON format:
      {
        "matchScore": <number from 0 to 100>,
        "matchExplanation": "Brief 2-3 sentence explanation of why this score was given, highlighting key matches and missing skills.",
        "probability": "High" | "Medium" | "Low"
      }
      
      "High" means score >= 80, "Medium" is 60-79, "Low" is < 60.
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

    const parsedData = JSON.parse(aiText);

    return NextResponse.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error("Match API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
