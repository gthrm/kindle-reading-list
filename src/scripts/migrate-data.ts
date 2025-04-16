import { PrismaClient } from '@prisma/client';

/**
 * Скрипт для миграции данных из старой структуры (множество коллекций) в новую структуру (одна коллекция на пользователя)
 * 
 * Как работает скрипт:
 * 1. Для каждого пользователя создаёт одну основную коллекцию
 * 2. Все существующие коллекции превращает в категории
 * 3. Переносит статьи из старых коллекций в новую коллекцию, прикрепляя их к соответствующим категориям
 */

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Начало миграции данных...');
    
    // Получаем всех пользователей
    const users = await prisma.user.findMany();
    console.log(`Найдено ${users.length} пользователей`);
    
    for (const user of users) {
      console.log(`Обработка пользователя: ${user.username}`);
      
      // Получаем все коллекции пользователя
      const oldReadingLists = await prisma.readingList.findMany({
        where: { userId: user.id },
        include: { articles: true }
      });
      
      if (oldReadingLists.length === 0) {
        console.log(`- У пользователя ${user.username} нет коллекций, создаём новую`);
        
        // Создаём новую коллекцию для пользователя
        await prisma.readingList.create({
          data: {
            name: 'Моя коллекция',
            isPublic: false,
            userId: user.id
          }
        });
        
        continue;
      }
      
      console.log(`- У пользователя ${user.username} найдено ${oldReadingLists.length} коллекций`);
      
      // Используем первую коллекцию как основную
      const mainList = oldReadingLists[0];
      console.log(`- Используем коллекцию "${mainList.name}" как основную`);
      
      // Остальные коллекции конвертируем в категории
      const otherLists = oldReadingLists.slice(1);
      
      for (const list of otherLists) {
        console.log(`- Конвертируем коллекцию "${list.name}" в категорию`);
        
        // Создаём категорию на основе коллекции
        const newCategory = await prisma.category.create({
          data: {
            name: list.name,
            readingListId: mainList.id
          }
        });
        
        // Переносим статьи из старой коллекции в основную и прикрепляем к категории
        for (const article of list.articles) {
          console.log(`  - Перенос статьи: ${article.title || article.url}`);
          
          // Создаём новую статью в основной коллекции
          const newArticle = await prisma.article.create({
            data: {
              url: article.url,
              title: article.title,
              description: article.description,
              imageUrl: article.imageUrl,
              isRead: article.isRead,
              readingListId: mainList.id
            }
          });
          
          // Связываем статью с категорией
          await prisma.$executeRaw`INSERT INTO "_ArticleToCategory" ("A", "B") VALUES (${newArticle.id}, ${newCategory.id})`;
        }
        
        // Удаляем старую коллекцию
        await prisma.readingList.delete({
          where: { id: list.id }
        });
      }
    }
    
    console.log('Миграция данных успешно завершена!');
  } catch (error) {
    console.error('Ошибка при миграции данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 