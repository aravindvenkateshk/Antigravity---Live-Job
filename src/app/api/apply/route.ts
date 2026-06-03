import { NextRequest, NextResponse } from "next/server";
import { attemptAutoApply } from "@/services/auto-apply/engine";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { jobUrl, jobDescription, profileData, applyMode = 'Semi-Auto' } = await req.json();

    if (!jobUrl || !profileData) {
      return NextResponse.json({ error: "Missing jobUrl or profileData" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `
      Write a concise, professional cover letter tailored for this job.
      Candidate Name: ${profileData.name || 'Candidate'}
      Candidate Skills: ${profileData.skills?.join(', ')}
      Job Description: ${jobDescription || 'Not provided'}
      Output only the cover letter text.
    `;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    const coverLetter = response.text;

    const result = applyMode === 'Full-Auto'
      ? await attemptAutoApply(jobUrl, profileData)
      : { success: true, message: "Cover letter prepared. Open the live job link to apply." };

    return NextResponse.json({
      success: result.success,
      message: result.message,
      coverLetter
    });
  } catch (error: any) {
    console.error("Apply API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
