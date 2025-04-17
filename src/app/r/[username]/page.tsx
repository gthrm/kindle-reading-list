import { connection } from 'next/server';
import Link from 'next/link';
import prisma from '@/lib/prisma';

interface Category {
  id: string;
  name: string;
  articleCount: number;
}

interface Article {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  categories: { id: string; name: string }[];
}

// Страница для ввода кода доступа
function AccessCodeForm({ username, error }: { username: string, error: string }) {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-xl font-semibold text-red-600 mb-4">Ошибка</h1>
          <p className="mb-4">{error}</p>

          <form action={`/api/public/reading-lists/${username}/access`} method="post">
            <div className="mt-4">
              <input
                type="text"
                name="code"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Введите код доступа"
                required
              />
              <button
                type="submit"
                className="mt-2 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Отправить
              </button>
            </div>
          </form>

          <div className="mt-6">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Отображение ошибки
function ErrorState({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-4">Ошибка</h1>
          <p>{error}</p>
          <div className="mt-6">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Основной компонент страницы с серверным рендерингом
export default async function PublicReadingList({
  params,
  searchParams,
}: {
  params: { username: string };
  searchParams: { code?: string; category?: string };
}) {
  await connection();
  
  const username = params.username;
  const accessCode = searchParams.code || "";
  const selectedCategory = searchParams.category || null;

  try {
    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return <ErrorState error="Пользователь не найден" />;
    }

    // Получаем список чтения пользователя
    const readingList = await prisma.readingList.findFirst({
      where: { userId: user.id },
      include: {
        categories: true,
        articles: {
          include: {
            categories: true,
          },
        },
      },
    });

    if (!readingList) {
      return <ErrorState error="Список чтения не найден" />;
    }

    // Проверяем доступность списка
    if (!readingList.isPublic && !accessCode) {
      return <AccessCodeForm username={username} error="Требуется код доступа для просмотра этой коллекции" />;
    }

    // Если список приватный, проверяем код доступа
    if (!readingList.isPublic && accessCode !== readingList.accessCode) {
      return <AccessCodeForm username={username} error="Неверный код доступа" />;
    }

    // Подготавливаем данные для отображения
    const articles = readingList.articles;
    const categories = readingList.categories;
    
    // Фильтруем статьи по категории если указана
    const filteredArticles = selectedCategory
      ? articles.filter((article) =>
          article.categories.some((cat) => cat.id === selectedCategory)
        )
      : articles;

    // Подсчитываем количество статей в каждой категории
    const categoriesWithCount = categories.map((category) => ({
      ...category,
      articleCount: articles.filter((article) =>
        article.categories.some((cat) => cat.id === category.id)
      ).length,
    }));

    // Формируем данные для отображения
    const readingListData = {
      id: readingList.id,
      name: readingList.name,
      username,
      isPublic: readingList.isPublic,
      articleCount: articles.length,
      categoryCount: categories.length,
      articles: filteredArticles,
      categories: categoriesWithCount,
      createdAt: readingList.createdAt.toISOString(),
      updatedAt: readingList.updatedAt.toISOString(),
    };

    // Отображаем список чтения
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {readingListData.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  Коллекция пользователя{" "}
                  <span className="font-medium">{readingListData.username}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {readingListData.articleCount} статей • {readingListData.categoryCount}{" "}
                  категорий
                </p>
              </div>
            </div>

            {readingListData.categories.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-800 mb-2">
                  Категории
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/r/${username}${accessCode ? `?code=${accessCode}` : ''}`}
                    className={`px-3 py-1 rounded-full text-sm ${
                      !selectedCategory
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    Все ({readingListData.articleCount})
                  </Link>

                  {readingListData.categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/r/${username}?${accessCode ? `code=${accessCode}&` : ''}category=${category.id}`}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedCategory === category.id
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                    >
                      {category.name} ({category.articleCount})
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {filteredArticles.length > 0 ? (
              <div className="space-y-6">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="border rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <h3 className="text-lg font-medium text-blue-700 hover:text-blue-900 mb-1">
                            {article.title || "Без названия"}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {article.url}
                          </p>
                          {article.description && (
                            <p className="text-gray-700 mb-2">
                              {article.description}
                            </p>
                          )}
                        </a>

                        {article.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {article.categories.map((cat) => (
                              <span
                                key={cat.id}
                                className="px-2 py-0.5 bg-gray-100 text-xs rounded-full text-gray-600"
                              >
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {article.imageUrl ? (
                        <div className="ml-4 w-24 h-24 flex-shrink-0">
                          <img
                            src={article.imageUrl}
                            alt={article.title || "Thumbnail"}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      ) : (
                        <div className="ml-4 w-24 h-24 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-10 w-10 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-600">
                  {selectedCategory
                    ? "В выбранной категории нет статей"
                    : "В этой коллекции пока нет статей"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading reading list:", error);
    return <ErrorState error="Произошла ошибка при загрузке коллекции" />;
  }
}
