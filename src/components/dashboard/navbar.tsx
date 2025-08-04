"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "../theme-toggle";
import { KintalLogo } from "../logo";
import {
  MenuIcon,
  XIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LogOut,
} from "lucide-react";
import { ChartIcon, DashboardIcon, SearchIcon, UserListIcon } from "./icons";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    lucida: false,
  });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const handleLogout = () => {
    // Clear the auth cookie
    document.cookie =
      "kintal-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    // Redirect to auth page
    window.location.href = "/auth";
  };

  const NavContent = () => (
    <>
      {/* Logo Section */}
      <div className="p-4 md:p-6 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2/3">
              <KintalLogo />
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <nav className="p-4 md:p-6 space-y-2">
        <div className="pb-4">
          <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">
            Dashboard
          </h2>
        </div>

        {/* Lucida Menu */}
        <div className="space-y-1">
          <button
            onClick={() => toggleMenu("lucida")}
            className="group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-all duration-200"
          >
            <div className="flex items-center">
              <ChartIcon className="mr-3 h-4 w-4" />
              Lucida
            </div>
            {expandedMenus.lucida ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>

          {/* Submenu */}
          {expandedMenus.lucida && (
            <div className="ml-4 space-y-1 border-l border-zinc-200 dark:border-zinc-700 pl-4">
              <Link
                href="/lucida/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-all duration-200"
              >
                <DashboardIcon className="mr-3 h-4 w-4" />
                Dashboard
              </Link>

              <Link
                href="/lucida/search-user"
                onClick={() => setIsMobileMenuOpen(false)}
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-all duration-200"
              >
                <SearchIcon className="mr-3 h-4 w-4" />
                Busca de Usuário
              </Link>

              <Link
                href="/lucida/user-list"
                onClick={() => setIsMobileMenuOpen(false)}
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 transition-all duration-200"
              >
                <UserListIcon className="mr-3 h-4 w-4" />
                Lista de Usuários
              </Link>
            </div>
          )}
        </div>

        {/* Logout Section */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-4">
          <button
            onClick={handleLogout}
            className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 transition-all duration-200"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sair
          </button>
        </div>
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block sticky top-0 h-screen w-56 border-r border-zinc-200 dark:border-zinc-700 bg-white/90 backdrop-blur-xl dark:bg-zinc-900/90 overflow-y-auto shadow-sm dark:shadow-zinc-900/20">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-700 bg-white/90 backdrop-blur-xl dark:bg-zinc-900/90 shadow-sm dark:shadow-zinc-900/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <div className="w-24">
              <KintalLogo />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <XIcon className="h-5 w-5" />
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Mobile Menu */}
          <div className="md:hidden fixed top-0 right-0 z-50 h-full w-64 border-l border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg transform transition-transform duration-200 ease-in-out overflow-y-auto">
            <NavContent />
          </div>
        </>
      )}
    </>
  );
}
