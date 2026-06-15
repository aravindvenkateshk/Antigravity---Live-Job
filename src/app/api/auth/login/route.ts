import { NextRequest, NextResponse } from "next/server";
import { loginUser, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const result = await loginUser(email.trim(), password);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const token = signToken(result.email!);
    const response = NextResponse.json({ success: true, email: result.email });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
