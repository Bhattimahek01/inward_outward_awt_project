import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Make sure to add this to .env

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { Email, Password } = body;

    if (!Email || !Password) {
      return NextResponse.json(
        { error: "Email and Password are required" },
        { status: 400 },
      );
    }

    // Find user by Email
    const user = await prisma.user.findFirst({
      where: { Email: Email },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Validate password
    // NOTE: In production, use bcrypt.compare(Password, user.Password)
    // Assuming plain text or simple comparison for now based on current context
    if (user.Password !== Password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (!user.IsActive) {
      return NextResponse.json(
        { error: "Account is inactive. Please contact administrator." },
        { status: 403 },
      );
    }

    // Create Token
    const token = jwt.sign(
      {
        userId: user.UserID,
        username: user.Email,
        role: user.role.RoleName,
      },
      JWT_SECRET,
      { expiresIn: "8h" },
    );

    // Determine redirect URL
    let redirectUrl = "/dashboard";
    if (user.role.RoleName.toLowerCase() === "admin") {
      redirectUrl = "/masters/admins";
    } else if (user.role.RoleName.toLowerCase() === "clerk") {
      redirectUrl = "/dashboard";
    }

    // Return success with token and user info
    const response = NextResponse.json({
      message: "Login successful",
      token,
      user: {
        id: user.UserID,
        name: user.Name,
        username: user.Email,
        role: user.role.RoleName,
      },
      redirectUrl,
    });

    // Set HttpOnly cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    // Also set a client-readable cookie if needed for axios interceptor (or rely on HttpOnly)
    // Since axios interceptor uses getCookie('token'), we might want to expose it or adjust interceptor.
    // However, best practice is HttpOnly. The axios interceptor using `cookies-next` `getCookie` works on client
    // if the cookie is NOT httpOnly. If it IS httpOnly, client JS can't read it.
    // For this implementation, I'll set a duplicate 'auth_token' for client usage or just allow 'token' to be non-httpOnly for simplicity currently,
    // OR better, rely on the browser automatically sending HttpOnly cookies with same-origin requests (which is default).
    // The axios interceptor adding `Authorization: Bearer` is needed for APIs that check headers.
    // If APIs check cookies, we don't need the header.
    // Let's set 'token' as accessible for now to match the axios implementation I just wrote.
    response.cookies.set("token", token, {
      httpOnly: false, // Allow client JS to read it for now to work with the axios interceptor
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
