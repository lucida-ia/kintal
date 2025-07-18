"use client";

import { useState, useEffect } from "react";
import DashWrapper from "@/components/dashboard/dash-wrapper";
import Header from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileTextIcon,
  ClockIcon,
  ZapIcon,
  FileStackIcon,
  UserIcon,
} from "lucide-react";

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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/lucida/users");
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

    const fetchExams = async () => {
      try {
        const response = await fetch("/api/lucida/exams");
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

    const fetchQuestions = async () => {
      try {
        const response = await fetch("/api/lucida/questions");
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

    const fetchAnswers = async () => {
      try {
        const response = await fetch("/api/lucida/answers");
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

    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetchUsers(),
          fetchExams(),
          fetchQuestions(),
          fetchAnswers(),
        ]);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const formatWeeklyText = (count: number | string): string => {
    if (count === "..." || count === "Error") return count.toString();
    const numCount = Number(count);
    if (numCount === 0) return "Nenhum novo essa semana";
    if (numCount === 1) return "1 novo essa semana";
    return `${numCount} novos essa semana`;
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
