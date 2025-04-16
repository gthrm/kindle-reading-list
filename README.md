# Kindle Reading List

Приложение для хранения и организации ссылок на статьи, публикации и электронные книги.

## Функции

- Сохранение ссылок с автоматическим извлечением метаданных (заголовок, описание, изображение)
- Организация ссылок по категориям
- Публичный доступ к вашей коллекции ссылок
- Возможность защиты паролем для приватного доступа

## Настройка проекта

### Локальная разработка

1. Клонируйте репозиторий:

```bash
git clone https://github.com/your-username/kindle-reading-list.git
cd kindle-reading-list
```

2. Установите зависимости:

```bash
npm install
```

3. Создайте файл `.env.local` и добавьте в него следующие переменные:

```
# Секретный ключ для подписи JWT токенов
NEXTAUTH_SECRET=your-jwt-secret

# URL базы данных PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/kindle_reading_list"
```

4. Примените миграции и сгенерируйте Prisma Client:

```bash
npx prisma migrate dev
```

5. Запустите сервер разработки:

```bash
npm run dev
```

### Настройка базы данных

#### Локальная PostgreSQL

1. Убедитесь, что PostgreSQL установлен и запущен
2. Создайте базу данных:

```bash
createdb kindle_reading_list
```

3. Настройте URL базы данных в `.env.local`

#### Neon.tech (облачная PostgreSQL)

1. Создайте аккаунт на [Neon.tech](https://neon.tech/)
2. Создайте новый проект и базу данных
3. Получите URL подключения и добавьте его в `.env.local`
4. Применить миграции:

```bash
npx prisma migrate deploy
```

### Деплой на Vercel

1. Создайте аккаунт на [Vercel](https://vercel.com/)
2. Импортируйте проект из GitHub
3. Добавьте необходимые переменные окружения:
   - `NEXTAUTH_SECRET`
   - `DATABASE_URL`
4. Деплой автоматически выполнит миграции и запустит приложение

## Команды

- `npm run dev` - Запуск сервера разработки
- `npm run build` - Сборка приложения для продакшн (включает генерацию Prisma)
- `npm run start` - Запуск собранного приложения (включает применение миграций)
- `npm run db:migrate` - Применение миграций
- `npm run db:studio` - Запуск Prisma Studio для управления данными
- `npm run db:push` - Синхронизация схемы без создания миграций

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
