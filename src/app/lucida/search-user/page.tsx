"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SearchIcon,
  UserIcon,
  CreditCardIcon,
  BookOpenIcon,
  TargetIcon,
  PlugIcon,
  CalendarIcon,
  ClockIcon,
  ActivityIcon,
  FileTextIcon,
  AwardIcon,
  LoaderIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  DownloadIcon,
  HistoryIcon,
  XIcon,
  TrashIcon,
  Trash2Icon,
  EditIcon,
  SaveIcon,
  FilterIcon,
} from "lucide-react";
import { RecentSearchManager, type RecentSearch } from "@/lib/recentSearches";

interface User {
  id: string;
  email: string;
  displayName: string;
  integrationId?: string | null;
  integratPartnerToken?: string | null;
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
    examsThisPeriod: number;
    examsThisPeriodResetDate: string;
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
    searchMetadata: {
      query: string;
      searchedAt: string;
      isExactMatch: boolean;
    };
  } | null;
  message?: string;
  error?: string;
}

interface IntegrationOption {
  _id: string;
  integrationId: string;
  integrationName: string;
}

export default function SearchUser() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set());
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [isEditingUsage, setIsEditingUsage] = useState(false);
  const [selectedUsage, setSelectedUsage] = useState("");
  const [isUpdatingUsage, setIsUpdatingUsage] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationOption[]>([]);
  const [isLoadingIntegrations, setIsLoadingIntegrations] = useState(false);
  const [isEditingIntegration, setIsEditingIntegration] = useState(false);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState("");
  const [isUpdatingIntegration, setIsUpdatingIntegration] = useState(false);
  const [isEditingIntegratPartnerToken, setIsEditingIntegratPartnerToken] =
    useState(false);
  const [selectedIntegratPartnerToken, setSelectedIntegratPartnerToken] =
    useState("");
  const [isUpdatingIntegratPartnerToken, setIsUpdatingIntegratPartnerToken] =
    useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<{
    id: string;
    email: string;
    examTitle: string;
  } | null>(null);
  const [isDeletingResult, setIsDeletingResult] = useState(false);

  // Load recent searches on component mount
  useEffect(() => {
    const loadRecentSearches = () => {
      try {
        const searches = RecentSearchManager.getRecentSearches();
        setRecentSearches(searches);
      } catch (error) {
        console.error("Failed to load recent searches:", error);
      }
    };

    loadRecentSearches();
  }, []);

  // Load integrations for the Integration select
  useEffect(() => {
    const loadIntegrations = async () => {
      setIsLoadingIntegrations(true);
      try {
        const response = await fetch("/api/lucida/integrations");
        const data = await response.json();
        if (!response.ok || !data?.success) {
          throw new Error(data?.error || "Failed to fetch integrations");
        }
        setIntegrations((data?.data as IntegrationOption[]) || []);
      } catch (err) {
        console.error("Failed to load integrations:", err);
        setIntegrations([]);
      } finally {
        setIsLoadingIntegrations(false);
      }
    };

    loadIntegrations();
  }, []);

  // Handle URL search parameter
  useEffect(() => {
    const queryParam = searchParams.get("q");
    if (queryParam) {
      setSearchQuery(queryParam);
      // Auto-search when coming from URL parameter
      const performAutoSearch = async () => {
        setIsLoading(true);
        setError(null);
        setSearchResult(null);

        try {
          const response = await fetch(
            `/api/lucida/users/search?q=${encodeURIComponent(queryParam)}`
          );

          const data: SearchResponse = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to search user");
          }

          setSearchResult(data);

          // Add to recent searches if search was successful and returned data
          if (data.success && data.data) {
            RecentSearchManager.addRecentSearch(
              queryParam,
              data.data.user.email
            );
            // Refresh recent searches
            setRecentSearches(RecentSearchManager.getRecentSearches());
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
          setIsLoading(false);
        }
      };

      performAutoSearch();
    }
  }, [searchParams]);

  // Click outside handler to close recent searches dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".recent-searches-container")) {
        setShowRecentSearches(false);
      }
    };

    if (showRecentSearches) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showRecentSearches]);

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

      // Add to recent searches if search was successful and returned data
      if (data.success && data.data) {
        RecentSearchManager.addRecentSearch(
          searchQuery.trim(),
          data.data.user.email
        );
        // Refresh recent searches
        setRecentSearches(RecentSearchManager.getRecentSearches());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecentSearchClick = async (recentSearch: RecentSearch) => {
    setSearchQuery(recentSearch.query);
    setShowRecentSearches(false);
    setError(null);

    // Perform the search automatically
    if (!recentSearch.query.trim()) return;

    setIsLoading(true);
    setSearchResult(null);

    try {
      const response = await fetch(
        `/api/lucida/users/search?q=${encodeURIComponent(
          recentSearch.query.trim()
        )}`
      );

      const data: SearchResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search user");
      }

      setSearchResult(data);

      // Update the recent search timestamp
      if (data.success && data.data) {
        RecentSearchManager.addRecentSearch(
          recentSearch.query.trim(),
          data.data.user.email
        );
        setRecentSearches(RecentSearchManager.getRecentSearches());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveRecentSearch = (searchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    RecentSearchManager.removeRecentSearch(searchId);
    setRecentSearches(RecentSearchManager.getRecentSearches());
  };

  const handleClearRecentSearches = () => {
    RecentSearchManager.clearRecentSearches();
    setRecentSearches([]);
  };

  const handleEditPlan = () => {
    if (searchResult?.data?.user) {
      setSelectedPlan(searchResult.data.user.subscription.plan);
      setIsEditingPlan(true);
    }
  };

  const handleCancelEditPlan = () => {
    setIsEditingPlan(false);
    setSelectedPlan("");
  };

  const handleEditUsage = () => {
    if (searchResult?.data?.user) {
      setSelectedUsage(searchResult.data.user.usage.examsThisPeriod.toString());
      setIsEditingUsage(true);
    }
  };

  const handleCancelEditUsage = () => {
    setIsEditingUsage(false);
    setSelectedUsage("");
  };

  const handleEditIntegration = () => {
    if (searchResult?.data?.user) {
      setSelectedIntegrationId(searchResult.data.user.integrationId ?? "");
      setIsEditingIntegration(true);
    }
  };

  const handleCancelEditIntegration = () => {
    setIsEditingIntegration(false);
    setSelectedIntegrationId("");
  };

  const handleEditIntegratPartnerToken = () => {
    if (searchResult?.data?.user) {
      setSelectedIntegratPartnerToken(
        searchResult.data.user.integratPartnerToken ?? ""
      );
      setIsEditingIntegratPartnerToken(true);
    }
  };

  const handleCancelEditIntegratPartnerToken = () => {
    setIsEditingIntegratPartnerToken(false);
    setSelectedIntegratPartnerToken("");
  };

  const handleUpdateIntegratPartnerToken = async () => {
    if (!searchResult?.data?.user) return;

    setIsUpdatingIntegratPartnerToken(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/lucida/users/${searchResult.data.user.id}/integrat-partner-token`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            integratPartnerToken: selectedIntegratPartnerToken,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update Integrat Partner Token");
      }

      const normalized =
        selectedIntegratPartnerToken.trim() === ""
          ? null
          : selectedIntegratPartnerToken.trim();

      setSearchResult((prev) => {
        if (!prev?.data) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            user: {
              ...prev.data.user,
              integratPartnerToken: normalized,
            },
          },
        };
      });

      setIsEditingIntegratPartnerToken(false);
      setSelectedIntegratPartnerToken("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while updating the Integrat Partner Token"
      );
    } finally {
      setIsUpdatingIntegratPartnerToken(false);
    }
  };

  const handleUpdateIntegration = async () => {
    if (!searchResult?.data?.user || !selectedIntegrationId) return;

    setIsUpdatingIntegration(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/lucida/users/${searchResult.data.user.id}/integration`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ integrationId: selectedIntegrationId }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update integration");
      }

      setSearchResult((prev) => {
        if (!prev?.data) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            user: {
              ...prev.data.user,
              integrationId: selectedIntegrationId,
            },
          },
        };
      });

      setIsEditingIntegration(false);
      setSelectedIntegrationId("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while updating the integration"
      );
    } finally {
      setIsUpdatingIntegration(false);
    }
  };

  const handleRemoveIntegration = async () => {
    if (!searchResult?.data?.user) return;

    setIsUpdatingIntegration(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/lucida/users/${searchResult.data.user.id}/integration`,
        { method: "DELETE" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to remove integration");
      }

      setSearchResult((prev) => {
        if (!prev?.data) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            user: {
              ...prev.data.user,
              integrationId: null,
            },
          },
        };
      });

      setIsEditingIntegration(false);
      setSelectedIntegrationId("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while removing the integration"
      );
    } finally {
      setIsUpdatingIntegration(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!searchResult?.data?.user || !selectedPlan) return;

    setIsUpdatingPlan(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/lucida/users/${searchResult.data.user.id}/plan`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plan: selectedPlan }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update plan");
      }

      // Update the local state with the new plan
      setSearchResult((prev) => {
        if (!prev?.data) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            user: {
              ...prev.data.user,
              subscription: {
                ...prev.data.user.subscription,
                plan: selectedPlan,
              },
            },
          },
        };
      });

      setIsEditingPlan(false);
      setSelectedPlan("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while updating the plan"
      );
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleUpdateUsage = async () => {
    if (!searchResult?.data?.user || !selectedUsage) return;

    setIsUpdatingUsage(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/lucida/users/${searchResult.data.user.id}/usage`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ examsThisPeriod: parseInt(selectedUsage) }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update usage");
      }

      // Update the local state with the new usage
      setSearchResult((prev) => {
        if (!prev?.data) return prev;
        const newState = {
          ...prev,
          data: {
            ...prev.data,
            user: {
              ...prev.data.user,
              usage: {
                ...prev.data.user.usage,
                examsThisPeriod: parseInt(selectedUsage),
              },
            },
          },
        };
        return newState;
      });

      setIsEditingUsage(false);
      setSelectedUsage("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while updating the usage"
      );
    } finally {
      setIsUpdatingUsage(false);
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

  const filterResultsByDateRange = (results: Result[]) => {
    if (!dateRange.from && !dateRange.to) {
      return results;
    }

    return results.filter((result) => {
      const resultDate = new Date(result.createdAt);

      if (dateRange.from && dateRange.to) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return resultDate >= fromDate && resultDate <= toDate;
      } else if (dateRange.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        return resultDate >= fromDate;
      } else if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        return resultDate <= toDate;
      }

      return true;
    });
  };

  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined });
  };

  const handleDeleteResult = (
    resultId: string,
    email: string,
    examTitle: string
  ) => {
    setResultToDelete({ id: resultId, email, examTitle });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteResult = async () => {
    if (!resultToDelete) return;

    setIsDeletingResult(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/lucida/answers?id=${encodeURIComponent(resultToDelete.id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete result");
      }

      // Update the local state to remove the deleted result
      setSearchResult((prev) => {
        if (!prev?.data) return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            results: prev.data.results.filter(
              (r) => r._id !== resultToDelete.id
            ),
            counts: {
              ...prev.data.counts,
              results: prev.data.counts.results - 1,
            },
          },
        };
      });

      setDeleteDialogOpen(false);
      setResultToDelete(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while deleting the result"
      );
    } finally {
      setIsDeletingResult(false);
    }
  };

  const cancelDeleteResult = () => {
    setDeleteDialogOpen(false);
    setResultToDelete(null);
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

    const filteredResults = filterResultsByDateRange(searchResult.data.results);

    if (filteredResults.length === 0) {
      setError("Nenhum resultado encontrado no período selecionado");
      return;
    }

    // Yield a frame to ensure any open popovers unmount
    requestAnimationFrame(() => {
      if (!searchResult?.data) return;

      const csvContent = convertToCSV(filteredResults);
      const dateRangeStr =
        dateRange.from || dateRange.to
          ? `_${
              dateRange.from
                ? new Date(dateRange.from).toISOString().split("T")[0]
                : "inicio"
            }_a_${
              dateRange.to
                ? new Date(dateRange.to).toISOString().split("T")[0]
                : "fim"
            }`
          : "";
      const filename = `resultados_usuario_${
        searchResult.data.user.id
      }${dateRangeStr}_${new Date().toISOString().split("T")[0]}.csv`;
      downloadCSV(csvContent, filename);
    });
  };

  const exportExamResults = (examId: string, examTitle: string) => {
    const examResults = getResultsForExam(examId);

    if (examResults.length === 0) {
      setError("Nenhum resultado encontrado para este exame");
      return;
    }

    const filteredResults = filterResultsByDateRange(examResults);

    if (filteredResults.length === 0) {
      setError("Nenhum resultado encontrado no período selecionado");
      return;
    }

    // Yield a frame to ensure any open popovers unmount
    requestAnimationFrame(() => {
      const csvContent = convertToCSV(filteredResults);
      const sanitizedTitle = examTitle.replace(/[^a-zA-Z0-9]/g, "_");
      const dateRangeStr =
        dateRange.from || dateRange.to
          ? `_${
              dateRange.from
                ? new Date(dateRange.from).toISOString().split("T")[0]
                : "inicio"
            }_a_${
              dateRange.to
                ? new Date(dateRange.to).toISOString().split("T")[0]
                : "fim"
            }`
          : "";
      const filename = `resultados_${sanitizedTitle}${dateRangeStr}_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      downloadCSV(csvContent, filename);
    });
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
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative recent-searches-container">
                  <Input
                    placeholder="Buscar por Email/ID"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() => setShowRecentSearches(true)}
                    className="flex-1"
                    disabled={isLoading}
                  />

                  {/* Recent Searches Dropdown */}
                  {showRecentSearches && recentSearches.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-3 border-b border-gray-200 dark:border-zinc-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <HistoryIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                              Buscas Recentes
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleClearRecentSearches}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowRecentSearches(false)}
                              className="h-6 w-6 p-0 text-gray-500"
                            >
                              <XIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="py-1">
                        {recentSearches.map((search) => (
                          <div
                            key={search.id}
                            className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
                            onClick={() => handleRecentSearchClick(search)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
                                {search.userEmail}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-zinc-400">
                                Pesquisado em:{" "}
                                {new Date(search.searchedAt).toLocaleDateString(
                                  "pt-BR",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) =>
                                handleRemoveRecentSearch(search.id, e)
                              }
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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

              {/* Recent Searches Quick Access (when not focused) */}
              {!showRecentSearches && recentSearches.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                    <HistoryIcon className="h-3 w-3" />
                    Recentes:
                  </span>
                  {recentSearches.slice(0, 3).map((search) => (
                    <Button
                      key={search.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecentSearchClick(search)}
                      className="h-7 px-2 text-xs"
                    >
                      {search.userEmail.length > 20
                        ? `${search.userEmail.substring(0, 20)}...`
                        : search.userEmail}
                    </Button>
                  ))}
                  {recentSearches.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRecentSearches(true)}
                      className="h-7 px-2 text-xs text-blue-600 dark:text-blue-400"
                    >
                      +{recentSearches.length - 3} mais
                    </Button>
                  )}
                </div>
              )}
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
                      Informações do Usuário
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {/* Basic User Information */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                          <UserIcon className="h-5 w-5" />
                          Informações Básicas
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                              ID do Usuário
                            </div>
                            <p className="text-base font-mono bg-gray-50 dark:bg-zinc-800 px-3 py-2 rounded-md">
                              {searchResult.data.user.id}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                              Email
                            </div>
                            <p className="text-base font-mono bg-gray-50 dark:bg-zinc-800 px-3 py-2 rounded-md">
                              {searchResult.data.user.email}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                              Nome de Usuário
                            </div>
                            <p className="text-base bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-md font-medium">
                              {searchResult.data.user.displayName}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Integration */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                          <PlugIcon className="h-5 w-5" />
                          Integração
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                                Integração vinculada
                              </div>
                              {!isEditingIntegration && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleEditIntegration}
                                  className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                                  disabled={isUpdatingIntegration}
                                  title="Editar integração"
                                >
                                  <EditIcon className="h-3 w-3" />
                                </Button>
                              )}
                            </div>

                            {isEditingIntegration ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={selectedIntegrationId}
                                  onChange={(e) =>
                                    setSelectedIntegrationId(e.target.value)
                                  }
                                  disabled={isUpdatingIntegration}
                                  className="flex-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="">
                                    {isLoadingIntegrations
                                      ? "Carregando integrações..."
                                      : "Selecione uma integração"}
                                  </option>
                                  {integrations.map((it) => (
                                    <option
                                      key={it.integrationId}
                                      value={it.integrationId}
                                    >
                                      {it.integrationName}
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleUpdateIntegration}
                                  disabled={
                                    isUpdatingIntegration ||
                                    !selectedIntegrationId
                                  }
                                  className="flex items-center gap-1"
                                  title="Salvar"
                                >
                                  {isUpdatingIntegration ? (
                                    <LoaderIcon className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <SaveIcon className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEditIntegration}
                                  disabled={isUpdatingIntegration}
                                  className="h-8 w-8 p-0"
                                  title="Cancelar"
                                >
                                  <XIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="px-3 py-2 rounded-md bg-gray-50 dark:bg-zinc-800">
                                {(() => {
                                  const currentId =
                                    searchResult.data.user.integrationId;
                                  const resolved = integrations.find(
                                    (x) => x.integrationId === currentId
                                  );
                                  if (!currentId) {
                                    return (
                                      <span className="text-gray-500 dark:text-zinc-400">
                                        Nenhuma
                                      </span>
                                    );
                                  }
                                  const name = resolved?.integrationName
                                    ? resolved.integrationName
                                    : isLoadingIntegrations
                                    ? "Carregando..."
                                    : "Integração não encontrada";
                                  return (
                                    <div className="flex flex-col gap-1">
                                      <span className="font-medium">
                                        {name}
                                      </span>
                                      <span className="font-mono text-xs text-gray-600 dark:text-zinc-400">
                                        {currentId}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                              Ações
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleRemoveIntegration}
                                disabled={
                                  isUpdatingIntegration ||
                                  !searchResult.data.user.integrationId
                                }
                                className="flex items-center gap-2"
                              >
                                {isUpdatingIntegration ? (
                                  <LoaderIcon className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2Icon className="h-4 w-4" />
                                )}
                                Remover
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Integrat things */}
                        {searchResult.data.user.integrationId == process.env.NEXT_PUBLIC_INTEGRAT_INTEGRATION_ID && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                                  Integrat Partner Token
                                </div>
                                {!isEditingIntegratPartnerToken && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleEditIntegratPartnerToken}
                                    className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                                  >
                                    <EditIcon className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>

                              {isEditingIntegratPartnerToken ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    value={selectedIntegratPartnerToken}
                                    onChange={(e) =>
                                      setSelectedIntegratPartnerToken(
                                        e.target.value
                                      )
                                    }
                                    disabled={isUpdatingIntegratPartnerToken}
                                    placeholder="Cole o token do parceiro"
                                    className="flex-1 font-mono"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleUpdateIntegratPartnerToken}
                                    disabled={isUpdatingIntegratPartnerToken}
                                    className="flex items-center gap-1"
                                  >
                                    {isUpdatingIntegratPartnerToken ? (
                                      <LoaderIcon className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <SaveIcon className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={
                                      handleCancelEditIntegratPartnerToken
                                    }
                                    disabled={isUpdatingIntegratPartnerToken}
                                    className="h-8 w-8 p-0"
                                  >
                                    <XIcon className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-base font-mono bg-gray-50 dark:bg-zinc-800 px-3 py-2 rounded-md">
                                  {searchResult.data.user.integratPartnerToken ||
                                    "Não definido"}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Subscription Information */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                          <CreditCardIcon className="h-5 w-5" />
                          Informações da Assinatura
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                                Plano
                              </div>
                              {!isEditingPlan && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleEditPlan}
                                  className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
                                >
                                  <EditIcon className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            {isEditingPlan ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={selectedPlan}
                                  onChange={(e) =>
                                    setSelectedPlan(e.target.value)
                                  }
                                  disabled={isUpdatingPlan}
                                  className="flex-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <option value="">Selecione um plano</option>
                                  <option value="trial">Trial</option>
                                  <option value="monthly">Mensal</option>
                                  <option value="semi-annual">Semestral</option>
                                  <option value="annual">Anual</option>
                                  <option value="admin">Admin</option>
                                  <option value="custom">Custom</option>
                                </select>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleUpdatePlan}
                                  disabled={isUpdatingPlan || !selectedPlan}
                                  className="flex items-center gap-1"
                                >
                                  {isUpdatingPlan ? (
                                    <LoaderIcon className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <SaveIcon className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEditPlan}
                                  disabled={isUpdatingPlan}
                                  className="h-8 w-8 p-0"
                                >
                                  <XIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <p className="text-base capitalize px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md font-medium">
                                {searchResult.data.user.subscription.plan}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
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
                              Cancelar no Fim do Período
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 dark:bg-zinc-800">
                              {searchResult.data.user.subscription
                                .cancelAtPeriodEnd ? (
                                <>
                                  <span className="text-red-600 dark:text-red-400 font-medium">
                                    Sim
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-green-600 dark:text-green-400 font-medium">
                                    Não
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stripe Information */}
                      {(searchResult.data.user.subscription.stripeCustomerId ||
                        searchResult.data.user.subscription
                          .stripeSubscriptionId) && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                            <CreditCardIcon className="h-5 w-5" />
                            Informações do Stripe
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {searchResult.data.user.subscription
                              .stripeCustomerId && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                                  Stripe Customer ID
                                </div>
                                <p className="text-sm font-mono bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-md">
                                  {
                                    searchResult.data.user.subscription
                                      .stripeCustomerId
                                  }
                                </p>
                              </div>
                            )}

                            {searchResult.data.user.subscription
                              .stripeSubscriptionId && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                                  Stripe Subscription ID
                                </div>
                                <p className="text-sm font-mono bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-md">
                                  {
                                    searchResult.data.user.subscription
                                      .stripeSubscriptionId
                                  }
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Billing Period Information */}
                      {(searchResult.data.user.subscription
                        .currentPeriodStart ||
                        searchResult.data.user.subscription.currentPeriodEnd ||
                        searchResult.data.user.subscription.trialEnd) && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Períodos de Cobrança
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {searchResult.data.user.subscription
                              .currentPeriodStart && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                                  Início do Período
                                </div>
                                <p className="text-sm text-gray-600 dark:text-zinc-400 px-3 py-2 bg-gray-50 dark:bg-zinc-800 rounded-md">
                                  {formatDate(
                                    searchResult.data.user.subscription
                                      .currentPeriodStart
                                  )}
                                </p>
                              </div>
                            )}

                            {searchResult.data.user.subscription
                              .currentPeriodEnd && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                                  Fim do Período
                                </div>
                                <p className="text-sm text-gray-600 dark:text-zinc-400 px-3 py-2 bg-gray-50 dark:bg-zinc-800 rounded-md">
                                  {formatDate(
                                    searchResult.data.user.subscription
                                      .currentPeriodEnd
                                  )}
                                </p>
                              </div>
                            )}

                            {searchResult.data.user.subscription.trialEnd && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                                  Fim do Trial
                                </div>
                                <p className="text-sm text-orange-600 dark:text-orange-400 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-md font-medium">
                                  {formatDate(
                                    searchResult.data.user.subscription.trialEnd
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Usage Information */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                          <ActivityIcon className="h-5 w-5" />
                          Uso da Plataforma
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                                Uso Mensal de Exames
                              </div>
                              {!isEditingUsage && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleEditUsage}
                                  className="h-6 w-6 p-0 text-gray-500 hover:text-green-600 dark:text-zinc-400 dark:hover:text-green-400"
                                >
                                  <EditIcon className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            {isEditingUsage ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={selectedUsage}
                                  onChange={(e) =>
                                    setSelectedUsage(e.target.value)
                                  }
                                  disabled={isUpdatingUsage}
                                  min="0"
                                  className="flex-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleUpdateUsage}
                                  disabled={isUpdatingUsage || !selectedUsage}
                                  className="flex items-center gap-1"
                                >
                                  {isUpdatingUsage ? (
                                    <LoaderIcon className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <SaveIcon className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEditUsage}
                                  disabled={isUpdatingUsage}
                                  className="h-8 w-8 p-0"
                                >
                                  <XIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-md border border-green-200 dark:border-green-800">
                                <div className="flex items-center justify-between">
                                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {
                                      searchResult.data.user.usage
                                        .examsThisPeriod
                                    }
                                  </span>
                                  <div className="text-right">
                                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                      Este período
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-zinc-500">
                                      Reset:{" "}
                                      {formatDate(
                                        searchResult.data.user.usage
                                          .examsThisPeriodResetDate
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Account Information */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
                          <ClockIcon className="h-5 w-5" />
                          Informações da Conta
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                              Cadastrado em
                            </div>
                            <p className="text-sm text-gray-600 dark:text-zinc-400 px-3 py-2 bg-gray-50 dark:bg-zinc-800 rounded-md">
                              {formatDate(searchResult.data.user.createdAt)}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-zinc-400">
                              Última Atualização
                            </div>
                            <p className="text-sm text-gray-600 dark:text-zinc-400 px-3 py-2 bg-gray-50 dark:bg-zinc-800 rounded-md">
                              {formatDate(searchResult.data.user.updatedAt)}
                            </p>
                          </div>
                        </div>
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
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
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

                        {/* Date Range Filter */}
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center border-t pt-4">
                          <div className="flex items-center gap-2">
                            <FilterIcon className="h-4 w-4 text-gray-600 dark:text-zinc-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                              Filtrar por período:
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full sm:w-auto justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {dateRange.from ? (
                                    dateRange.to ? (
                                      <>
                                        {new Date(
                                          dateRange.from
                                        ).toLocaleDateString("pt-BR", {
                                          day: "2-digit",
                                          month: "short",
                                        })}{" "}
                                        -{" "}
                                        {new Date(
                                          dateRange.to
                                        ).toLocaleDateString("pt-BR", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </>
                                    ) : (
                                      <>
                                        A partir de{" "}
                                        {new Date(
                                          dateRange.from
                                        ).toLocaleDateString("pt-BR", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </>
                                    )
                                  ) : dateRange.to ? (
                                    <>
                                      Até{" "}
                                      {new Date(
                                        dateRange.to
                                      ).toLocaleDateString("pt-BR", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </>
                                  ) : (
                                    <span className="text-gray-500">
                                      Selecionar período
                                    </span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <div className="p-3 space-y-2">
                                  <div className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                                    Selecione o período
                                  </div>
                                  <Calendar
                                    mode="range"
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
                                    className="rounded-md border"
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>

                            {(dateRange.from || dateRange.to) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearDateRange}
                                className="text-gray-500 hover:text-red-600"
                              >
                                <XIcon className="h-4 w-4 mr-1" />
                                Limpar filtro
                              </Button>
                            )}

                            {(dateRange.from || dateRange.to) && (
                              <div className="text-xs text-gray-500 dark:text-zinc-400">
                                {
                                  filterResultsByDateRange(
                                    searchResult.data.results
                                  ).length
                                }{" "}
                                de {searchResult.data.results.length} resultados
                                no período
                              </div>
                            )}
                          </div>
                        </div>
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

                                      {/* Date Range Filter for Individual Exam */}
                                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center border-t border-b py-3 mb-3 bg-gray-50 dark:bg-zinc-800/30 px-3 rounded-md">
                                        <div className="flex items-center gap-2">
                                          <FilterIcon className="h-3 w-3 text-gray-600 dark:text-zinc-400" />
                                          <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">
                                            Filtrar por período:
                                          </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-full sm:w-auto justify-start text-left font-normal text-xs"
                                              >
                                                <CalendarIcon className="mr-2 h-3 w-3" />
                                                {dateRange.from ? (
                                                  dateRange.to ? (
                                                    <>
                                                      {new Date(
                                                        dateRange.from
                                                      ).toLocaleDateString(
                                                        "pt-BR",
                                                        {
                                                          day: "2-digit",
                                                          month: "short",
                                                        }
                                                      )}{" "}
                                                      -{" "}
                                                      {new Date(
                                                        dateRange.to
                                                      ).toLocaleDateString(
                                                        "pt-BR",
                                                        {
                                                          day: "2-digit",
                                                          month: "short",
                                                          year: "numeric",
                                                        }
                                                      )}
                                                    </>
                                                  ) : (
                                                    <>
                                                      A partir de{" "}
                                                      {new Date(
                                                        dateRange.from
                                                      ).toLocaleDateString(
                                                        "pt-BR",
                                                        {
                                                          day: "2-digit",
                                                          month: "short",
                                                          year: "numeric",
                                                        }
                                                      )}
                                                    </>
                                                  )
                                                ) : dateRange.to ? (
                                                  <>
                                                    Até{" "}
                                                    {new Date(
                                                      dateRange.to
                                                    ).toLocaleDateString(
                                                      "pt-BR",
                                                      {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                      }
                                                    )}
                                                  </>
                                                ) : (
                                                  <span className="text-gray-500">
                                                    Selecionar período
                                                  </span>
                                                )}
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent
                                              className="w-auto p-0"
                                              align="start"
                                            >
                                              <div className="p-3 space-y-2">
                                                <div className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                                                  Selecione o período
                                                </div>
                                                <Calendar
                                                  mode="range"
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
                                                  className="rounded-md border"
                                                />
                                              </div>
                                            </PopoverContent>
                                          </Popover>

                                          {(dateRange.from || dateRange.to) && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={clearDateRange}
                                              className="h-7 text-xs text-gray-500 hover:text-red-600"
                                            >
                                              <XIcon className="h-3 w-3 mr-1" />
                                              Limpar
                                            </Button>
                                          )}

                                          {(dateRange.from || dateRange.to) && (
                                            <div className="text-xs text-gray-500 dark:text-zinc-400">
                                              {
                                                filterResultsByDateRange(
                                                  examResults
                                                ).length
                                              }{" "}
                                              de {examResults.length} resultados
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Mobile Results Layout */}
                                      <div className="block md:hidden space-y-3">
                                        {examResults.map((result) => (
                                          <div
                                            key={result._id}
                                            className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-3"
                                          >
                                            <div className="flex justify-between items-start gap-2">
                                              <div className="flex-1 space-y-2">
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
                                                    {formatDate(
                                                      result.createdAt
                                                    )}
                                                  </p>
                                                </div>
                                              </div>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                  handleDeleteResult(
                                                    result._id,
                                                    result.email,
                                                    result.examTitle
                                                  )
                                                }
                                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                              >
                                                <Trash2Icon className="h-4 w-4" />
                                              </Button>
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
                                              <TableHead className="text-center w-[80px]">
                                                Ações
                                              </TableHead>
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
                                                <TableCell className="text-center">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleDeleteResult(
                                                        result._id,
                                                        result.email,
                                                        result.examTitle
                                                      )
                                                    }
                                                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                  >
                                                    <Trash2Icon className="h-4 w-4" />
                                                  </Button>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este resultado?
            </DialogDescription>
          </DialogHeader>

          {resultToDelete && (
            <div className="py-4 space-y-2">
              <div className="text-sm">
                <span className="font-medium text-gray-700 dark:text-zinc-300">
                  Email:
                </span>{" "}
                <span className="font-mono text-gray-600 dark:text-zinc-400">
                  {resultToDelete.email}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-700 dark:text-zinc-300">
                  Exame:
                </span>{" "}
                <span className="text-gray-600 dark:text-zinc-400">
                  {resultToDelete.examTitle}
                </span>
              </div>
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-300">
                  ⚠️ Esta ação não pode ser desfeita. O resultado será
                  permanentemente removido do sistema.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDeleteResult}
              disabled={isDeletingResult}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteResult}
              disabled={isDeletingResult}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingResult ? (
                <>
                  <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2Icon className="h-4 w-4 mr-2" />
                  Excluir Resultado
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashWrapper>
  );
}
