"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";

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

interface ReadingList {
  id: string;
  name: string;
  username: string;
  isPublic: boolean;
  articleCount: number;
  categoryCount: number;
  articles: Article[];
  categories: Category[];
  createdAt: string;
  updatedAt: string;
}

export default function PublicReadingList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const accessCode = searchParams.get("code") || "";
  const collectionId = params.username as string;

  const [readingList, setReadingList] = useState<ReadingList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    const fetchReadingList = async () => {
      try {
        setIsLoading(true);
        const url = `/api/public/reading-lists/${collectionId}${
          accessCode ? `?code=${accessCode}` : ""
        }`;
        const res = await fetch(url);

        if (!res.ok) {
          if (res.status === 403) {
            setError("Требуется код доступа для просмотра этой коллекции");
          } else if (res.status === 404) {
            setError("Коллекция не найдена");
          } else {
            const data = await res.json();
            setError(data.message || "Ошибка при загрузке коллекции");
          }
          return;
        }

        const data = await res.json();
        setReadingList(data.readingList);
      } catch (err) {
        console.error("Error fetching reading list:", err);
        setError("Ошибка при загрузке коллекции");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReadingList();
  }, [collectionId, accessCode]);

  // Фильтрация статей по выбранной категории
  const filteredArticles = selectedCategory
    ? readingList?.articles?.filter((article) =>
        article?.categories?.some((cat) => cat.id === selectedCategory)
      )
    : readingList?.articles;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-10">
            <p>Загрузка коллекции...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-600 mb-4">Ошибка</h1>
            <p className="mb-4">{error}</p>

            {error === "Требуется код доступа для просмотра этой коллекции" && (
              <div className="mt-4">
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Enter access code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  className="mt-2 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => {
                    if (code) {
                      router.push(`/r/${collectionId}?code=${code}`);
                    }
                  }}
                >
                  Submit
                </button>
              </div>
            )}

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

  if (!readingList) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h1 className="text-xl font-semibold text-gray-800 mb-4">
              Коллекция не найдена
            </h1>
            <p>Запрашиваемая коллекция не существует или была удалена.</p>
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

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {readingList.name}
              </h1>
              <p className="text-gray-600 mt-1">
                Коллекция пользователя{" "}
                <span className="font-medium">{readingList.username}</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {readingList.articleCount} статей • {readingList.categoryCount}{" "}
                категорий
              </p>
            </div>
          </div>

          {readingList?.categories?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-2">
                Категории
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedCategory === null
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  Все ({readingList.articleCount})
                </button>

                {readingList.categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedCategory === category.id
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {category.name} ({category.articleCount})
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredArticles && filteredArticles.length > 0 ? (
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

                      {article.categories?.length > 0 && (
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
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder-image.svg";
                            target.onerror = null;
                          }}
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
}
