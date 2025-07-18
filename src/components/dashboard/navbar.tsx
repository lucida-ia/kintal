import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";
import { KintalLogo } from "../logo";

export default function Navbar() {
  return (
    <aside className="sticky top-0 h-screen w-56 border-r border-zinc-200 dark:border-zinc-700 bg-white/90 backdrop-blur-xl dark:bg-zinc-900/90 overflow-y-auto shadow-sm dark:shadow-zinc-900/20">
      {/* Logo Section */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2/3">
              <KintalLogo />
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <nav className="p-6 space-y-2">
        <div className="pb-4">
          <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">
            Dashboard
          </h2>
        </div>

        <Link
          href="/lucida"
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

        {/* <div className="pt-4">
          <h2 className="text-xs font-semibold text-zinc-600 dark:text-zinc-500 uppercase tracking-wider">
            Settings
          </h2>
        </div>

        <Link
          href="#"
          className="group flex items-center px-3 py-2 text-sm font-medium text-zinc-700 rounded-lg hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400"
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Preferences
        </Link> */}
      </nav>
    </aside>
  );
}
