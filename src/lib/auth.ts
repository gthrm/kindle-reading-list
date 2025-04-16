// Экспортируем константу для использования в других местах
export const JWT_SECRET = process.env.NEXTAUTH_SECRET;

console.log("JWT_SECRET", JWT_SECRET);

// Настройки cookie для токена
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
