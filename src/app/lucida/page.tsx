"use client";

import { useState, useEffect } from "react";
import DashWrapper from "@/components/dashboard/dash-wrapper";
import Header from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FileTextIcon,
  ClockIcon,
  ZapIcon,
  FileStackIcon,
  UserIcon,
  CalendarIcon,
  FilterIcon,
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

interface ApiResponse {
  success: boolean;
  data: User[];
  count: number;
  weeklyCount: number;
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

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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

  const fetchUsers = async (dateRange?: DateRange) => {
    try {
      const queryParams = dateRange ? buildQueryParams(dateRange) : "";
      const url = `/api/lucida/users${queryParams ? `?${queryParams}` : ""}`;
      const response = await fetch(url);
      const data: ApiResponse = await response.json();

      if (data.success) {
        setUserCount(data.count);
        setWeeklyUserCount(data.weeklyCount);
      } else {
        setError("Failed to fetch users");
        setUserCount("Error");
        setWeeklyUserCount("Error");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users");
      setUserCount("Error");
      setWeeklyUserCount("Error");
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

  const fetchAllData = async (dateRange?: DateRange) => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchUsers(dateRange),
        fetchExams(dateRange),
        fetchQuestions(dateRange),
        fetchAnswers(dateRange),
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

  const handleFilter = () => {
    fetchAllData(dateRange);
  };

  const handleClearFilter = () => {
    setDateRange({ from: undefined, to: undefined });
    fetchAllData();
  };

  const formatWeeklyText = (count: number | string): string => {
    if (count === "..." || count === "Error") return count.toString();
    const numCount = Number(count);
    if (numCount === 0) return "Nenhum novo essa semana";
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

  const lucidaInfo = [
    {
      key: "totalUsers",
      title: "Total de Usuários",
      value: userCount,
      weeklyText: formatWeeklyText(weeklyUserCount),
      icon: <UserIcon className="h-5 w-5 text-gray-400" />,
    },
    {
      key: "totalExams",
      title: "Total de Provas",
      value: examCount,
      weeklyText: formatWeeklyText(weeklyExamCount),
      icon: <FileTextIcon className="h-5 w-5 text-gray-400" />,
    },
    {
      key: "totalQuestions",
      title: "Total de Questões",
      value: questionCount,
      weeklyText: formatWeeklyText(weeklyQuestionCount),
      icon: <FileStackIcon className="h-5 w-5 text-gray-400" />,
    },
    {
      key: "totalAnswers",
      title: "Total de Respostas",
      value: answerCount,
      weeklyText: formatWeeklyText(weeklyAnswerCount),
      icon: <ZapIcon className="h-5 w-5 text-gray-400" />,
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mt-4 sm:mt-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border dark:border-zinc-700">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
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

            {(dateRange.from || dateRange.to) && (
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
    </DashWrapper>
  );
}
