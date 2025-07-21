"use client";

import { useState } from "react";
import DashWrapper from "@/components/dashboard/dash-wrapper";
import Header from "@/components/dashboard/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SearchIcon,
  UserIcon,
  CreditCardIcon,
  BookOpenIcon,
  TargetIcon,
  CalendarIcon,
  ClockIcon,
  TrendingUpIcon,
  MailIcon,
  ActivityIcon,
  FileTextIcon,
  AwardIcon,
  LoaderIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
} from "lucide-react";

interface User {
  id: string;
  subscription: {
    plan: string;
    status: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd: boolean;
    trialEnd?: string;
  };
  usage: {
    examsThisMonth: number;
    examsThisMonthResetDate: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Exam {
  _id: string;
  title: string;
  classId: string;
  userId: string;
  description?: string;
  questionCount: number;
  duration: number;
  difficulty: string;
  type: object;
  shareId?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Result {
  _id: string;
  examId: string;
  classId: string;
  email: string;
  score: number;
  percentage: number;
  examTitle: string;
  examQuestionCount: number;
  createdAt: string;
}

interface SearchResponse {
  success: boolean;
  data?: {
    user: User;
    exams: Exam[];
    results: Result[];
    counts: {
      exams: number;
      results: number;
    };
  } | null;
  message?: string;
  error?: string;
}

export default function SearchUser() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResult(null);

    try {
      const response = await fetch(
        `/api/lucida/users/search?q=${encodeURIComponent(searchQuery.trim())}`
      );

      const data: SearchResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search user");
      }

      setSearchResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const toggleExamExpansion = (examId: string) => {
    const newExpanded = new Set(expandedExams);
    if (newExpanded.has(examId)) {
      newExpanded.delete(examId);
    } else {
      newExpanded.add(examId);
    }
    setExpandedExams(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "cancelled":
      case "canceled":
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircleIcon className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
      case "fácil":
        return "text-green-600 dark:text-green-400";
      case "medium":
      case "médio":
        return "text-yellow-600 dark:text-yellow-400";
      case "hard":
      case "difícil":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getResultsForExam = (examId: string) => {
    return (
      searchResult?.data?.results.filter(
        (result) => result.examId === examId
      ) || []
    );
  };

  const convertToCSV = (data: Result[]) => {
    if (!data || data.length === 0) return "";

    const headers = [
      "Email",
      "Titulo do Exame",
      "Pontuacao",
      "Total de Questoes",
      "Percentual",
      "Data de Realizacao",
      "ID do Exame",
      "ID da Classe",
    ];

    const csvContent = [
      headers.join(","),
      ...data.map((result) =>
        [
          `"${result.email}"`,
          `"${result.examTitle}"`,
          result.score,
          result.examQuestionCount,
          (result.percentage * 100).toFixed(2) + "%",
          `"${formatDate(result.createdAt)}"`,
          result.examId,
          result.classId,
        ].join(",")
      ),
    ].join("\n");

    return csvContent;
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportAllResults = () => {
    if (
      !searchResult?.data?.results ||
      searchResult.data.results.length === 0
    ) {
      setError("Nenhum resultado para exportar");
      return;
    }

    const csvContent = convertToCSV(searchResult.data.results);
    const filename = `resultados_usuario_${searchResult.data.user.id}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    downloadCSV(csvContent, filename);
  };

  const exportExamResults = (examId: string, examTitle: string) => {
    const examResults = getResultsForExam(examId);

    if (examResults.length === 0) {
      setError("Nenhum resultado encontrado para este exame");
      return;
    }

    const csvContent = convertToCSV(examResults);
    const sanitizedTitle = examTitle.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `resultados_${sanitizedTitle}_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    downloadCSV(csvContent, filename);
  };

  return (
    <DashWrapper>
      <Header
        title="Busca de Usuário"
        description="Pesquise e visualize informações detalhadas de usuários"
      />

      <div className="space-y-6 mt-4">
        {/* Search Section */}
        <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90 py-8">
          <CardHeader>
            <CardTitle className="flex items-center w-full gap-2 dark:text-zinc-50">
              <SearchIcon className="h-5 w-5" />
              Pesquisar Usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Buscar por ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
                className="min-w-[120px] flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <SearchIcon className="h-4 w-4" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircleIcon className="h-4 w-4" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResult && (
          <>
            {searchResult.data ? (
              <div className="space-y-6">
                {/* User Information Card */}
                <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90 py-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-zinc-50">
                      <UserIcon className="h-5 w-5" />
                      Informações do Usuário
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                          <UserIcon className="h-4 w-4" />
                          ID
                        </div>
                        <p className="text-base font-mono bg-gray-50 dark:bg-zinc-800 px-3 py-2 rounded-md">
                          {searchResult.data.user.id}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                          <CreditCardIcon className="h-4 w-4" />
                          Plano
                        </div>
                        <p className="text-base capitalize px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md font-medium">
                          {searchResult.data.user.subscription.plan}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                          <ActivityIcon className="h-4 w-4" />
                          Status da Assinatura
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 dark:bg-zinc-800">
                          {getStatusIcon(
                            searchResult.data.user.subscription.status
                          )}
                          <span className="capitalize font-medium">
                            {searchResult.data.user.subscription.status}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                          <TrendingUpIcon className="h-4 w-4" />
                          Exames nos Últimos 30 Dias
                        </div>
                        <p className="text-base font-bold text-green-600 dark:text-green-400 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                          {searchResult.data.user.usage.examsThisMonth}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                          <CalendarIcon className="h-4 w-4" />
                          Cadastrado em
                        </div>
                        <p className="text-sm text-gray-600 dark:text-zinc-400 px-3 py-2 bg-gray-50 dark:bg-zinc-800 rounded-md">
                          {formatDate(searchResult.data.user.createdAt)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                          <ClockIcon className="h-4 w-4" />
                          Última Atualização
                        </div>
                        <p className="text-sm text-gray-600 dark:text-zinc-400 px-3 py-2 bg-gray-50 dark:bg-zinc-800 rounded-md">
                          {formatDate(searchResult.data.user.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90">
                    <CardContent className="flex items-start justify-between p-6">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                          Total de Exames
                        </p>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {searchResult.data.counts.exams}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-500">
                          Criados pelo usuário
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <FileTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90">
                    <CardContent className="flex items-start justify-between p-6">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                          Total de Resultados
                        </p>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {searchResult.data.counts.results}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-500">
                          Respostas registradas
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <AwardIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Export Section */}
                {searchResult.data.counts.results > 0 && (
                  <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-50 mb-1">
                            Exportar Dados
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-zinc-400">
                            Baixe todos os resultados deste usuário em formato
                            CSV
                          </p>
                        </div>
                        <Button
                          onClick={exportAllResults}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                        >
                          <DownloadIcon className="h-4 w-4" />
                          <span className="sm:hidden">Exportar Todos</span>
                          <span className="hidden sm:inline">
                            Exportar Todos os Resultados
                          </span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Exams Table with Nested Results */}
                {searchResult.data.exams.length > 0 && (
                  <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90 py-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 dark:text-zinc-50">
                        <BookOpenIcon className="h-5 w-5" />
                        Exames do Usuário ({searchResult.data.exams.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {searchResult.data.exams.map((exam) => {
                          const examResults = getResultsForExam(exam._id);
                          const isExpanded = expandedExams.has(exam._id);

                          return (
                            <div
                              key={exam._id}
                              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                            >
                              {/* Main Exam Row */}
                              <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800/70 transition-all duration-200">
                                {/* Mobile Layout */}
                                <div className="block md:hidden">
                                  <div className="flex items-start gap-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        toggleExamExpansion(exam._id)
                                      }
                                      className="p-1 h-auto hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors duration-200 mt-1"
                                    >
                                      <div
                                        className={`transform transition-transform duration-200 ${
                                          isExpanded ? "rotate-90" : "rotate-0"
                                        }`}
                                      >
                                        <ChevronRightIcon className="h-4 w-4" />
                                      </div>
                                    </Button>
                                    <div className="flex-1 space-y-3">
                                      <div>
                                        <h4 className="font-medium text-base">
                                          {exam.title}
                                        </h4>
                                        {exam.description && (
                                          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                                            {exam.description}
                                          </p>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <span className="text-gray-500 dark:text-zinc-400">
                                            Questões:
                                          </span>
                                          <span className="ml-1 font-medium">
                                            {exam.questionCount}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 dark:text-zinc-400">
                                            Duração:
                                          </span>
                                          <span className="ml-1 font-medium">
                                            {exam.duration} min
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 dark:text-zinc-400">
                                            Dificuldade:
                                          </span>
                                          <span
                                            className={`ml-1 capitalize font-medium ${getDifficultyColor(
                                              exam.difficulty
                                            )}`}
                                          >
                                            {exam.difficulty}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 dark:text-zinc-400">
                                            Resultados:
                                          </span>
                                          <span className="ml-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                            {examResults.length}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="text-xs text-gray-500 dark:text-zinc-400">
                                        Criado em: {formatDate(exam.createdAt)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Desktop Layout */}
                                <div className="hidden md:grid grid-cols-12 gap-3 items-center">
                                  <div className="col-span-5">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          toggleExamExpansion(exam._id)
                                        }
                                        className="p-1 h-auto hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors duration-200"
                                      >
                                        <div
                                          className={`transform transition-transform duration-200 ${
                                            isExpanded
                                              ? "rotate-90"
                                              : "rotate-0"
                                          }`}
                                        >
                                          <ChevronRightIcon className="h-4 w-4" />
                                        </div>
                                      </Button>
                                      <div>
                                        <p className="font-medium">
                                          {exam.title}
                                        </p>
                                        {exam.description && (
                                          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                                            {exam.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-span-1 text-center font-medium">
                                    {exam.questionCount}
                                  </div>
                                  <div className="col-span-1 text-center">
                                    {exam.duration} min
                                  </div>
                                  <div className="col-span-1 text-center">
                                    <span
                                      className={`capitalize font-medium ${getDifficultyColor(
                                        exam.difficulty
                                      )}`}
                                    >
                                      {exam.difficulty}
                                    </span>
                                  </div>
                                  <div className="col-span-1 text-center">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                      {examResults.length}
                                    </span>
                                  </div>
                                  <div className="col-span-3 text-sm text-gray-600 dark:text-zinc-400">
                                    {formatDate(exam.createdAt)}
                                  </div>
                                </div>
                              </div>

                              {/* Nested Results Table */}
                              {isExpanded && (
                                <div className="p-4 bg-white dark:bg-zinc-900/50 border-t">
                                  {examResults.length > 0 ? (
                                    <div>
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <TargetIcon className="h-4 w-4 text-gray-600 dark:text-zinc-400" />
                                          <h4 className="font-medium text-gray-700 dark:text-zinc-300">
                                            Resultados ({examResults.length})
                                          </h4>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            exportExamResults(
                                              exam._id,
                                              exam.title
                                            )
                                          }
                                          className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20"
                                        >
                                          <DownloadIcon className="h-3 w-3" />
                                          Exportar
                                        </Button>
                                      </div>

                                      {/* Mobile Results Layout */}
                                      <div className="block md:hidden space-y-3">
                                        {examResults.map((result) => (
                                          <div
                                            key={result._id}
                                            className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3"
                                          >
                                            <div className="space-y-2">
                                              <div>
                                                <span className="text-xs text-gray-500 dark:text-zinc-400">
                                                  Email:
                                                </span>
                                                <p className="font-mono text-sm break-all">
                                                  {result.email}
                                                </p>
                                              </div>
                                              <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div>
                                                  <span className="text-xs text-gray-500 dark:text-zinc-400">
                                                    Pontuação:
                                                  </span>
                                                  <p className="font-medium">
                                                    {result.score}/
                                                    {result.examQuestionCount}
                                                  </p>
                                                </div>
                                                <div>
                                                  <span className="text-xs text-gray-500 dark:text-zinc-400">
                                                    Percentual:
                                                  </span>
                                                  <p
                                                    className={`font-bold ${getPercentageColor(
                                                      result.percentage
                                                    )}`}
                                                  >
                                                    {(
                                                      result.percentage * 100
                                                    ).toFixed(1)}
                                                    %
                                                  </p>
                                                </div>
                                              </div>
                                              <div>
                                                <span className="text-xs text-gray-500 dark:text-zinc-400">
                                                  Data:
                                                </span>
                                                <p className="text-sm">
                                                  {formatDate(result.createdAt)}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Desktop Results Table */}
                                      <div className="hidden md:block">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Email</TableHead>
                                              <TableHead className="text-center">
                                                Pontuação
                                              </TableHead>
                                              <TableHead className="text-center">
                                                Percentual
                                              </TableHead>
                                              <TableHead>Data</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {examResults.map((result) => (
                                              <TableRow
                                                key={result._id}
                                                className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors duration-150"
                                              >
                                                <TableCell className="font-mono text-sm">
                                                  {result.email}
                                                </TableCell>
                                                <TableCell className="text-center font-medium">
                                                  {result.score}/
                                                  {result.examQuestionCount}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                  <span
                                                    className={`font-bold ${getPercentageColor(
                                                      result.percentage
                                                    )}`}
                                                  >
                                                    {(
                                                      result.percentage * 100
                                                    ).toFixed(1)}
                                                    %
                                                  </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600 dark:text-zinc-400">
                                                  {formatDate(result.createdAt)}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-6">
                                      <p className="text-gray-500 dark:text-zinc-400 text-sm">
                                        Nenhum resultado encontrado para este
                                        exame
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90">
                <CardContent className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-full">
                      <SearchIcon className="h-8 w-8 text-gray-400 dark:text-zinc-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-50 mb-2">
                        Nenhum usuário encontrado
                      </h3>
                      <p className="text-gray-500 dark:text-zinc-400">
                        {searchResult.message || "Tente uma busca diferente."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashWrapper>
  );
}
