import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { SignJWT } from "jose";
import { getTokenCookieOptions, getJwtSecret } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Validate inputs
    if (!username || !password) {
      return NextResponse.json(
        { message: "Имя пользователя и пароль обязательны" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Неверное имя пользователя или пароль" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Неверное имя пользователя или пароль" },
        { status: 401 }
      );
    }

    console.log("API/login: Authentication successful, creating token...");

    // Получаем секретный ключ
    const secret = getJwtSecret();

    // Используем jose для создания токена
    const textEncoder = new TextEncoder();
    const secretKey = textEncoder.encode(secret);

    const token = await new SignJWT({ id: user.id, username: user.username })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secretKey);

    console.log("API/login: Token created successfully");
    console.log("API/login: Using JWT_SECRET:", secret.substring(0, 3) + "...");

    // Create response with JSON data
    const userResponse = {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    // Create the base response
    const response = NextResponse.json({
      message: "Успешный вход",
      user: userResponse,
      success: true,
    });

    // Set the cookie with appropriate options
    const cookieOptions = getTokenCookieOptions();
    response.cookies.set({
      ...cookieOptions,
      value: token,
    });

    // Verify the cookie was set
    const setCookieHeader = response.headers.get("Set-Cookie");
    console.log("API/login: Set-Cookie header present:", !!setCookieHeader);
    console.log("API/login: Authentication successful, returning response");

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Error logging in", success: false },
      { status: 500 }
    );
  }
}
