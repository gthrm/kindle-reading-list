import { connection } from "next/server";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { PageProps } from "../../../../.next/types/app/layout";

// Страница для ввода кода доступа
function AccessCodeForm({
  username,
  error,
}: {
  username: string;
  error: string;
}) {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ padding: "20px", border: "1px solid #ccc", backgroundColor: "#fff" }}>
        <h1 style={{ fontSize: "24px", color: "#c00", marginBottom: "16px" }}>Ошибка</h1>
        <p style={{ marginBottom: "16px" }}>{error}</p>

        <form
          action={`/api/public/reading-lists/${username}/access`}
          method="post"
        >
          <div style={{ marginTop: "16px" }}>
            <input
              type="text"
              name="code"
              style={{ width: "100%", padding: "8px", border: "1px solid #ccc", marginBottom: "8px" }}
              placeholder="Введите код доступа"
              required
            />
            <button
              type="submit"
              style={{ width: "100%", padding: "8px", backgroundColor: "#00f", color: "#fff", border: "none", cursor: "pointer" }}
            >
              Отправить
            </button>
          </div>
        </form>

        <div style={{ marginTop: "20px" }}>
          <Link href="/" style={{ color: "#00f", textDecoration: "underline" }}>
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}

// Отображение ошибки
function ErrorState({ error }: { error: string }) {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ padding: "20px", border: "1px solid #ccc", backgroundColor: "#fff", textAlign: "center" }}>
        <h1 style={{ fontSize: "24px", color: "#c00", marginBottom: "16px" }}>Ошибка</h1>
        <p>{error}</p>
        <div style={{ marginTop: "20px" }}>
          <Link href="/" style={{ color: "#00f", textDecoration: "underline" }}>
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}

// Основной компонент страницы с серверным рендерингом
export default async function PublicReadingList({
  params,
  searchParams,
}: PageProps) {
  await connection();

  const { username } = await params;
  const accessCode = (await searchParams)?.code || "";
  const selectedCategory = (await searchParams)?.category || null;

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
          orderBy: {
            createdAt: 'desc' // Сортируем статьи по дате создания (сначала новые)
          }
        },
      },
    });

    if (!readingList) {
      return <ErrorState error="Список чтения не найден" />;
    }

    // Проверяем доступность списка
    if (!readingList.isPublic && !accessCode) {
      return (
        <AccessCodeForm
          username={username}
          error="Требуется код доступа для просмотра этой коллекции"
        />
      );
    }

    // Если список приватный, проверяем код доступа
    if (!readingList.isPublic && accessCode !== readingList.accessCode) {
      return (
        <AccessCodeForm username={username} error="Неверный код доступа" />
      );
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

    // Отображаем список чтения - упрощенная версия для старых браузеров
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <div style={{ padding: "20px", border: "1px solid #ccc", backgroundColor: "#fff" }}>
          <div style={{ marginBottom: "24px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#000", marginBottom: "8px" }}>
              {readingListData.name}
            </h1>
            <p style={{ color: "#333", marginBottom: "8px" }}>
              Коллекция пользователя <span style={{ fontWeight: "bold" }}>{readingListData.username}</span>
            </p>
            <p style={{ fontSize: "14px", color: "#555" }}>
              {readingListData.articleCount} статей • {readingListData.categoryCount} категорий
            </p>
          </div>

          {readingListData.categories.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#000", marginBottom: "12px" }}>
                Категории
              </h2>
              <div>
                <Link
                  href={`/r/${username}${accessCode ? `?code=${accessCode}` : ""}`}
                  style={{ 
                    display: "inline-block", 
                    margin: "0 8px 8px 0", 
                    padding: "4px 12px", 
                    border: "1px solid #ccc",
                    backgroundColor: !selectedCategory ? "#e6f0ff" : "#f5f5f5",
                    color: !selectedCategory ? "#0033cc" : "#333",
                    textDecoration: "none"
                  }}
                >
                  Все ({readingListData.articleCount})
                </Link>

                {readingListData.categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/r/${username}?${accessCode ? `code=${accessCode}&` : ""}category=${category.id}`}
                    style={{ 
                      display: "inline-block", 
                      margin: "0 8px 8px 0", 
                      padding: "4px 12px", 
                      border: "1px solid #ccc",
                      backgroundColor: selectedCategory === category.id ? "#e6f0ff" : "#f5f5f5",
                      color: selectedCategory === category.id ? "#0033cc" : "#333",
                      textDecoration: "none"
                    }}
                  >
                    {category.name} ({category.articleCount})
                  </Link>
                ))}
              </div>
            </div>
          )}

          {filteredArticles.length > 0 ? (
            <div>
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  style={{ 
                    padding: "16px", 
                    marginBottom: "16px", 
                    border: "1px solid #ccc"
                  }}
                >
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      color: "#0033cc", 
                      fontSize: "18px", 
                      fontWeight: "bold", 
                      textDecoration: "underline",
                      display: "block",
                      marginBottom: "8px"
                    }}
                  >
                    {article.title || "Без названия"}
                  </a>
                  
                  <p style={{ fontSize: "14px", color: "#555", marginBottom: "8px", wordBreak: "break-all" }}>
                    {article.url}
                  </p>
                  
                  {article.description && (
                    <p style={{ color: "#333", marginBottom: "12px" }}>
                      {article.description}
                    </p>
                  )}

                  {article.categories.length > 0 && (
                    <div style={{ marginTop: "12px" }}>
                      {article.categories.map((cat) => (
                        <span
                          key={cat.id}
                          style={{ 
                            display: "inline-block", 
                            margin: "0 4px 4px 0", 
                            padding: "2px 8px", 
                            backgroundColor: "#f5f5f5", 
                            border: "1px solid #ddd",
                            fontSize: "12px",
                            color: "#555" 
                          }}
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {article.imageUrl && (
                    <div style={{ marginTop: "16px", border: "1px solid #ddd" }}>
                      <img
                        src={article.imageUrl}
                        alt={article.title || "Изображение статьи"}
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ color: "#555" }}>
                {selectedCategory
                  ? "В выбранной категории нет статей"
                  : "В этой коллекции пока нет статей"}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading reading list:", error);
    return <ErrorState error="Произошла ошибка при загрузке коллекции" />;
  }
}
