import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verify(token, process.env.NEXTAUTH_SECRET!) as {
      id: string;
    };

    // Получаем единственную коллекцию пользователя
    let readingList = await prisma.readingList.findFirst({
      where: { userId: decoded.id },
      include: {
        user: true,
        _count: {
          select: {
            articles: true,
          },
        },
        articles: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            categories: true,
          },
        },
        categories: {
          include: {
            _count: {
              select: {
                articles: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    // Если у пользователя еще нет коллекции, создаем ее
    if (!readingList) {
      readingList = await prisma.readingList.create({
        data: {
          name: "Моя коллекция для чтения",
          userId: decoded.id,
        },
        include: {
          user: true,
          _count: {
            select: {
              articles: true,
            },
          },
          articles: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              categories: true,
            },
          },
          categories: {
            include: {
              _count: {
                select: {
                  articles: true,
                },
              },
            },
          },
        },
      });
    }

    // Трансформируем данные перед отправкой
    const formattedList = {
      id: readingList.id,
      name: readingList.name,
      username: readingList.user.username,
      accessCode: readingList.accessCode,
      isPublic: readingList.isPublic,
      createdAt: readingList.createdAt,
      updatedAt: readingList.updatedAt,
      articleCount: readingList._count.articles,
      categoryCount: readingList.categories.length,
      categories: readingList.categories.map((category) => ({
        id: category.id,
        name: category.name,
        articleCount: category._count.articles,
      })),
      articles: readingList.articles.map((article) => ({
        id: article.id,
        url: article.url,
        title: article.title,
        description: article.description,
        imageUrl: article.imageUrl,
        isRead: article.isRead,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        categories: article.categories.map(cat => ({
          id: cat.id,
          name: cat.name
        }))
      })),
    };

    return NextResponse.json({ readingList: formattedList });
  } catch (error) {
    console.error("Error fetching reading list:", error);
    return NextResponse.json(
      { message: "Failed to fetch reading list" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verify(token, process.env.NEXTAUTH_SECRET!) as {
      id: string;
    };

    // Get data from request
    const { name, isPublic, accessCode } = await request.json();

    // Получаем коллекцию пользователя
    const existingList = await prisma.readingList.findFirst({
      where: { userId: decoded.id },
    });

    if (!existingList) {
      return NextResponse.json(
        { message: "Reading list not found" },
        { status: 404 }
      );
    }

    // Обновляем данные коллекции
    const updatedList = await prisma.readingList.update({
      where: { id: existingList.id },
      data: {
        name: name !== undefined ? name : existingList.name,
        isPublic: isPublic !== undefined ? isPublic : existingList.isPublic,
        accessCode: accessCode !== undefined ? accessCode : existingList.accessCode,
      },
    });

    return NextResponse.json({
      message: "Reading list updated successfully",
      readingList: updatedList,
    });
  } catch (error) {
    console.error("Error updating reading list:", error);
    return NextResponse.json(
      { message: "Failed to update reading list" },
      { status: 500 }
    );
  }
}
