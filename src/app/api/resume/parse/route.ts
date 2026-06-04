import { NextRequest, NextResponse } from "next/server";
import { createRequire } from "module";
import { generateGeminiContent } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 30;

const require = createRequire(import.meta.url);

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
      const { PDFParse } = require("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      resumeText = result.text;
    } catch (err: any) {
      console.error("Error parsing PDF:", err);
      return NextResponse.json({ error: "Failed to parse PDF file: " + err.message }, { status: 400 });
    }


    if (!resumeText || resumeText.trim() === "") {
      return NextResponse.json({ error: "No text found in PDF" }, { status: 400 });
    }

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

    try {
      const response = await generateGeminiContent(prompt, {
        responseMimeType: "application/json",
      });

      const parsedData = parseJsonResponse(response.text);

      return NextResponse.json({
        success: true,
        data: parsedData,
        rawText: resumeText,
        model: response.model,
      });
    } catch (aiError: any) {
      console.error("Gemini resume analysis failed:", aiError);
      return NextResponse.json({
        success: true,
        data: buildFallbackProfile(resumeText),
        rawText: resumeText,
        warning: aiError.message || "Gemini analysis failed; used basic local parsing instead.",
      });
    }
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

function parseJsonResponse(text: string) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

function buildFallbackProfile(resumeText: string) {
  const knownSkills = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python", "Java",
    "SQL", "AWS", "Azure", "Docker", "Kubernetes", "Linux", "Cybersecurity",
    "Security", "SIEM", "SOC", "Vulnerability", "Networking", "Incident Response"
  ];
  const lower = resumeText.toLowerCase();
  const skills = knownSkills.filter((skill) => lower.includes(skill.toLowerCase()));
  const yearsMatch = lower.match(/(\d+)\+?\s*(years|yrs)/);
  const years = yearsMatch ? Number(yearsMatch[1]) : 0;

  return {
    skills,
    experienceLevel: years >= 6 ? "Senior" : years >= 2 ? "Mid" : "Entry",
    domainExpertise: inferDomain(lower, skills),
    atsScore: Math.min(88, Math.max(55, 60 + skills.length * 3 + Math.min(years, 8))),
  };
}

function inferDomain(text: string, skills: string[]) {
  if (text.includes("security") || text.includes("soc") || text.includes("vulnerability")) return "Cybersecurity";
  if (skills.some((skill) => ["React", "Next.js", "JavaScript", "TypeScript"].includes(skill))) return "Frontend";
  if (skills.some((skill) => ["Node.js", "Python", "Java", "SQL"].includes(skill))) return "Software Engineering";
  return "General";
}
