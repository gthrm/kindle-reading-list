import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import prisma from "@/lib/prisma";

// Обновление статьи
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; articleId: string }> }
) {
  try {
    const { articleId } = await params;
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

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { readingList: true },
    });

    if (!user || !user.readingList) {
      return NextResponse.json(
        { message: "Reading list not found" },
        { status: 404 }
      );
    }

    // Проверяем, что статья принадлежит пользователю
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { readingList: true, categories: true },
    });

    if (!article) {
      return NextResponse.json(
        { message: "Article not found" },
        { status: 404 }
      );
    }

    if (article.readingList.userId !== decoded.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Получаем данные из запроса
    const data = await request.json();

    // Создаем объект с обновляемыми данными
    const updateData: {
      isRead?: boolean;
      title?: string;
      description?: string;
      categoryIds?: string[];
    } = {};

    // Обрабатываем обычные поля
    if (data.isRead !== undefined) {
      updateData.isRead = data.isRead;
    }

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    // Обрабатываем категории, если они переданы
    let categoriesConnect;
    if (data.categoryIds !== undefined) {
      // Получаем список категорий, к которым нужно подключить статью
      categoriesConnect = {
        categories: {
          set: [], // Сначала отсоединяем от всех категорий
          connect: data.categoryIds.map((id: string) => ({ id })), // Затем подключаем к указанным
        },
      };
    }

    // Обновляем статью
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        ...updateData,
        ...categoriesConnect,
      },
      include: {
        categories: true,
      },
    });

    return NextResponse.json({
      message: "Article updated successfully",
      article: updatedArticle,
    });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json(
      { message: "Failed to update article" },
      { status: 500 }
    );
  }
}

// Удаление статьи
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; articleId: string }> }
) {
  try {
    const { articleId } = await params;
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

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { readingList: true },
    });

    if (!user || !user.readingList) {
      return NextResponse.json(
        { message: "Reading list not found" },
        { status: 404 }
      );
    }

    // Проверяем, что статья принадлежит пользователю
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { readingList: true },
    });

    if (!article) {
      return NextResponse.json(
        { message: "Article not found" },
        { status: 404 }
      );
    }

    if (article.readingList.userId !== decoded.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Удаляем статью
    await prisma.article.delete({
      where: { id: articleId },
    });

    return NextResponse.json({
      message: "Article deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { message: "Failed to delete article" },
      { status: 500 }
    );
  }
}
