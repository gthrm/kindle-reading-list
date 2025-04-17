import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Обработчик формы для ввода кода доступа
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Получаем ID из параметров URL
    const { id: username } = await params;
    
    // Получаем данные формы
    const formData = await request.formData();
    const code = formData.get("code") as string;

    if (!code) {
      // Упрощенный подход для Kindle без сложных объектов
      // Используем просто путь, а не объект URL
      return NextResponse.redirect(`/r/${username}?error=Код доступа обязателен`, 307);
    }

    // Получаем пользователя по имени
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.redirect(`/r/${username}?error=Пользователь не найден`, 307);
    }

    // Получаем список чтения пользователя
    const readingList = await prisma.readingList.findFirst({
      where: { userId: user.id },
    });

    if (!readingList) {
      return NextResponse.redirect(`/r/${username}?error=Список чтения не найден`, 307);
    }

    // Проверяем код доступа
    if (readingList.accessCode !== code) {
      return NextResponse.redirect(`/r/${username}?error=Неверный код доступа`, 307);
    }

    // Код верный, перенаправляем с кодом
    return NextResponse.redirect(`/r/${username}?code=${code}`, 307);
  } catch (error) {
    console.error("Error verifying access code:", error);
    
    // В случае ошибки, нам нужно вернуть юзера на главную
    // Также используем простой путь для Kindle
    return NextResponse.redirect(`/`, 307);
  }
}
