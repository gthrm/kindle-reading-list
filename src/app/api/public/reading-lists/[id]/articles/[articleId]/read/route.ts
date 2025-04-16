import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string; articleId: string } }
) {
  try {
    // Получаем код доступа из тела запроса
    const body = await request.json().catch(() => ({}))
    const { accessCode } = body
    
    // Получаем ID списка и статьи из параметров
    const readingListId = params.id
    const articleId = params.articleId
    
    // Ищем список чтения
    const readingList = await prisma.readingList.findUnique({
      where: { id: readingListId },
      select: {
        isPublic: true,
        accessCode: true
      }
    })
    
    // Если списка нет, возвращаем 404
    if (!readingList) {
      return NextResponse.json(
        { message: 'Список чтения не найден', success: false },
        { status: 404 }
      )
    }
    
    // Проверяем доступ
    // Если список приватный и код не совпадает, отказываем в доступе
    if (!readingList.isPublic && readingList.accessCode !== accessCode) {
      return NextResponse.json(
        { message: 'Доступ запрещен', success: false },
        { status: 403 }
      )
    }
    
    // Ищем статью
    const article = await prisma.article.findUnique({
      where: {
        id: articleId,
        readingListId: readingListId
      }
    })
    
    // Если статьи нет, возвращаем 404
    if (!article) {
      return NextResponse.json(
        { message: 'Статья не найдена', success: false },
        { status: 404 }
      )
    }
    
    // Обновляем статью, отмечая как прочитанную
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: { isRead: true }
    })
    
    return NextResponse.json({
      message: 'Статья отмечена как прочитанная',
      article: updatedArticle,
      success: true
    })
  } catch (error) {
    console.error('Error marking article as read:', error)
    return NextResponse.json(
      { message: 'Ошибка сервера', success: false },
      { status: 500 }
    )
  }
} 