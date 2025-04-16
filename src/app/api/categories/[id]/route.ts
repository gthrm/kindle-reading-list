import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import prisma from "@/lib/prisma";

// Обновление категории
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Находим категорию
    const category = await prisma.category.findUnique({
      where: { id: params.id },
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

    // Проверяем, существует ли уже категория с таким именем
    const existingCategory = await prisma.category.findFirst({
      where: {
        readingListId: category.readingListId,
        name: { equals: name, mode: "insensitive" },
        id: { not: params.id }
      }
    });

    if (existingCategory) {
      return NextResponse.json(
        { message: "Category with this name already exists" },
        { status: 400 }
      );
    }

    // Обновляем категорию
    const updatedCategory = await prisma.category.update({
      where: { id: params.id },
      data: { name }
    });

    return NextResponse.json({
      message: "Category updated successfully",
      category: updatedCategory
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { message: "Failed to update category" },
      { status: 500 }
    );
  }
}

// Удаление категории
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Находим категорию
    const category = await prisma.category.findUnique({
      where: { id: params.id },
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
      where: { id: params.id }
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