import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

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

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Пользователь с таким именем уже существует" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with reading list
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        readingList: {
          create: {
            name: "Reading List",
            isPublic: false,
          },
        },
      },
    });

    // Create a user object without password for response
    const userResponse = {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json(
      { message: "Пользователь успешно создан", user: userResponse },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Ошибка при регистрации пользователя" },
      { status: 500 }
    );
  }
}
