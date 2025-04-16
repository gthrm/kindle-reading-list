import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Kindle Reading List
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Создавайте, управляйте и читайте коллекции ссылок на Kindle просто и удобно.
          </p>
          <div className="space-y-3">
            <p className="text-lg text-slate-700 mb-2">
              Быстро добавляйте ссылки с компьютера или телефона, открывайте и читайте их на Kindle без лишних сложностей.
            </p>
            <p className="text-md text-slate-600 mb-6">
              Ссылки автоматически парсятся, показывая изображения и описания там, где это возможно.
            </p>
          </div>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/auth/register" 
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
            >
              Создать аккаунт
            </Link>
            <Link 
              href="/auth/login" 
              className="w-full sm:w-auto px-8 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 transition shadow-lg hover:shadow-xl"
            >
              Войти
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
