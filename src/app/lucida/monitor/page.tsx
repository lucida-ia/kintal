"use client";

import { useState, useEffect, useCallback } from "react";
import DashWrapper from "@/components/dashboard/dash-wrapper";
import Header from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import {
  AlertTriangle,
  Bug,
  XCircle,
  TrendingUpIcon,
  List,
} from "lucide-react";

interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  warnings: number;
  weeklyCount: number;
}

interface ChartDataPoint {
  time: string;
  errors: number;
  warnings: number;
  critical: number;
  total: number;
  formattedTime?: string;
}

interface ErrorType {
  type: string;
  count: number;
  lastOccurrence: string;
  severity: string;
  examples: string[];
}

const chartConfig = {
  errors: {
    label: "Erros",
    color: "#dc2626", // Red
  },
  warnings: {
    label: "Avisos",
    color: "#ca8a04", // Yellow/Orange
  },
  critical: {
    label: "Críticos",
    color: "#7c2d12", // Dark Red
  },
};

export default function Monitor() {
  const [timeRange, setTimeRange] = useState("all");
  const [errorType, setErrorType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorStats, setErrorStats] = useState<ErrorStats>({
    totalErrors: 0,
    criticalErrors: 0,
    warnings: 0,
    weeklyCount: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [errorTypes, setErrorTypes] = useState<ErrorType[]>([]);
  const [errorTypesLoading, setErrorTypesLoading] = useState(false);
  const [errorTypesError, setErrorTypesError] = useState<string | null>(null);

  const formatWeeklyText = (count: number): string => {
    if (count === 0) return "Nenhum novo essa semana";
    if (count === 1) return "1 novo essa semana";
    return `${count} novos essa semana`;
  };

  const buildQueryParams = (timeRange: string): string => {
    const params = new URLSearchParams();

    // If "all" is selected, don't add any date filters
    if (timeRange === "all") {
      return params.toString();
    }

    const now = new Date();

    switch (timeRange) {
      case "1h":
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        params.append("from", oneHourAgo.toISOString());
        break;
      case "24h":
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        params.append("from", oneDayAgo.toISOString());
        break;
      case "7d":
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.append("from", oneWeekAgo.toISOString());
        break;
      case "30d":
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.append("from", oneMonthAgo.toISOString());
        break;
    }

    params.append("to", now.toISOString());
    return params.toString();
  };

  const fetchErrorStats = useCallback(async (timeRange: string) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = buildQueryParams(timeRange);
      const url = `/api/posthog/errors/stats${
        queryParams ? `?${queryParams}` : ""
      }`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setErrorStats({
          totalErrors: data.data.totalErrors,
          criticalErrors: data.data.criticalErrors,
          warnings: data.data.warnings,
          weeklyCount: data.data.weeklyCount,
        });
      } else {
        setError(data.error || "Failed to fetch error statistics");
      }
    } catch (err) {
      console.error("Error fetching error stats:", err);
      setError("Failed to fetch error statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChartData = useCallback(async (timeRange: string) => {
    try {
      setChartLoading(true);
      setChartError(null);

      const queryParams = buildQueryParams(timeRange);
      const url = `/api/posthog/errors/chart-data${
        queryParams ? `?${queryParams}` : ""
      }`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setChartData(data.data);
      } else {
        setChartError(data.error || "Failed to fetch chart data");
      }
    } catch (err) {
      console.error("Error fetching chart data:", err);
      setChartError("Failed to fetch chart data");
    } finally {
      setChartLoading(false);
    }
  }, []);

  const fetchErrorTypes = useCallback(async (timeRange: string) => {
    try {
      setErrorTypesLoading(true);
      setErrorTypesError(null);

      const queryParams = buildQueryParams(timeRange);
      const url = `/api/posthog/errors/types${
        queryParams ? `?${queryParams}` : ""
      }`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setErrorTypes(data.data);
      } else {
        setErrorTypesError(data.error || "Failed to fetch error types");
      }
    } catch (err) {
      console.error("Error fetching error types:", err);
      setErrorTypesError("Failed to fetch error types");
    } finally {
      setErrorTypesLoading(false);
    }
  }, []);

  const fetchAllData = useCallback(
    async (timeRange: string) => {
      await Promise.all([
        fetchErrorStats(timeRange),
        fetchChartData(timeRange),
        fetchErrorTypes(timeRange),
      ]);
    },
    [fetchErrorStats, fetchChartData, fetchErrorTypes]
  );

  useEffect(() => {
    fetchAllData(timeRange);
  }, [timeRange, fetchAllData]);

  const errorInfo = [
    {
      key: "totalErrors",
      title: "Total de Erros",
      value: errorStats.totalErrors,
      weeklyText: formatWeeklyText(errorStats.weeklyCount),
      icon: (
        <Bug className="h-5 w-5" style={{ color: chartConfig.errors.color }} />
      ),
    },
    {
      key: "totalWarnings",
      title: "Total de Avisos",
      value: errorStats.warnings,
      weeklyText: formatWeeklyText(errorStats.warnings),
      icon: (
        <AlertTriangle
          className="h-5 w-5"
          style={{ color: chartConfig.warnings.color }}
        />
      ),
    },
    {
      key: "totalCritical",
      title: "Erros Críticos",
      value: errorStats.criticalErrors,
      weeklyText: formatWeeklyText(errorStats.criticalErrors),
      icon: (
        <XCircle
          className="h-5 w-5"
          style={{ color: chartConfig.critical.color }}
        />
      ),
    },
  ];

  const handleQuickFilter = (filterType: string) => {
    setTimeRange(filterType);
    fetchAllData(filterType);
  };

  const handleErrorTypeFilter = (type: string) => {
    setErrorType(type);
    // For now, we'll just update the filter state
    // In the future, this could filter the displayed data
  };

  return (
    <DashWrapper>
      <Header title="Monitor" description="Tracking de logs e erros" />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          {error}
        </div>
      )}

      {/* Filter Section */}
      <div className="flex flex-col gap-4 mt-4 sm:mt-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border dark:border-zinc-700">
        {/* Quick Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 flex items-center">
            Filtros Rápidos:
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Todos os dados" },
              { key: "1h", label: "Última hora" },
              { key: "24h", label: "Últimas 24h" },
              { key: "7d", label: "Últimos 7 dias" },
              { key: "30d", label: "Últimos 30 dias" },
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={timeRange === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickFilter(filter.key)}
                disabled={loading}
                className="text-xs"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Error Type Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 flex items-center">
            Tipo de Erro:
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Todos os tipos" },
              { key: "errors", label: "Apenas erros" },
              { key: "warnings", label: "Apenas avisos" },
              { key: "critical", label: "Apenas críticos" },
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={errorType === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => handleErrorTypeFilter(filter.key)}
                disabled={loading}
                className="text-xs"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Quantity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
        {errorInfo.map((value) => (
          <Card
            className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-50"
            key={value.key}
          >
            <CardContent className="flex items-start justify-between p-4 sm:p-6 dark:text-zinc-50">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-zinc-50">
                  {value.title}
                </p>
                <div className="text-2xl font-bold text-gray-900 dark:text-zinc-50">
                  {value.value}
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {value.weeklyText}
                </p>
              </div>
              <div className="p-2">{value.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error Chart */}
      <Card className="mt-6 dark:border-zinc-700 dark:bg-zinc-900/90 py-4">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 dark:text-zinc-50">
                <TrendingUpIcon className="h-5 w-5" />
                Evolução dos Erros
              </CardTitle>
              <p className="text-sm text-muted-foreground dark:text-zinc-400">
                Visualização temporal dos erros e avisos do sistema
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {chartError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {chartError}
            </div>
          )}

          {chartLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground dark:text-zinc-400">
                Carregando dados do gráfico...
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground dark:text-zinc-400">
                Nenhum dado disponível para o período selecionado
              </div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  labelFormatter={(value) => `Horário: ${value}`}
                />

                <Line
                  type="monotone"
                  dataKey="errors"
                  stroke={chartConfig.errors.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />

                <Line
                  type="monotone"
                  dataKey="warnings"
                  stroke={chartConfig.warnings.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />

                <Line
                  type="monotone"
                  dataKey="critical"
                  stroke={chartConfig.critical.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Error Distribution Chart */}
      <Card className="mt-6 dark:border-zinc-700 dark:bg-zinc-900/90 py-4">
        <CardHeader>
          <CardTitle className="dark:text-zinc-50">
            Distribuição de Erros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {chartError}
            </div>
          )}

          {chartLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground dark:text-zinc-400">
                Carregando dados do gráfico...
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground dark:text-zinc-400">
                Nenhum dado disponível para o período selecionado
              </div>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={chartData.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  labelFormatter={(value) => `Horário: ${value}`}
                />
                <Bar
                  dataKey="errors"
                  fill={chartConfig.errors.color}
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="warnings"
                  fill={chartConfig.warnings.color}
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="critical"
                  fill={chartConfig.critical.color}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Error Types List */}
      <Card className="mt-6 dark:border-zinc-700 dark:bg-zinc-900/90 py-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-zinc-50">
            <List className="h-5 w-5" />
            Tipos de Erro
          </CardTitle>
        </CardHeader>
        <CardContent>
          {errorTypesError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {errorTypesError}
            </div>
          )}

          {errorTypesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground dark:text-zinc-400">
                Carregando tipos de erro...
              </div>
            </div>
          ) : errorTypes.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground dark:text-zinc-400">
                Nenhum tipo de erro encontrado para o período selecionado
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {errorTypes.map((errorType) => (
                <div
                  key={errorType.type}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-zinc-50">
                        {errorType.type}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          errorType.severity === "critical" ||
                          errorType.severity === "fatal"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            : errorType.severity === "warning"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                        }`}
                      >
                        {errorType.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-zinc-400">
                      <span>{errorType.count} ocorrências</span>
                      <span>
                        Última:{" "}
                        {new Date(errorType.lastOccurrence).toLocaleString(
                          "pt-BR"
                        )}
                      </span>
                    </div>
                    {errorType.examples.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">
                          Exemplos:
                        </p>
                        <div className="space-y-1">
                          {errorType.examples
                            .slice(0, 2)
                            .map((example, idx) => (
                              <p
                                key={idx}
                                className="text-xs text-gray-600 dark:text-zinc-400 bg-gray-50 dark:bg-zinc-800/50 p-2 rounded font-mono"
                              >
                                {example.length > 100
                                  ? `${example.substring(0, 100)}...`
                                  : example}
                              </p>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-gray-900 dark:text-zinc-50">
                      {errorType.count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashWrapper>
  );
}
