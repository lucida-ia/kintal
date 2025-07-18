"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "../theme-toggle";
import { KintalLogo } from "../logo";
import { MenuIcon, XIcon } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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

        <Link
          href="/lucida"
          onClick={() => setIsMobileMenuOpen(false)}
          className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-white shadow-sm ring-1 ring-zinc-300 dark:ring-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
        >
          <svg
            className="mr-3 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Lucida
        </Link>
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
