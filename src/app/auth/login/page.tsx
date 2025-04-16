"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [redirectTimer, setRedirectTimer] = useState<number | null>(null);

  useEffect(() => {
    if (searchParams?.get("registered") === "true") {
      setSuccessMessage("Регистрация успешна! Теперь вы можете войти.");
    }

    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/user", {
          credentials: "include",
        });

        if (res.ok) {
          // User is already logged in, redirect to dashboard
          setSuccessMessage("Вы уже вошли в систему! Перенаправление...");
          window.location.replace("/dashboard");
        }
      } catch {
        // Ignore errors, just continue showing the login page
        console.log("Auth check error or not logged in");
      }
    };

    checkAuth();

    // Cleanup timeout if component unmounts
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [searchParams, redirectTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("Login attempt for user:", username);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Ensure cookies are sent with the request
      });

      const data = await res.json();

      if (res.ok) {
        console.log("Login successful, redirecting to dashboard");
        setSuccessMessage("Вход выполнен успешно! Перенаправление...");

        // Add a small delay to ensure the cookie is properly set
        const timer = window.setTimeout(() => {
          console.log("Redirecting now...");
          // Use location.replace instead of location.href to prevent back navigation
          window.location.replace("/dashboard");
        }, 1000);

        setRedirectTimer(timer);
      } else {
        console.log("Login failed:", data.message);
        setError(data.message || "Неверное имя пользователя или пароль");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        "Ошибка при попытке входа. Проверьте соединение и попробуйте снова."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Вход в аккаунт
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Или{" "}
          <Link
            href="/auth/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            зарегистрируйтесь
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} suppressHydrationWarning>
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
                {successMessage}
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Имя пользователя
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Пароль
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isLoading ? "Вход..." : "Войти"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
