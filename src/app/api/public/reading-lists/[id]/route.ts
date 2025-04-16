import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Получаем код доступа из URL если есть
    const { searchParams } = new URL(request.url)
    const accessCode = searchParams.get('code')
    
    // Получаем ID списка или имя пользователя из параметров
    const idOrUsername = (await params).id
    
    // Сначала пробуем найти пользователя с таким именем
    const user = await prisma.user.findUnique({
      where: { username: idOrUsername },
      include: { readingList: true }
    });

    let readingList;

    if (user && user.readingList) {
      // Если нашли пользователя, используем его коллекцию
      readingList = await prisma.readingList.findUnique({
        where: { id: user.readingList.id },
        include: {
          user: {
            select: {
              username: true
            }
          },
          articles: {
            orderBy: { createdAt: 'desc' },
            include: {
              categories: true
            }
          },
          categories: {
            include: {
              _count: {
                select: {
                  articles: true
                }
              }
            }
          }
        }
      });
    } else {
      // Если пользователя не нашли, ищем коллекцию по ID
      readingList = await prisma.readingList.findUnique({
        where: { id: idOrUsername },
        include: {
          user: {
            select: {
              username: true
            }
          },
          articles: {
            orderBy: { createdAt: 'desc' },
            include: {
              categories: true
            }
          },
          categories: {
            include: {
              _count: {
                select: {
                  articles: true
                }
              }
            }
          }
        }
      });
    }
    
    // Если списка нет, возвращаем 404
    if (!readingList) {
      return NextResponse.json(
        { message: 'Список чтения не найден', success: false },
        { status: 404 }
      )
    }
    
    // Форматируем данные
    const formattedList = {
      id: readingList.id,
      name: readingList.name,
      username: readingList.user.username,
      isPublic: readingList.isPublic,
      articleCount: readingList.articles.length,
      categoryCount: readingList.categories.length,
      articles: readingList.articles.map(article => ({
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
      categories: readingList.categories.map(category => ({
        id: category.id,
        name: category.name,
        articleCount: category._count.articles
      })),
      createdAt: readingList.createdAt,
      updatedAt: readingList.updatedAt
    }
    
    // Проверяем доступ
    // Если список публичный, разрешаем доступ
    if (readingList.isPublic) {
      return NextResponse.json({ readingList: formattedList, success: true })
    }
    
    // Если список приватный и есть код доступа, проверяем его
    if (accessCode && readingList.accessCode === accessCode) {
      return NextResponse.json({ readingList: formattedList, success: true })
    }
    
    // Иначе требуем код доступа
    return NextResponse.json(
      { message: 'Требуется код доступа', success: false },
      { status: 403 }
    )
  } catch (error) {
    console.error('Error fetching reading list:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера', success: false },
      { status: 500 }
    )
  }
} 