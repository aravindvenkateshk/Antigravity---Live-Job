import { NextRequest, NextResponse } from "next/server";
import { createUser, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const result = await createUser(email.trim(), password);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const token = signToken(email.trim().toLowerCase());
    const response = NextResponse.json({ success: true, email: email.trim().toLowerCase() });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return response;
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
