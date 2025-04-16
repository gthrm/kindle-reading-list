import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import prisma from "@/lib/prisma";

// Обновление категории
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Находим категорию
    const category = await prisma.category.findUnique({
      where: { id },
      include: { readingList: true },
    });

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    // Проверяем, что категория принадлежит пользователю
    if (category.readingList.userId !== decoded.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Проверяем, существует ли уже категория с таким именем
    const existingCategory = await prisma.category.findFirst({
      where: {
        readingListId: category.readingListId,
        name: { equals: name, mode: "insensitive" },
        id: { not: id },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { message: "Category with this name already exists" },
        { status: 400 }
      );
    }

    // Обновляем категорию
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { message: "Failed to update category" },
      { status: 500 }
    );
  }
} 