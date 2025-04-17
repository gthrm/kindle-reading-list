import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Обработчик формы для ввода кода доступа
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; articleId: string }> }
) {
  const { id: username } = await params;

  try {
    // Получаем данные формы
    const formData = await request.formData();
    const code = formData.get("code") as string;

    if (!code) {
      // Редирект обратно с ошибкой
      return NextResponse.redirect(
        `/r/${username}?error=Код доступа обязателен`
      );
    }

    // Получаем пользователя по имени
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.redirect(
        `/r/${username}?error=Пользователь не найден`
      );
    }

    // Получаем список чтения пользователя
    const readingList = await prisma.readingList.findFirst({
      where: { userId: user.id },
    });

    if (!readingList) {
      return NextResponse.redirect(
        `/r/${username}?error=Список чтения не найден`
      );
    }

    // Проверяем код доступа
    if (readingList.accessCode !== code) {
      return NextResponse.redirect(`/r/${username}?error=Неверный код доступа`);
    }

    // Код верный, перенаправляем с кодом
    return NextResponse.redirect(`/r/${username}?code=${code}`);
  } catch (error) {
    console.error("Error verifying access code:", error);
    // Fallback to using params directly if we can't resolve the promise
    return NextResponse.redirect(
      `/r/${username}?error=Произошла ошибка при проверке кода`
    );
  }
}
