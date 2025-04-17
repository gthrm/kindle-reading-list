import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Обработчик формы для ввода кода доступа
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const username = params.id;
  
  try {
    // Получаем данные формы
    const formData = await request.formData();
    const code = formData.get("code") as string;
    
    if (!code) {
      // Редирект обратно с ошибкой
      return NextResponse.redirect(
        new URL(`/r/${username}?error=Код доступа обязателен`, request.url)
      );
    }
    
    // Получаем пользователя по имени
    const user = await prisma.user.findUnique({
      where: { username },
    });
    
    if (!user) {
      return NextResponse.redirect(
        new URL(`/r/${username}?error=Пользователь не найден`, request.url)
      );
    }
    
    // Получаем список чтения пользователя
    const readingList = await prisma.readingList.findFirst({
      where: { userId: user.id },
    });
    
    if (!readingList) {
      return NextResponse.redirect(
        new URL(`/r/${username}?error=Список чтения не найден`, request.url)
      );
    }
    
    // Проверяем код доступа
    if (readingList.accessCode !== code) {
      return NextResponse.redirect(
        new URL(`/r/${username}?error=Неверный код доступа`, request.url)
      );
    }
    
    // Код верный, перенаправляем с кодом
    return NextResponse.redirect(
      new URL(`/r/${username}?code=${code}`, request.url)
    );
  } catch (error) {
    console.error("Error verifying access code:", error);
    return NextResponse.redirect(
      new URL(`/r/${username}?error=Произошла ошибка при проверке кода`, request.url)
    );
  }
} 