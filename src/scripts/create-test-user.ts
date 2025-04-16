import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

/**
 * Скрипт для создания тестового пользователя и его коллекции
 */

async function main() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Создаю тестового пользователя...')
    
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        password: hashedPassword,
        readingList: {
          create: {
            name: 'Моя коллекция для чтения',
            isPublic: true
          }
        }
      },
      include: {
        readingList: true
      }
    })
    
    console.log(`Пользователь создан: ${user.username}`)
    
    // Создаем несколько категорий
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          name: 'Программирование',
          readingListId: user.readingList!.id
        }
      }),
      prisma.category.create({
        data: {
          name: 'Наука',
          readingListId: user.readingList!.id
        }
      }),
      prisma.category.create({
        data: {
          name: 'Книги',
          readingListId: user.readingList!.id
        }
      })
    ])
    
    console.log(`Создано ${categories.length} категорий`)
    
    // Создаем несколько статей с категориями
    const articles = [
      {
        url: 'https://nextjs.org/learn/dashboard-app',
        title: 'Учебник по Next.js',
        description: 'Официальный учебник по созданию приложений на Next.js',
        categories: [categories[0].id]
      },
      {
        url: 'https://react.dev/learn',
        title: 'Документация React',
        description: 'Официальная документация по React',
        categories: [categories[0].id]
      },
      {
        url: 'https://www.nationalgeographic.com/science/',
        title: 'National Geographic: Наука',
        description: 'Последние новости науки',
        categories: [categories[1].id]
      },
      {
        url: 'https://www.goodreads.com/list/show/264.Books_That_Everyone_Should_Read_At_Least_Once',
        title: 'Книги, которые должен прочитать каждый',
        description: 'Список книг на GoodReads',
        categories: [categories[2].id]
      },
      {
        url: 'https://prisma.io/docs',
        title: 'Документация Prisma',
        description: 'Официальная документация по Prisma ORM',
        categories: [categories[0].id, categories[1].id]
      }
    ]
    
    for (const articleData of articles) {
      const article = await prisma.article.create({
        data: {
          url: articleData.url,
          title: articleData.title,
          description: articleData.description,
          readingListId: user.readingList!.id
        }
      })
      
      // Связываем статью с категориями
      for (const categoryId of articleData.categories) {
        await prisma.$executeRaw`INSERT INTO "_ArticleToCategory" ("A", "B") VALUES (${article.id}, ${categoryId})`
      }
      
      console.log(`Создана статья: ${article.title}`)
    }
    
    console.log('Тестовые данные успешно созданы!')
    console.log('Логин: testuser')
    console.log('Пароль: password123')
  } catch (error) {
    console.error('Ошибка при создании тестовых данных:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 