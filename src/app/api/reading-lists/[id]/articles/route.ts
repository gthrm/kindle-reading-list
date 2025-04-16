import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { getUrlMetadata } from "@/lib/urlMetadata";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated', success: false },
        { status: 401 }
      );
    }

    // Получаем секретный ключ из переменных окружения
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error('JWT secret is not set');
    }

    // Используем jose для верификации токена
    const textEncoder = new TextEncoder();
    const secretKey = textEncoder.encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    const decoded = payload as { id: string; username: string };

    // Получаем данные из запроса
    const { url, categoryIds } = await request.json();

    // Проверяем обязательные поля
    if (!url) {
      return NextResponse.json(
        { message: 'URL обязателен', success: false },
        { status: 400 }
      );
    }

    // Получаем ID чтения из параметров URL
    const { id: readingListId } = await params;

    // Проверяем, что список чтения принадлежит пользователю
    const readingList = await prisma.readingList.findUnique({
      where: {
        id: readingListId,
      },
    });

    if (!readingList) {
      return NextResponse.json(
        { message: 'Список чтения не найден', success: false },
        { status: 404 }
      );
    }

    if (readingList.userId !== decoded.id) {
      return NextResponse.json(
        { message: 'Нет доступа к этому списку чтения', success: false },
        { status: 403 }
      );
    }

    // Получаем метаданные URL
    const metadata = await getUrlMetadata(url);
    
    // Создаем новую статью с полученными метаданными
    const article = await prisma.article.create({
      data: {
        url,
        title: metadata.title,
        description: metadata.description,
        imageUrl: metadata.imageUrl,
        readingList: {
          connect: { id: readingListId }
        }
      },
    });

    // Если переданы категории, связываем статью с ними
    if (categoryIds && categoryIds.length > 0) {
      // Находим все категории, которые принадлежат указанной коллекции и входят в переданный список ID
      const validCategories = await prisma.category.findMany({
        where: {
          id: { in: categoryIds },
          readingListId: readingListId,
        },
      });
      
      // Если найдены категории, связываем их со статьей
      if (validCategories.length > 0) {
        await prisma.article.update({
          where: { id: article.id },
          data: {
            categories: {
              connect: validCategories.map(cat => ({ id: cat.id }))
            }
          },
          include: {
            categories: true
          }
        });
      }
    }

    // Получаем обновленную статью со всеми связанными категориями
    const updatedArticle = await prisma.article.findUnique({
      where: { id: article.id },
      include: {
        categories: true
      }
    });

    return NextResponse.json(
      { message: 'Статья добавлена', article: updatedArticle, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding article:', error);
    return NextResponse.json(
      { message: 'Ошибка при добавлении статьи', success: false },
      { status: 500 }
    );
  }
}
