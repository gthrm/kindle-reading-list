'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
  articleCount: number
}

interface ReadingList {
  id: string
  name: string
  accessCode: string | null
  isPublic: boolean
  articleCount: number
  categoryCount: number
  categories: Category[]
  username?: string
}

interface User {
  id: string
  username: string
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [readingList, setReadingList] = useState<ReadingList | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditingList, setIsEditingList] = useState(false)
  const [listName, setListName] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [isEditingCategory, setIsEditingCategory] = useState<string | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')

  // Fetch user and reading list
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userRes = await fetch('/api/user')
        if (!userRes.ok) throw new Error('Failed to fetch user data')
        const userData = await userRes.json()
        setUser(userData.user)

        // Fetch reading list
        const listRes = await fetch('/api/reading-lists')
        if (!listRes.ok) throw new Error('Failed to fetch reading list')
        const listData = await listRes.json()
        
        if (listData.readingList) {
          setReadingList(listData.readingList)
          setListName(listData.readingList.name)
          setIsPublic(listData.readingList.isPublic)
          setAccessCode(listData.readingList.accessCode || '')
        }
      } catch (err) {
        setError('Ошибка загрузки данных. Пожалуйста, попробуйте снова.')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/auth/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const handleUpdateList = async () => {
    try {
      const res = await fetch('/api/reading-lists', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: listName,
          isPublic,
          accessCode: accessCode || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Ошибка обновления коллекции')
      }

      const data = await res.json()
      setReadingList({
        ...readingList!,
        name: data.readingList.name,
        isPublic: data.readingList.isPublic,
        accessCode: data.readingList.accessCode,
      })
      setIsEditingList(false)
    } catch (err) {
      console.error('Update error:', err)
      setError(err instanceof Error ? err.message : 'Ошибка обновления коллекции')
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newCategoryName.trim()) return
    
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Ошибка создания категории')
      }
      
      // Обновляем список категорий
      const listRes = await fetch('/api/reading-lists')
      if (!listRes.ok) throw new Error('Ошибка загрузки данных коллекции')
      
      const listData = await listRes.json()
      setReadingList(listData.readingList)
      
      // Сбрасываем форму
      setNewCategoryName('')
      setIsAddingCategory(false)
    } catch (err) {
      console.error('Category creation error:', err)
      setError(err instanceof Error ? err.message : 'Ошибка создания категории')
    }
  }

  const handleEditCategory = async (categoryId: string, newName: string) => {
    if (!newName.trim()) return
    
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Ошибка обновления категории')
      }
      
      // Обновляем список категорий
      const listRes = await fetch('/api/reading-lists')
      if (!listRes.ok) throw new Error('Ошибка загрузки данных коллекции')
      
      const listData = await listRes.json()
      setReadingList(listData.readingList)
      
      // Сбрасываем форму
      setIsEditingCategory(null)
      setEditCategoryName('')
    } catch (err) {
      console.error('Category update error:', err)
      setError(err instanceof Error ? err.message : 'Ошибка обновления категории')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию? Статьи в этой категории не будут удалены.')) return
    
    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Ошибка удаления категории')
      }
      
      // Обновляем список категорий
      const listRes = await fetch('/api/reading-lists')
      if (!listRes.ok) throw new Error('Ошибка загрузки данных коллекции')
      
      const listData = await listRes.json()
      setReadingList(listData.readingList)
    } catch (err) {
      console.error('Category delete error:', err)
      setError(err instanceof Error ? err.message : 'Ошибка удаления категории')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-center py-10">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Моя коллекция</h1>
          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-gray-600">
                Привет, {user.username}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!readingList ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-600">
              У вас пока нет коллекции для чтения.
            </p>
          </div>
        ) : (
          <>
            {/* Информация о коллекции */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
              <div className="p-6">
                {isEditingList ? (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Редактирование коллекции
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Название коллекции
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={listName}
                          onChange={(e) => setListName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isPublic"
                          checked={isPublic}
                          onChange={(e) => setIsPublic(e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                          Сделать публичной
                        </label>
                      </div>
                      <div>
                        <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-1">
                          Код доступа (если приватная)
                        </label>
                        <input
                          type="text"
                          id="accessCode"
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Оставьте пустым, если код не нужен"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUpdateList}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingList(false)
                            setListName(readingList.name)
                            setIsPublic(readingList.isPublic)
                            setAccessCode(readingList.accessCode || '')
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {readingList.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {readingList.articleCount} статей • {readingList.categoryCount} категорий
                        </p>
                        <div className="mt-2 flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            readingList.isPublic ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {readingList.isPublic ? 'Публичная' : 'Приватная'}
                          </span>
                          {readingList.accessCode && (
                            <span className="ml-2 text-xs text-gray-500">
                              Код доступа: {readingList.accessCode}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEditingList(true)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Редактировать
                      </button>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Link
                        href={`/reading-list/${readingList.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Управление статьями
                      </Link>
                      <Link
                        href={user ? `/r/${user.username}${!readingList.isPublic && readingList.accessCode ? `?code=${readingList.accessCode}` : ''}` : '#'}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        target="_blank"
                      >
                        Публичный просмотр
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Категории */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Категории</h3>
                  <button
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {isAddingCategory ? 'Отмена' : 'Добавить категорию'}
                  </button>
                </div>

                {isAddingCategory && (
                  <form onSubmit={handleAddCategory} className="mb-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Название категории"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Добавить
                      </button>
                    </div>
                  </form>
                )}

                {readingList.categories.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">
                    У вас пока нет категорий. Добавьте первую!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {readingList.categories.map((category) => (
                      <div
                        key={category.id}
                        className="border rounded-lg p-4 hover:shadow-sm transition"
                      >
                        {isEditingCategory === category.id ? (
                          <div className="mb-3">
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Название категории"
                              />
                              <button
                                onClick={() => handleEditCategory(category.id, editCategoryName)}
                                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Сохранить
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditingCategory(null);
                                  setEditCategoryName('');
                                }}
                                className="px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                              >
                                Отмена
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-gray-900">{category.name}</h4>
                              <p className="text-sm text-gray-500">
                                {category.articleCount} статей
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Link
                                href={`/reading-list/${readingList.id}?category=${category.id}`}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Просмотр
                              </Link>
                              <button
                                onClick={() => {
                                  setIsEditingCategory(category.id)
                                  setEditCategoryName(category.name)
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Редактировать
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
} 