import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/model/userModel";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    await dbConnect();

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Account already exists. Please log in." },
        { status: 409 }
      );
    }

    const fullName = String(name).trim();
    const [firstName, ...rest] = fullName.split(" ");
    const lastName = rest.join(" ") || "User";

    const passwordHash = await hashPassword(password);

    await User.create({
      email: normalizedEmail,
      password: passwordHash,
      firstName,
      lastName,
      oauthProviders: [],
      isEmailVerified: false,
      role: "user",
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "Could not create account" },
      { status: 500 }
    );
  }
}
