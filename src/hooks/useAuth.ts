"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      // Check if auth cookie exists
      const authCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("kintal-auth="));

      const isAuth = authCookie?.split("=")[1] === "authenticated";
      setIsAuthenticated(isAuth);

      // If not authenticated and not on auth page, redirect
      if (!isAuth && !window.location.pathname.startsWith("/auth")) {
        router.push("/auth");
      }
    };

    checkAuth();

    // Check auth on page visibility change (tab switching)
    document.addEventListener("visibilitychange", checkAuth);

    return () => {
      document.removeEventListener("visibilitychange", checkAuth);
    };
  }, [router]);

  return { isAuthenticated };
}
