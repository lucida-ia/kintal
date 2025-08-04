"use client";

import { useState, useEffect } from "react";
import DashWrapper from "@/components/dashboard/dash-wrapper";
import Header from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  FileTextIcon,
  ClockIcon,
  ZapIcon,
  FileStackIcon,
  UserIcon,
  CalendarIcon,
  FilterIcon,
  TrendingUpIcon,
  DollarSignIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CrownIcon,
  StarIcon,
  ShieldIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface User {
  id: string;
  subscription: {
    plan: string;
    status: string;
  };
  usage: {
    examsThisMonth: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionBreakdown {
  trial: number;
  monthly: number;
  "semi-annual": number;
  annual: number;
  custom: number;
}

interface ApiResponse {
  success: boolean;
  data: User[];
  count: number;
  weeklyCount: number;
  subscriptionBreakdown: SubscriptionBreakdown;
  weeklySubscriptionBreakdown: SubscriptionBreakdown;
}

interface QuestionsApiResponse {
  success: boolean;
  data: {
    totalQuestions: number;
    totalQuestionsFromCount: number;
    examCount: number;
  };
  weeklyCount: number;
}

interface AnswersApiResponse {
  success: boolean;
  data: Array<{
    examId: string;
    examTitle: string;
    questionIndex: number;
    question: string;
    correctAnswer: unknown;
  }>;
  count: number;
  weeklyCount: number;
  summary: {
    totalExams: number;
    totalAnswers: number;
  };
}

interface ChartDataPoint {
  date: string;
  users: number;
  exams: number;
  questions: number;
  answers: number;
}

interface ChartApiResponse {
  success: boolean;
  data: ChartDataPoint[];
  dateRange: {
    from: string;
    to: string;
  };
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DataSeriesToggle {
  users: boolean;
  exams: boolean;
  questions: boolean;
  answers: boolean;
}

interface CostResult {
  model: string;
  type: string;
  total_cost: number;
}

interface CostData {
  totalCost: number;
  inputCost: number;
  outputCost: number;
}

export default function LucidaDashboard() {
  const [userCount, setUserCount] = useState<number | string>("...");
  const [examCount, setExamCount] = useState<number | string>("...");
  const [questionCount, setQuestionCount] = useState<number | string>("...");
  const [answerCount, setAnswerCount] = useState<number | string>("...");
  const [weeklyUserCount, setWeeklyUserCount] = useState<number | string>(
    "..."
  );
  const [weeklyExamCount, setWeeklyExamCount] = useState<number | string>(
    "..."
  );
  const [weeklyQuestionCount, setWeeklyQuestionCount] = useState<
    number | string
  >("...");
  const [weeklyAnswerCount, setWeeklyAnswerCount] = useState<number | string>(
    "..."
  );

  // Subscription breakdown state
  const [subscriptionCounts, setSubscriptionCounts] =
    useState<SubscriptionBreakdown>({
      trial: 0,
      monthly: 0,
      "semi-annual": 0,
      annual: 0,
      custom: 0,
    });
  const [weeklySubscriptionCounts, setWeeklySubscriptionCounts] =
    useState<SubscriptionBreakdown>({
      trial: 0,
      monthly: 0,
      "semi-annual": 0,
      annual: 0,
      custom: 0,
    });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(
    null
  );

  // Chart-related state
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [dataSeriesToggle, setDataSeriesToggle] = useState<DataSeriesToggle>({
    users: true,
    exams: true,
    questions: true,
    answers: true,
  });

  // Cost-related state
  const [costData, setCostData] = useState<CostData>({
    totalCost: 0,
    inputCost: 0,
    outputCost: 0,
  });
  const [costLoading, setCostLoading] = useState(false);
  const [costError, setCostError] = useState<string | null>(null);

  const buildQueryParams = (dateRange: DateRange): string => {
    const params = new URLSearchParams();
    if (dateRange.from) {
      params.append("from", dateRange.from.toISOString());
    }
    if (dateRange.to) {
      params.append("to", dateRange.to.toISOString());
    }
    return params.toString();
  };

  // Quick filter utility functions
  const getQuickFilterRange = (filterType: string): DateRange => {
    const now = new Date();
    const to = new Date(now);

    switch (filterType) {
      case "24h":
        const from24h = new Date(now);
        from24h.setHours(now.getHours() - 24);
        return { from: from24h, to };

      case "7d":
        const from7d = new Date(now);
        from7d.setDate(now.getDate() - 7);
        return { from: from7d, to };

      case "30d":
        const from30d = new Date(now);
        from30d.setDate(now.getDate() - 30);
        return { from: from30d, to };

      case "3m":
        const from3m = new Date(now);
        from3m.setMonth(now.getMonth() - 3);
        return { from: from3m, to };

      default:
        return { from: undefined, to: undefined };
    }
  };

  const handleQuickFilter = (filterType: string) => {
    const range = getQuickFilterRange(filterType);
    setDateRange(range);
    setActiveQuickFilter(filterType);
    fetchAllData(range);
  };

  const fetchUsers = async (dateRange?: DateRange) => {
    try {
      const queryParams = dateRange ? buildQueryParams(dateRange) : "";
      const url = `/api/lucida/users${queryParams ? `?${queryParams}` : ""}`;
      const response = await fetch(url);
      const data: ApiResponse = await response.json();

      if (data.success) {
        setUserCount(data.count);
        setWeeklyUserCount(data.weeklyCount);
        setSubscriptionCounts(data.subscriptionBreakdown);
        setWeeklySubscriptionCounts(data.weeklySubscriptionBreakdown);
      } else {
        setError("Failed to fetch users");
        setUserCount("Error");
        setWeeklyUserCount("Error");
        setSubscriptionCounts({
          trial: 0,
          monthly: 0,
          "semi-annual": 0,
          annual: 0,
          custom: 0,
        });
        setWeeklySubscriptionCounts({
          trial: 0,
          monthly: 0,
          "semi-annual": 0,
          annual: 0,
          custom: 0,
        });
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users");
      setUserCount("Error");
      setWeeklyUserCount("Error");
      setSubscriptionCounts({
        trial: 0,
        monthly: 0,
        "semi-annual": 0,
        annual: 0,
        custom: 0,
      });
      setWeeklySubscriptionCounts({
        trial: 0,
        monthly: 0,
        "semi-annual": 0,
        annual: 0,
        custom: 0,
      });
    }
  };

  const fetchExams = async (dateRange?: DateRange) => {
    try {
      const queryParams = dateRange ? buildQueryParams(dateRange) : "";
      const url = `/api/lucida/exams${queryParams ? `?${queryParams}` : ""}`;
      const response = await fetch(url);
      const data: ApiResponse = await response.json();

      if (data.success) {
        setExamCount(data.count);
        setWeeklyExamCount(data.weeklyCount);
      } else {
        setExamCount("Error");
        setWeeklyExamCount("Error");
      }
    } catch (err) {
      console.error("Error fetching exams:", err);
      setExamCount("Error");
      setWeeklyExamCount("Error");
    }
  };

  const fetchQuestions = async (dateRange?: DateRange) => {
    try {
      const queryParams = dateRange ? buildQueryParams(dateRange) : "";
      const url = `/api/lucida/questions${
        queryParams ? `?${queryParams}` : ""
      }`;
      const response = await fetch(url);
      const data: QuestionsApiResponse = await response.json();

      if (data.success) {
        setQuestionCount(data.data.totalQuestions);
        setWeeklyQuestionCount(data.weeklyCount);
      } else {
        setQuestionCount("Error");
        setWeeklyQuestionCount("Error");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      setQuestionCount("Error");
      setWeeklyQuestionCount("Error");
    }
  };

  const fetchAnswers = async (dateRange?: DateRange) => {
    try {
      const queryParams = dateRange ? buildQueryParams(dateRange) : "";
      const url = `/api/lucida/answers${queryParams ? `?${queryParams}` : ""}`;
      const response = await fetch(url);
      const data: AnswersApiResponse = await response.json();

      if (data.success) {
        setAnswerCount(data.count);
        setWeeklyAnswerCount(data.weeklyCount);
      } else {
        setAnswerCount("Error");
        setWeeklyAnswerCount("Error");
      }
    } catch (err) {
      console.error("Error fetching answers:", err);
      setAnswerCount("Error");
      setWeeklyAnswerCount("Error");
    }
  };

  const fetchChartData = async (dateRange?: DateRange) => {
    setChartLoading(true);
    setChartError(null);
    try {
      const queryParams = dateRange ? buildQueryParams(dateRange) : "";
      const url = `/api/lucida/chart-data${
        queryParams ? `?${queryParams}` : ""
      }`;
      const response = await fetch(url);
      const data: ChartApiResponse = await response.json();

      if (data.success) {
        // Format dates for display
        const formattedData = data.data.map((item) => ({
          ...item,
          formattedDate: format(new Date(item.date), "dd/MM", { locale: ptBR }),
        }));
        setChartData(formattedData);
      } else {
        setChartError("Failed to fetch chart data");
        setChartData([]);
      }
    } catch (err) {
      console.error("Error fetching chart data:", err);
      setChartError("Failed to fetch chart data");
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  const fetchCosts = async (dateRange?: DateRange) => {
    setCostLoading(true);
    setCostError(null);
    try {
      // Convert dateRange to unix timestamps if provided
      let startTime, endTime;
      if (dateRange?.from) {
        startTime = Math.floor(dateRange.from.getTime() / 1000);
      } else {
        // Default to 30 days ago
        startTime = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
      }

      if (dateRange?.to) {
        endTime = Math.floor(dateRange.to.getTime() / 1000);
      } else {
        // Default to now
        endTime = Math.floor(Date.now() / 1000);
      }

      const url = `/api/openai/costs?start_time=${startTime}&end_time=${endTime}`;
      const response = await fetch(url);
      const data: CostResult[] = await response.json();

      if (Array.isArray(data)) {
        // Calculate totals
        const totalCost = data.reduce((sum, item) => sum + item.total_cost, 0);
        const inputCost = data
          .filter((item) => item.type.includes("input"))
          .reduce((sum, item) => sum + item.total_cost, 0);
        const outputCost = data
          .filter((item) => item.type.includes("output"))
          .reduce((sum, item) => sum + item.total_cost, 0);

        setCostData({
          totalCost,
          inputCost,
          outputCost,
        });
      } else {
        setCostError("Failed to fetch cost data");
        setCostData({ totalCost: 0, inputCost: 0, outputCost: 0 });
      }
    } catch (err) {
      console.error("Error fetching costs:", err);
      setCostError("Failed to fetch cost data");
      setCostData({ totalCost: 0, inputCost: 0, outputCost: 0 });
    } finally {
      setCostLoading(false);
    }
  };

  const fetchAllData = async (dateRange?: DateRange) => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchUsers(dateRange),
        fetchExams(dateRange),
        fetchQuestions(dateRange),
        fetchAnswers(dateRange),
        fetchChartData(dateRange),
        fetchCosts(dateRange),
      ]);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllData(dateRange);
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [dateRange]); // Re-setup interval when dateRange changes

  const handleFilter = () => {
    setActiveQuickFilter(null); // Clear quick filter when using custom date range
    fetchAllData(dateRange);
  };

  const handleClearFilter = () => {
    setDateRange({ from: undefined, to: undefined });
    setActiveQuickFilter(null);
    fetchAllData();
  };

  const toggleDataSeries = (series: keyof DataSeriesToggle) => {
    setDataSeriesToggle((prev) => ({
      ...prev,
      [series]: !prev[series],
    }));
  };

  const formatWeeklyText = (count: number | string): string => {
    if (count === "..." || count === "Error") return count.toString();
    if (count === undefined || count === null) return "Nenhum novo essa semana";
    const numCount = Number(count);
    if (isNaN(numCount) || numCount === 0) return "Nenhum novo essa semana";
    if (numCount === 1) return "1 novo essa semana";
    return `${numCount} novos essa semana`;
  };

  const formatDateRange = (): string => {
    if (!dateRange.from) return "Selecione o período";
    if (!dateRange.to) return format(dateRange.from, "PPP", { locale: ptBR });
    return `${format(dateRange.from, "PPP", { locale: ptBR })} - ${format(
      dateRange.to,
      "PPP",
      { locale: ptBR }
    )}`;
  };

  const chartConfig = {
    users: {
      label: "Usuários",
      color: "#2563eb", // Blue
    },
    exams: {
      label: "Provas",
      color: "#dc2626", // Red
    },
    questions: {
      label: "Questões",
      color: "#16a34a", // Green
    },
    answers: {
      label: "Respostas",
      color: "#ca8a04", // Yellow/Orange
    },
  };

  const lucidaInfo = [
    {
      key: "totalUsers",
      title: "Total de Usuários",
      value: userCount,
      weeklyText: formatWeeklyText(weeklyUserCount),
      icon: (
        <UserIcon
          className="h-5 w-5"
          style={{ color: chartConfig.users.color }}
        />
      ),
    },
    {
      key: "totalExams",
      title: "Total de Provas",
      value: examCount,
      weeklyText: formatWeeklyText(weeklyExamCount),
      icon: (
        <FileTextIcon
          className="h-5 w-5"
          style={{ color: chartConfig.exams.color }}
        />
      ),
    },
    {
      key: "totalQuestions",
      title: "Total de Questões",
      value: questionCount,
      weeklyText: formatWeeklyText(weeklyQuestionCount),
      icon: (
        <FileStackIcon
          className="h-5 w-5"
          style={{ color: chartConfig.questions.color }}
        />
      ),
    },
    {
      key: "totalAnswers",
      title: "Total de Respostas",
      value: answerCount,
      weeklyText: formatWeeklyText(weeklyAnswerCount),
      icon: (
        <ZapIcon
          className="h-5 w-5"
          style={{ color: chartConfig.answers.color }}
        />
      ),
    },
  ];

  const subscriptionInfo = [
    {
      key: "trialUsers",
      title: "Usuários em Teste",
      value: subscriptionCounts.trial,
      weeklyText: formatWeeklyText(weeklySubscriptionCounts.trial),
      icon: <ShieldIcon className="h-5 w-5 text-gray-600" />,
    },
    {
      key: "monthlyUsers",
      title: "Usuários Mensais",
      value: subscriptionCounts.monthly ?? 0,
      weeklyText: formatWeeklyText(weeklySubscriptionCounts.monthly ?? 0),
      icon: <ClockIcon className="h-5 w-5 text-blue-600" />,
    },
    {
      key: "semiAnnualUsers",
      title: "Usuários Semestrais",
      value: subscriptionCounts["semi-annual"],
      weeklyText: formatWeeklyText(weeklySubscriptionCounts["semi-annual"]),
      icon: <StarIcon className="h-5 w-5 text-yellow-600" />,
    },
    {
      key: "annualUsers",
      title: "Usuários Anuais",
      value: subscriptionCounts.annual,
      weeklyText: formatWeeklyText(weeklySubscriptionCounts.annual),
      icon: <CrownIcon className="h-5 w-5 text-purple-600" />,
    },
    {
      key: "customUsers",
      title: "Usuários Personalizados",
      value: subscriptionCounts.custom,
      weeklyText: formatWeeklyText(weeklySubscriptionCounts.custom),
      icon: <UserIcon className="h-5 w-5 text-teal-600" />,
    },
  ];

  return (
    <DashWrapper>
      <Header title="Lucida" description="Tudo sobre a Lucida" />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          {error}
        </div>
      )}

      {/* Date Filter Section */}
      <div className="flex flex-col gap-4 mt-4 sm:mt-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border dark:border-zinc-700">
        {/* Quick Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 flex items-center">
            Filtros Rápidos:
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "24h", label: "Últimas 24h" },
              { key: "7d", label: "Últimos 7 dias" },
              { key: "30d", label: "Últimos 30 dias" },
              { key: "3m", label: "Últimos 3 meses" },
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={
                  activeQuickFilter === filter.key ? "default" : "outline"
                }
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

        {/* Custom Date Range Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
              Período Personalizado:
            </span>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-[300px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range) => {
                    setDateRange({
                      from: range?.from,
                      to: range?.to,
                    });
                    setActiveQuickFilter(null); // Clear quick filter when manually selecting dates
                  }}
                  numberOfMonths={2}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <div className="flex gap-2">
              <Button
                onClick={handleFilter}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <FilterIcon className="h-4 w-4" />
                {loading ? "Carregando..." : "Filtrar"}
              </Button>

              {(dateRange.from || dateRange.to || activeQuickFilter) && (
                <Button
                  variant="outline"
                  onClick={handleClearFilter}
                  disabled={loading}
                >
                  Limpar Filtro
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
        {lucidaInfo.map((value) => (
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

      {/* Subscription Breakdown Section */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          Usuários por Tipo de Assinatura
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {subscriptionInfo.map((value) => (
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
      </div>

      {/* Chart Section */}
      <Card className="mt-6 dark:border-zinc-700 dark:bg-zinc-900/90 py-4">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 dark:text-zinc-50">
                <TrendingUpIcon className="h-5 w-5" />
                Evolução dos Dados
              </CardTitle>
              <p className="text-sm text-muted-foreground dark:text-zinc-400">
                Visualização temporal dos dados da Lucida
              </p>
            </div>

            {/* Data Series Toggle Controls */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(chartConfig).map(([key, config]) => (
                <Button
                  key={key}
                  variant={
                    dataSeriesToggle[key as keyof DataSeriesToggle]
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    toggleDataSeries(key as keyof DataSeriesToggle)
                  }
                  className="text-xs"
                >
                  <div
                    className="w-2 h-2 rounded-full mr-2"
                    style={{
                      backgroundColor: dataSeriesToggle[
                        key as keyof DataSeriesToggle
                      ]
                        ? config.color
                        : "transparent",
                    }}
                  />
                  {config.label}
                </Button>
              ))}
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
                  dataKey="formattedDate"
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
                  labelFormatter={(value) => `Data: ${value}`}
                />

                {dataSeriesToggle.users && (
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke={chartConfig.users.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls={false}
                  />
                )}

                {dataSeriesToggle.exams && (
                  <Line
                    type="monotone"
                    dataKey="exams"
                    stroke={chartConfig.exams.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls={false}
                  />
                )}

                {dataSeriesToggle.questions && (
                  <Line
                    type="monotone"
                    dataKey="questions"
                    stroke={chartConfig.questions.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls={false}
                  />
                )}

                {dataSeriesToggle.answers && (
                  <Line
                    type="monotone"
                    dataKey="answers"
                    stroke={chartConfig.answers.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls={false}
                  />
                )}
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* OpenAI Costs Section */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
          Custos OpenAI
        </h3>

        {costError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {costError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-50">
            <CardContent className="flex items-start justify-between p-4 sm:p-6 dark:text-zinc-50">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-zinc-50">
                  Custo Total
                </p>
                <div className="text-2xl font-bold text-gray-900 dark:text-zinc-50">
                  {costLoading ? "..." : `R$ ${costData.totalCost.toFixed(4)}`}
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Custo total acumulado
                </p>
              </div>
              <div className="p-2">
                <DollarSignIcon className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-50">
            <CardContent className="flex items-start justify-between p-4 sm:p-6 dark:text-zinc-50">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-zinc-50">
                  Custo de Input
                </p>
                <div className="text-2xl font-bold text-gray-900 dark:text-zinc-50">
                  {costLoading ? "..." : `R$ ${costData.inputCost.toFixed(4)}`}
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Tokens de entrada
                </p>
              </div>
              <div className="p-2">
                <ArrowDownIcon className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-50">
            <CardContent className="flex items-start justify-between p-4 sm:p-6 dark:text-zinc-50">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-zinc-50">
                  Custo de Output
                </p>
                <div className="text-2xl font-bold text-gray-900 dark:text-zinc-50">
                  {costLoading ? "..." : `R$ ${costData.outputCost.toFixed(4)}`}
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Tokens de saída
                </p>
              </div>
              <div className="p-2">
                <ArrowUpIcon className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashWrapper>
  );
}
