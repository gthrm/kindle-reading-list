"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
}

interface Article {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  isRead: boolean;
  categories: Category[];
}

interface ReadingList {
  id: string;
  name: string;
  accessCode: string | null;
  isPublic: boolean;
  articles: Article[];
  categories: Category[];
  username: string;
  user?: {
    username: string;
  };
}

export default function EditReadingList() {
  const params = useParams();
  const searchParams = useSearchParams();
  const filterCategory = searchParams.get("category");
  const listId = params.id as string;

  const [readingList, setReadingList] = useState<ReadingList | null>({
    id: "",
    name: "",
    accessCode: null,
    isPublic: false,
    articles: [],
    categories: [],
    username: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [addUrlError, setAddUrlError] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Form state for editing list settings
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    const fetchReadingList = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/reading-lists/${listId}`);
        if (!res.ok) throw new Error("Ошибка загрузки данных коллекции");

        const data = await res.json();
        console.log("Загружены данные коллекции:", {
          name: data.readingList.name,
          articlesCount: data.readingList.articles?.length || 0,
          categories: data.readingList.categories?.length || 0,
          username: data.readingList.username
        });
        
        setReadingList(data.readingList);

        // Если указана категория в URL, устанавливаем её как фильтр
        if (filterCategory) {
          setSelectedCategories([filterCategory]);
        }

        // Initialize form with current values
        setName(data.readingList.name);
        setIsPublic(data.readingList.isPublic);
        setAccessCode(data.readingList.accessCode || "");
      } catch (err) {
        setError("Ошибка при загрузке коллекции");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadingList();
  }, [listId, filterCategory]);

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUrl.trim()) return;

    setIsAddingUrl(true);
    setAddUrlError("");

    try {
      const res = await fetch(`/api/reading-lists/${listId}/articles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl.trim(),
          categoryIds:
            selectedCategories.length > 0 ? selectedCategories : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Update the local state with the new article
        setReadingList((prev) => {
          if (!prev) return prev;

          const updatedArticles = [...(prev.articles || []), data.article];

          return {
            ...prev,
            articles: updatedArticles,
          };
        });

        setNewUrl("");
      } else {
        const data = await res.json();
        setAddUrlError(data.message || "Ошибка при добавлении ссылки");
      }
    } catch (err) {
      setAddUrlError("Произошла ошибка при добавлении ссылки");
      console.error(err);
    } finally {
      setIsAddingUrl(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSavingSettings(true);
    setError("");

    try {
      const res = await fetch(`/api/reading-lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          isPublic,
          accessCode: accessCode.trim() || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReadingList(data.readingList);
        setIsEditingSettings(false);
      } else {
        const data = await res.json();
        setError(data.message || "Ошибка при обновлении настроек");
      }
    } catch (err) {
      setError("Произошла ошибка при обновлении настроек");
      console.error(err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту ссылку?")) return;

    try {
      const res = await fetch(
        `/api/reading-lists/${listId}/articles/${articleId}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        // Update the local state by removing the deleted article
        setReadingList((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            articles: prev.articles?.filter(
              (article) => article.id !== articleId
            ) || [],
          };
        });
      } else {
        const data = await res.json();
        setError(data.message || "Ошибка при удалении ссылки");
      }
    } catch (err) {
      setError("Произошла ошибка при удалении ссылки");
      console.error(err);
    }
  };

  const handleToggleRead = async (
    articleId: string,
    currentIsRead: boolean
  ) => {
    try {
      const res = await fetch(
        `/api/reading-lists/${listId}/articles/${articleId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isRead: !currentIsRead,
          }),
        }
      );

      if (res.ok) {
        // Обновляем локальное состояние
        setReadingList((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            articles: prev.articles?.map((article) =>
              article.id === articleId
                ? { ...article, isRead: !currentIsRead }
                : article
            ) || [],
          };
        });
      }
    } catch (err) {
      console.error("Error toggling read status:", err);
    }
  };

  // TODO: В будущем реализовать функцию обновления категорий для статей
  // Функция handleUpdateArticleCategories была удалена, так как она не используется
  
  // Фильтрация статей по выбранным категориям
  const filteredArticles = readingList?.articles?.filter((article) => {
    if (!article) return false;
    if (selectedCategories.length === 0) return true;
    return article.categories?.some((cat) =>
      selectedCategories.includes(cat.id)
    ) || false;
  }) || [];
  
  // Отображение информации о статьях для отладки
  useEffect(() => {
    if (readingList?.articles) {
      console.log(`Отфильтровано ${filteredArticles.length} статей из ${readingList.articles.length} всего`);
    }
  }, [readingList?.articles, filteredArticles.length]);

  const toggleCategoryFilter = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-center py-10">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!readingList) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-red-600">Коллекция не найдена</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800"
            >
              Вернуться на главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditingSettings ? "Редактирование настроек" : readingList.name}
          </h1>
          <div className="flex space-x-4">
            <Link
              href="/dashboard"
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              Назад
            </Link>
            {!isEditingSettings && (
              <button
                onClick={() => setIsEditingSettings(true)}
                className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm"
              >
                Настройки
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Settings form */}
        {isEditingSettings ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <form onSubmit={handleSaveSettings}>
              <div className="px-4 py-5 sm:p-6">
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Название коллекции
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      id="isPublic"
                      name="isPublic"
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isPublic"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Публичная коллекция (доступна без кода доступа)
                    </label>
                  </div>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="accessCode"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Код доступа (необязательно)
                  </label>
                  <input
                    type="text"
                    name="accessCode"
                    id="accessCode"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditingSettings(false)}
                    className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSettings || !name}
                    className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    {isSavingSettings ? "Сохранение..." : "Сохранить настройки"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* URL input form */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Добавить ссылку
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Введите URL статьи или веб-страницы, которую хотите добавить в
                  коллекцию
                </p>

                {addUrlError && (
                  <div className="mt-3 bg-red-50 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
                    {addUrlError}
                  </div>
                )}

                <form onSubmit={handleAddUrl} className="mt-4">
                  <div className="flex items-center">
                    <input
                      type="url"
                      name="url"
                      id="url"
                      placeholder="https://example.com/article"
                      required
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    <button
                      type="submit"
                      disabled={isAddingUrl || !newUrl.trim()}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                      {isAddingUrl ? "Добавление..." : "Добавить"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Categories filter */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">Категории</h3>
              <div className="flex flex-wrap gap-2">
                {/* All Categories button */}
                <button
                  onClick={() => setSelectedCategories([])}
                  className={`rounded-md px-3 py-1 text-sm transition-colors ${
                    selectedCategories.length === 0
                      ? "bg-teal-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                  }`}
                >
                  Все
                </button>

                {/* Individual category buttons */}
                {readingList?.categories?.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategoryFilter(category.id)}
                    className={`rounded-md px-3 py-1 text-sm transition-colors ${
                      selectedCategories.includes(category.id)
                        ? "bg-teal-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                    }`}
                  >
                    {category.name}{" "}
                    <span className="text-xs opacity-70">
                      (
                      {
                        readingList?.articles?.filter((article) =>
                          article?.categories?.some((c) => c.id === category.id)
                        ).length
                      }
                      )
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reading List Preview */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Содержимое коллекции
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {filteredArticles?.length || 0}{" "}
                    {filteredArticles?.length === 1 ? "ссылка" : "ссылок"}
                  </p>
                </div>

                <Link
                  href={
                    readingList.isPublic
                      ? `/r/${readingList?.user?.username || readingList.username || 'view'}`
                      : `/r/${readingList?.user?.username || readingList.username || 'view'}?code=${readingList.accessCode}`
                  }
                  className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  target="_blank"
                >
                  Открыть для чтения
                </Link>
              </div>

              {filteredArticles && filteredArticles.length === 0 ? (
                <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
                  {readingList?.articles?.length > 0 ? 
                    "В выбранной категории нет ссылок. Выберите другую категорию или добавьте новые ссылки." : 
                    "В этой коллекции пока нет ссылок. Добавьте первую!"}
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredArticles?.map((article) => (
                    <li key={article.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-start">
                        {article.imageUrl ? (
                          <div className="flex-shrink-0 h-16 w-16 mr-4">
                            <img
                              src={article.imageUrl}
                              alt=""
                              className="h-16 w-16 object-cover rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/placeholder-image.svg";
                                target.onerror = null;
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-16 w-16 mr-4 bg-gray-100 rounded flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-8 w-8 text-gray-400"
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

                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-gray-900 truncate">
                            {article.title || article.url}
                          </p>
                          {article.description && (
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                              {article.description}
                            </p>
                          )}
                          <div className="mt-1 flex items-center">
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 truncate"
                            >
                              {article.url}
                            </a>
                          </div>
                        </div>

                        <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleToggleRead(article.id, article.isRead)
                            }
                            className={`px-2 py-1 text-xs rounded-full ${
                              article.isRead
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {article.isRead ? "Прочитано" : "Не прочитано"}
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(article.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
