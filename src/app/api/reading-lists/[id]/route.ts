import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

// Get a specific reading list
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Not authenticated", success: false },
        { status: 401 }
      );
    }

    // Используем jose для верификации токена
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error("JWT secret is not set");
    }
    
    const textEncoder = new TextEncoder();
    const secretKey = textEncoder.encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    const decoded = payload as { id: string; username: string };

    // Получаем ID из параметров URL
    const { id: readingListId } = await params;

    // Находим список чтения
    const readingList = await prisma.readingList.findUnique({
      where: {
        id: readingListId,
      },
      include: {
        user: {
          select: {
            username: true,
          }
        },
        articles: {
          orderBy: { createdAt: 'desc' },
          include: {
            categories: true
          }
        },
        categories: true
      },
    });

    if (!readingList) {
      return NextResponse.json(
        { message: "Список чтения не найден", success: false },
        { status: 404 }
      );
    }

    // Проверяем права доступа
    if (readingList.userId !== decoded.id) {
      return NextResponse.json(
        { message: "Доступ запрещен", success: false },
        { status: 403 }
      );
    }

    return NextResponse.json({ readingList, success: true });
  } catch (error) {
    console.error("Error fetching reading list:", error);
    return NextResponse.json(
      { message: "Ошибка сервера", success: false },
      { status: 500 }
    );
  }
}

// Update a reading list
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Not authenticated", success: false },
        { status: 401 }
      );
    }

    // Используем jose для верификации токена
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error("JWT secret is not set");
    }
    
    const textEncoder = new TextEncoder();
    const secretKey = textEncoder.encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    const decoded = payload as { id: string; username: string };

    // Получаем данные из запроса
    const { name, isPublic, accessCode } = await request.json();

    // Проверяем наличие обязательных полей
    if (!name) {
      return NextResponse.json(
        { message: "Название списка обязательно", success: false },
        { status: 400 }
      );
    }

    // Получаем ID из параметров URL
    const { id: readingListId } = await params;

    // Находим список чтения
    const readingList = await prisma.readingList.findUnique({
      where: {
        id: readingListId,
      },
    });

    if (!readingList) {
      return NextResponse.json(
        { message: "Список чтения не найден", success: false },
        { status: 404 }
      );
    }

    // Проверяем права доступа
    if (readingList.userId !== decoded.id) {
      return NextResponse.json(
        { message: "Доступ запрещен", success: false },
        { status: 403 }
      );
    }

    // Обновляем список чтения
    const updatedReadingList = await prisma.readingList.update({
      where: { id: readingListId },
      data: {
        name,
        isPublic: isPublic ?? false,
        accessCode: accessCode || null,
      },
      include: {
        user: {
          select: {
            username: true,
          }
        },
        articles: {
          orderBy: { createdAt: "desc" },
          include: {
            categories: true
          }
        },
        categories: true
      },
    });

    return NextResponse.json({
      message: "Список чтения успешно обновлен",
      readingList: updatedReadingList,
      success: true
    });
  } catch (error) {
    console.error("Error updating reading list:", error);
    return NextResponse.json(
      { message: "Ошибка сервера", success: false },
      { status: 500 }
    );
  }
}

// Delete a reading list
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Not authenticated", success: false },
        { status: 401 }
      );
    }

    // Используем jose для верификации токена
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error("JWT secret is not set");
    }
    
    const textEncoder = new TextEncoder();
    const secretKey = textEncoder.encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    const decoded = payload as { id: string; username: string };

    // Получаем ID из параметров URL
    const { id: readingListId } = await params;

    // Находим список чтения
    const readingList = await prisma.readingList.findUnique({
      where: {
        id: readingListId,
      },
    });

    if (!readingList) {
      return NextResponse.json(
        { message: "Список чтения не найден", success: false },
        { status: 404 }
      );
    }

    // Проверяем права доступа
    if (readingList.userId !== decoded.id) {
      return NextResponse.json(
        { message: "Доступ запрещен", success: false },
        { status: 403 }
      );
    }

    // Удаляем список чтения и все связанные статьи
    await prisma.readingList.delete({
      where: {
        id: readingListId,
      },
    });

    return NextResponse.json({ 
      message: "Список чтения успешно удален", 
      success: true 
    });
  } catch (error) {
    console.error("Error deleting reading list:", error);
    return NextResponse.json(
      { message: "Ошибка сервера", success: false },
      { status: 500 }
    );
  }
}
