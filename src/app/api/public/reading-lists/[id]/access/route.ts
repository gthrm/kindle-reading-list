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
      // Редирект обратно с ошибкой
      return NextResponse.redirect(new URL(`/r/${username}?error=Код доступа обязателен`, request.url));
    }

    // Получаем пользователя по имени
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.redirect(new URL(`/r/${username}?error=Пользователь не найден`, request.url));
    }

    // Получаем список чтения пользователя
    const readingList = await prisma.readingList.findFirst({
      where: { userId: user.id },
    });

    if (!readingList) {
      return NextResponse.redirect(new URL(`/r/${username}?error=Список чтения не найден`, request.url));
    }

    // Проверяем код доступа
    if (readingList.accessCode !== code) {
      return NextResponse.redirect(new URL(`/r/${username}?error=Неверный код доступа`, request.url));
    }

    // Код верный, перенаправляем с кодом
    return NextResponse.redirect(new URL(`/r/${username}?code=${code}`, request.url));
  } catch (error) {
    console.error("Error verifying access code:", error);
    
    // В случае ошибки, нам нужно вернуть юзера на главную
    return NextResponse.redirect(new URL(`/`, request.url));
  }
}
