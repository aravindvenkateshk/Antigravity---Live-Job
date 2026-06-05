import { NextRequest, NextResponse } from "next/server";
import { attemptAutoApply } from "@/services/auto-apply/engine";
import { generateGeminiContent } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { jobUrl, jobDescription, profileData, applyMode } = await req.json();

    if (!jobUrl || !profileData) {
      return NextResponse.json({ error: "Missing jobUrl or profileData" }, { status: 400 });
    }

    let coverLetter = "Cover letter generation failed or skipped.";
    try {
      const prompt = `
        Write a concise, professional cover letter tailored for this job.
        Candidate Name: ${profileData.name || 'Candidate'}
        Candidate Skills: ${profileData.skills?.join(', ')}
        Job Description: ${jobDescription || 'Not provided'}
        Output only the cover letter text.
      `;
      const response = await generateGeminiContent(prompt);
      coverLetter = response.text || "Cover letter generation returned empty.";
    } catch (aiError: any) {
      console.error("Gemini Cover Letter Error:", aiError);
      coverLetter = "Could not generate a cover letter right now. You can still open the live job link and apply manually.";
    }

    // Only run the headless bot for Full-Auto
    let result = { success: false, message: "Manual mode selected." };
    if (applyMode === 'Full-Auto') {
      try {
        result = await attemptAutoApply(jobUrl, profileData);
      } catch (applyErr: any) {
        result = { success: false, message: "Auto-apply bot failed: " + applyErr.message };
      }
    } else {
       // For Semi-Auto or Manual, we just wanted the cover letter.
       result = { success: true, message: "Ready for manual apply." };
    }

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
