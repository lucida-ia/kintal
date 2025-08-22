"use client";

import { useState, useEffect, useCallback } from "react";
import DashWrapper from "@/components/dashboard/dash-wrapper";
import Header from "@/components/dashboard/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  UsersIcon,
  CalendarIcon,
  FilterIcon,
  LoaderIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  MailIcon,
  UserIcon,
  CopyIcon,
  Building2Icon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface User {
  _id: string;
  id: string;
  email: string;
  displayName: string;
  clerk_id: string;
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

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UserListResponse {
  success: boolean;
  data: User[];
  pagination: PaginationInfo;
  error?: string;
  message?: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [idFilter, setIdFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(
    null
  );
  const [institutionsOnly, setInstitutionsOnly] = useState<boolean>(false);
  const [subscriptionType, setSubscriptionType] = useState<string>("");
  const [perPage, setPerPage] = useState<string>("10");

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
  };

  const fetchUsers = useCallback(
    async (page: number = 1) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("limit", perPage);

        if (idFilter.trim()) {
          params.append("id", idFilter.trim());
        }

        if (dateRange.from) {
          params.append("from", dateRange.from.toISOString());
        }

        if (dateRange.to) {
          params.append("to", dateRange.to.toISOString());
        }

        if (institutionsOnly) {
          params.append("institutionsOnly", "true");
        }

        if (subscriptionType.trim()) {
          params.append("subscriptionType", subscriptionType.trim());
        }

        const response = await fetch(
          `/api/lucida/users/list?${params.toString()}`
        );
        const data: UserListResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch users");
        }

        if (data.success) {
          setUsers(data.data);
          setPagination(data.pagination);
        } else {
          throw new Error(data.error || "Failed to fetch users");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setUsers([]);
        setPagination(null);
      } finally {
        setIsLoading(false);
      }
    },
    [idFilter, dateRange, institutionsOnly, subscriptionType, perPage]
  );

  // Initial fetch
  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleFilterApply = () => {
    fetchUsers(1);
  };

  const handleFilterClear = () => {
    setIdFilter("");
    setDateRange({ from: undefined, to: undefined });
    setActiveQuickFilter(null);
    setInstitutionsOnly(false);
    setSubscriptionType("");
    setPerPage("10");
    // Fetch will be triggered by useEffect when dependencies change
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page);
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

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "trial":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "monthly":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "semi-annual":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "annual":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      case "custom":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const copyDisplayedEmails = async () => {
    try {
      if (!users.length) return;
      const text = users.map((u) => u.email).join("\n");
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy emails:", err);
    }
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

  // Generate pagination items
  const generatePaginationItems = () => {
    if (!pagination) return [];

    const items = [];
    const { currentPage, totalPages } = pagination;

    // Always show first page
    items.push(1);

    // Add ellipsis and pages around current page
    if (currentPage > 3) {
      items.push("...");
    }

    // Add pages around current page
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      if (!items.includes(i)) {
        items.push(i);
      }
    }

    // Add ellipsis and last page
    if (currentPage < totalPages - 2) {
      items.push("...");
    }

    if (totalPages > 1) {
      items.push(totalPages);
    }

    return items;
  };

  return (
    <DashWrapper>
      <Header
        title="Lista de Usuários"
        description="Visualize e gerencie todos os usuários cadastrados"
      />

      <div className="space-y-6 mt-4">
        {/* Filter Section */}
        <div className="flex flex-col gap-4 mt-4 sm:mt-6 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border dark:border-zinc-700">
          {/* ID/Email Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 flex items-center">
              Filtrar por ID/Email:
            </span>
            <div className="flex-1 sm:max-w-md">
              <Input
                placeholder="Digite ID ou email..."
                value={idFilter}
                onChange={(e) => setIdFilter(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

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
                  disabled={isLoading}
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
              <Popover
                open={isDatePickerOpen}
                onOpenChange={setIsDatePickerOpen}
              >
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
                  onClick={handleFilterApply}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <FilterIcon className="h-4 w-4" />
                  {isLoading ? "Carregando..." : "Filtrar"}
                </Button>

                {(dateRange.from ||
                  dateRange.to ||
                  activeQuickFilter ||
                  idFilter.trim() ||
                  institutionsOnly ||
                  subscriptionType.trim()) && (
                  <Button
                    variant="outline"
                    onClick={handleFilterClear}
                    disabled={isLoading}
                  >
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Tipo de Assinatura:
                </span>
                <select
                  value={subscriptionType}
                  onChange={(e) => setSubscriptionType(e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm min-w-[150px]"
                  disabled={isLoading}
                >
                  <option value="" className="bg-white dark:bg-zinc-900">
                    Todos os tipos
                  </option>
                  <option value="trial" className="bg-white dark:bg-zinc-900">
                    Trial
                  </option>
                  <option value="monthly" className="bg-white dark:bg-zinc-900">
                    Mensal
                  </option>
                  <option
                    value="semi-annual"
                    className="bg-white dark:bg-zinc-900"
                  >
                    Semestral
                  </option>
                  <option value="annual" className="bg-white dark:bg-zinc-900">
                    Anual
                  </option>
                  <option value="admin" className="bg-white dark:bg-zinc-900">
                    Admin
                  </option>
                  <option value="custom" className="bg-white dark:bg-zinc-900">
                    Personalizado
                  </option>
                </select>
              </div>
              <Button
                variant={institutionsOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setInstitutionsOnly((v) => !v)}
                disabled={isLoading}
                className="text-xs"
              >
                <Building2Icon className="h-4 w-4" />
                {institutionsOnly
                  ? "Somente Institucionais"
                  : "Incluir Institucionais"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyDisplayedEmails}
                disabled={isLoading || users.length === 0}
                className="text-xs"
              >
                <CopyIcon className="h-4 w-4" />
                Copiar Emails
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-zinc-400">
                  Por página:
                </span>
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(e.target.value)}
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  disabled={isLoading}
                >
                  {(["10", "50", "100", "1000", "all"] as const).map((v) => (
                    <option
                      key={v}
                      value={v}
                      className="bg-white dark:bg-zinc-900"
                    >
                      {v === "all" ? "Todos" : v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircleIcon className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        {/* Results Summary */}
        {pagination && (
          <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                    {pagination.totalUsers} usuário
                    {pagination.totalUsers !== 1 ? "s" : ""} encontrado
                    {pagination.totalUsers !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-zinc-400">
                  Página {pagination.currentPage} de {pagination.totalPages}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card className="hover:shadow-lg transition-all duration-200 dark:shadow-zinc-900/20 dark:border-zinc-700 dark:bg-zinc-900/90 py-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-zinc-50">
              <UsersIcon className="h-5 w-5" />
              Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoaderIcon className="h-6 w-6 animate-spin mr-2" />
                <span className="text-gray-500 dark:text-zinc-400">
                  Carregando usuários...
                </span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-full">
                    <UsersIcon className="h-8 w-8 text-gray-400 dark:text-zinc-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-50 mb-2">
                      Nenhum usuário encontrado
                    </h3>
                    <p className="text-gray-500 dark:text-zinc-400">
                      Tente ajustar os filtros ou limpar a pesquisa.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Mobile View */}
                <div className="block md:hidden space-y-4">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-900 dark:text-zinc-50">
                              {user.displayName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <MailIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-zinc-400 font-mono">
                              {user.email}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(user.subscription.status)}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(
                              user.subscription.plan
                            )}`}
                          >
                            {user.subscription.plan}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-zinc-400">
                            Clerk ID:
                          </span>
                          <p className="font-mono text-xs">{user.clerk_id}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-zinc-400">
                            Criado em:
                          </span>
                          <p>{formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome de Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Clerk ID</TableHead>
                        <TableHead>Tipo de Assinatura</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data de Criação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow
                          key={user._id}
                          className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors duration-150"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">
                                {user.displayName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {user.email}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm text-gray-600 dark:text-zinc-400">
                              {user.clerk_id}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(
                                user.subscription.plan
                              )}`}
                            >
                              {user.subscription.plan}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(user.subscription.status)}
                              <span className="capitalize text-sm">
                                {user.subscription.status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600 dark:text-zinc-400">
                              {formatDate(user.createdAt)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                {pagination.hasPrevPage && (
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      className="cursor-pointer"
                    />
                  </PaginationItem>
                )}

                {generatePaginationItems().map((item, index) => (
                  <PaginationItem key={index}>
                    {item === "..." ? (
                      <span className="px-3 py-2 text-gray-500">...</span>
                    ) : (
                      <PaginationLink
                        onClick={() => handlePageChange(Number(item))}
                        isActive={item === pagination.currentPage}
                        className="cursor-pointer"
                      >
                        {item}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                {pagination.hasNextPage && (
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      className="cursor-pointer"
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </DashWrapper>
  );
}
