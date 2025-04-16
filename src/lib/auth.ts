import { verify } from "jsonwebtoken";

// Функция для получения секретного ключа
export function getJwtSecret() {
  if (!process.env.NEXTAUTH_SECRET) {
    throw new Error(
      "Переменная окружения NEXTAUTH_SECRET не настроена. " +
        "Пожалуйста, добавьте её в .env или настройки Vercel."
    );
  }

  return process.env.NEXTAUTH_SECRET;
}

// Базовый интерфейс для JWT токена
export interface JwtPayload {
  id: string;
  username?: string;
  [key: string]: string | number | boolean | undefined;
}

// Функция для верификации JWT токена
export function verifyToken<T extends JwtPayload = JwtPayload>(
  token: string
): T {
  const secret = getJwtSecret();
  return verify(token, secret) as T;
}

export const getTokenCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    name: "token",
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    sameSite: "lax" as const,
    secure: isProduction,
  };
};
