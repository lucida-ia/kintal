"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "./dashboard/navbar";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      // Check if auth cookie exists
      const authCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("kintal-auth="));

      const isAuth = authCookie?.split("=")[1] === "authenticated";
      setIsAuthenticated(isAuth);
      setIsLoading(false);

      // If not authenticated and not on auth page, redirect
      if (!isAuth && !pathname.startsWith("/auth")) {
        router.push("/auth");
        return;
      }

      // If authenticated and on auth page, redirect to home
      if (isAuth && pathname.startsWith("/auth")) {
        router.push("/");
        return;
      }
    };

    checkAuth();
  }, [router, pathname]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-black dark:to-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-100 mx-auto"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  // On auth page, show only the auth content without navbar
  if (pathname.startsWith("/auth")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-black dark:to-zinc-900">
        {children}
      </div>
    );
  }

  // If not authenticated and not on auth page, show loading (will redirect)
  if (!isAuthenticated && !pathname.startsWith("/auth")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-black dark:to-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-100 mx-auto"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Redirecionando...
          </p>
        </div>
      </div>
    );
  }

  // For authenticated users on non-auth pages, show the full layout
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-black dark:to-zinc-900"
      suppressHydrationWarning
    >
      <div className="flex flex-col md:flex-row">
        <Navbar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-zinc-900 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
