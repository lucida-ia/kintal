import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Dashboard Overview
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Track and analyze your project metrics in real-time
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 dark:from-zinc-600 dark:to-zinc-700 dark:hover:from-zinc-500 dark:hover:to-zinc-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Project
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group relative hover:shadow-lg transition-all duration-200">
            <div className="absolute inset-0 bg-zinc-700/10 dark:bg-zinc-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <svg
                    className="h-6 w-6 text-zinc-600 dark:text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                  24
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Total Projects
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                  +12% from last month
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative hover:shadow-lg transition-all duration-200">
            <div className="absolute inset-0 bg-zinc-700/10 dark:bg-zinc-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <svg
                    className="h-6 w-6 text-zinc-600 dark:text-zinc-400"
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
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                  2.4K
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Data Points
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                  +8% from last week
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative hover:shadow-lg transition-all duration-200">
            <div className="absolute inset-0 bg-zinc-700/10 dark:bg-zinc-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <svg
                    className="h-6 w-6 text-zinc-600 dark:text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                  8
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Active Sources
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                  All systems online
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative hover:shadow-lg transition-all duration-200">
            <div className="absolute inset-0 bg-zinc-700/10 dark:bg-zinc-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <svg
                    className="h-6 w-6 text-zinc-600 dark:text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                  96%
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  Success Rate
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                  +2% from yesterday
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Area */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Analytics Overview
                </h3>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-xs font-medium bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg">
                    7 days
                  </button>
                  <button className="px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg">
                    30 days
                  </button>
                </div>
              </div>
              <div className="h-80 flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-black rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-zinc-500 dark:text-zinc-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Chart visualization will appear here
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    Connect your data sources to see insights
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-zinc-500 dark:bg-zinc-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      Dashboard initialized
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      2 minutes ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-zinc-500 dark:bg-zinc-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      Ready for data integration
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      5 minutes ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-zinc-500 dark:bg-zinc-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      System health check passed
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      1 hour ago
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 text-left bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Connect Data Source
                  </span>
                  <svg
                    className="h-4 w-4 text-zinc-500 dark:text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
                <button className="w-full flex items-center justify-between p-3 text-left bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Create Report
                  </span>
                  <svg
                    className="h-4 w-4 text-zinc-500 dark:text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
                <button className="w-full flex items-center justify-between p-3 text-left bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Export Data
                  </span>
                  <svg
                    className="h-4 w-4 text-zinc-500 dark:text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
