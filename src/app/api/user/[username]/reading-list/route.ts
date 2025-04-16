import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { message: "Username is required" },
        { status: 400 }
      );
    }

    // Находим пользователя по имени пользователя
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Находим коллекцию пользователя
    const readingList = await prisma.readingList.findUnique({
      where: { userId: user.id },
      include: {
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
          orderBy: {
            name: "asc",
          },
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

    if (!readingList) {
      return NextResponse.json(
        { message: "Reading list not found" },
        { status: 404 }
      );
    }

    // Проверяем доступность коллекции
    // Если коллекция не публичная, проверяем код доступа
    if (!readingList.isPublic) {
      const { searchParams } = new URL(request.url);
      const accessCode = searchParams.get("accessCode");

      if (!accessCode || accessCode !== readingList.accessCode) {
        return NextResponse.json(
          { message: "Access denied. Invalid access code." },
          { status: 403 }
        );
      }
    }

    // Трансформируем данные перед отправкой
    const formattedList = {
      id: readingList.id,
      name: readingList.name,
      username: user.username,
      isPublic: readingList.isPublic,
      articleCount: readingList._count.articles,
      categoryCount: readingList.categories.length,
      articles: readingList.articles.map((article) => ({
        id: article.id,
        url: article.url,
        title: article.title,
        description: article.description,
        imageUrl: article.imageUrl,
        isRead: article.isRead,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        categories: article.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
        })),
      })),
      categories: readingList.categories.map((category) => ({
        id: category.id,
        name: category.name,
        articleCount: category._count.articles,
      })),
      createdAt: readingList.createdAt,
      updatedAt: readingList.updatedAt,
    };

    return NextResponse.json({ readingList: formattedList });
  } catch (error) {
    console.error("Error fetching reading list by username:", error);
    return NextResponse.json(
      { message: "Failed to fetch reading list" },
      { status: 500 }
    );
  }
}
