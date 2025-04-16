import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import prisma from "@/lib/prisma";

// Типы для работы с результатами SQL запросов
interface CategoryWithArticleCount {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  articleCount: string | number;
}

// Получение всех категорий пользователя
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

    // Находим коллекцию пользователя
    const readingList = await prisma.readingList.findFirst({
      where: { userId: decoded.id },
    });

    if (!readingList) {
      return NextResponse.json(
        { message: "Reading list not found" },
        { status: 404 }
      );
    }

    // Получаем категории с количеством статей
    const categories = await prisma.$queryRaw<CategoryWithArticleCount[]>`
      SELECT 
        c.id, c.name, c."createdAt", c."updatedAt",
        COUNT(a.id) as "articleCount"
      FROM "Category" c
      LEFT JOIN "_ArticleToCategory" ac ON c.id = ac."B"
      LEFT JOIN "Article" a ON ac."A" = a.id
      WHERE c."readingListId" = ${readingList.id}
      GROUP BY c.id, c.name, c."createdAt", c."updatedAt"
      ORDER BY c.name ASC
    `;

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// Создание новой категории
export async function POST(request: Request) {
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

    // Получаем данные из запроса
    const { name } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 }
      );
    }

    // Находим коллекцию пользователя
    const readingList = await prisma.readingList.findFirst({
      where: { userId: decoded.id },
    });

    if (!readingList) {
      return NextResponse.json(
        { message: "Reading list not found" },
        { status: 404 }
      );
    }

    // Проверяем, существует ли уже категория с таким именем
    const existingCategory = await prisma.$queryRaw`
      SELECT id FROM "Category"
      WHERE "readingListId" = ${readingList.id}
      AND LOWER(name) = LOWER(${name})
      LIMIT 1
    `;

    if (existingCategory && Array.isArray(existingCategory) && existingCategory.length > 0) {
      return NextResponse.json(
        { message: "Category with this name already exists" },
        { status: 400 }
      );
    }

    // Создаем новую категорию
    await prisma.$executeRaw`
      INSERT INTO "Category" (id, name, "readingListId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${name}, ${readingList.id}, NOW(), NOW())
    `;

    // Получаем созданную категорию
    const createdCategory = await prisma.$queryRaw<{id: string, name: string, readingListId: string, createdAt: Date, updatedAt: Date}[]>`
      SELECT * FROM "Category"
      WHERE "readingListId" = ${readingList.id}
      AND name = ${name}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;

    return NextResponse.json(
      { message: "Category created successfully", category: createdCategory[0] || null },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { message: "Failed to create category" },
      { status: 500 }
    );
  }
}

// Удаление категории
export async function DELETE(request: Request) {
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

    // Получаем ID категории из строки запроса
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json(
        { message: "Category ID is required" },
        { status: 400 }
      );
    }

    // Находим категорию
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { readingList: true }
    });

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    // Проверяем, что категория принадлежит пользователю
    if (category.readingList.userId !== decoded.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Удаляем категорию
    await prisma.category.delete({
      where: { id: categoryId }
    });

    return NextResponse.json({
      message: "Category deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { message: "Failed to delete category" },
      { status: 500 }
    );
  }
} 