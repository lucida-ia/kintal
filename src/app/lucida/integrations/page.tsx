"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashWrapper from "@/components/dashboard/dash-wrapper";
import Header from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircleIcon,
  LoaderIcon,
  PlugIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

type Integration = {
  _id: string;
  integrationId: string;
  integrationName: string;
  createdAt?: string;
  updatedAt?: string;
};

type ListResponse =
  | { success: true; data: Integration[]; count: number }
  | { success: false; error?: string; message?: string };

type CreateResponse =
  | { success: true; data: Integration }
  | { success: false; error?: string; message?: string };

type DeleteResponse =
  | { success: true; message?: string; data?: Integration }
  | { success: false; error?: string; message?: string };

export default function IntegrationsPage() {
  const [items, setItems] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Integration | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [integrationName, setIntegrationName] = useState("");

  const canCreate = useMemo(() => {
    return integrationName.trim().length > 0;
  }, [integrationName]);

  const fetchIntegrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lucida/integrations", { method: "GET" });
      const data = (await res.json()) as ListResponse;
      if (!res.ok || !data.success) {
        throw new Error(
          (data as { error?: string; message?: string }).error ||
            (data as { message?: string }).message ||
            "Failed to fetch integrations"
        );
      }

      setItems(data.data);
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : "Failed to fetch integrations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleCreate = async () => {
    if (!canCreate || isCreating) return;
    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/lucida/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          integrationName: integrationName.trim(),
        }),
      });

      const data = (await res.json()) as CreateResponse;
      if (!res.ok || !data.success) {
        throw new Error(
          (data as { error?: string; message?: string }).error ||
            (data as { message?: string }).message ||
            "Failed to create integration"
        );
      }

      setIntegrationName("");
      setSuccess("Integração criada com sucesso.");
      await fetchIntegrations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create integration");
    } finally {
      setIsCreating(false);
    }
  };

  const openDeleteDialog = (it: Integration) => {
    setDeleteTarget(it);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deletingId) return;

    const id = deleteTarget._id;
    setDeletingId(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `/api/lucida/integrations?id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as DeleteResponse;
      if (!res.ok || !data.success) {
        throw new Error(
          (data as { error?: string; message?: string }).error ||
            (data as { message?: string }).message ||
            "Failed to delete integration"
        );
      }

      setSuccess("Integração excluída com sucesso.");
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
      await fetchIntegrations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete integration");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashWrapper>
      <Header
        title="Integrações"
        description="Liste e cadastre integrações do sistema"
      />

      <div className="space-y-6 mt-4">
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            // Avoid closing the dialog mid-delete
            if (deletingId) return;
            setIsDeleteDialogOpen(open);
            if (!open) setDeleteTarget(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir integração</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir esta integração? Esta ação não
                pode ser desfeita.
              </DialogDescription>
            </DialogHeader>

            {deleteTarget && (
              <div className="rounded-md border p-3 text-sm">
                <div className="flex flex-col gap-1">
                  <div>
                    <span className="text-muted-foreground">
                      integrationName:
                    </span>{" "}
                    <span className="font-medium">
                      {deleteTarget.integrationName}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      integrationId:
                    </span>{" "}
                    <span className="font-mono text-xs">
                      {deleteTarget.integrationId}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={!!deletingId}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={!deleteTarget || !!deletingId}
                className="flex items-center gap-2"
              >
                {deletingId ? (
                  <>
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2Icon className="h-4 w-4" />
                    Confirmar exclusão
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create */}
        <Card className="dark:border-zinc-700 dark:bg-zinc-900/90 pt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-zinc-50">
              <PlusIcon className="h-5 w-5" />
              Adicionar integração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Input
                  placeholder="integrationName (ex: Slack)"
                  value={integrationName}
                  onChange={(e) => setIntegrationName(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={!canCreate || isCreating}
                className="flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <LoaderIcon className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4" />
                    Criar
                  </>
                )}
              </Button>
            </div>

            {(error || success) && (
              <div
                className={`flex items-center gap-2 text-sm p-3 rounded-lg border ${
                  error
                    ? "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                    : "text-green-700 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                }`}
              >
                <AlertCircleIcon className="h-4 w-4" />
                {error ?? success}
              </div>
            )}
          </CardContent>
        </Card>

        {/* List */}
        <Card className="dark:border-zinc-700 dark:bg-zinc-900/90">
          <CardHeader className="pt-4">
            <CardTitle className="flex items-center gap-2 dark:text-zinc-50">
              <PlugIcon className="h-5 w-5" />
              Todas as integrações
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoaderIcon className="h-6 w-6 animate-spin mr-2" />
                <span className="text-gray-500 dark:text-zinc-400">
                  Carregando integrações...
                </span>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-zinc-400">
                Nenhuma integração cadastrada.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>integrationId</TableHead>
                    <TableHead>integrationName</TableHead>
                    <TableHead className="text-right">_id</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow
                      key={it._id}
                      className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors duration-150"
                    >
                      <TableCell className="font-mono">
                        {it.integrationId}
                      </TableCell>
                      <TableCell>{it.integrationName}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-gray-600 dark:text-zinc-400">
                        {it._id}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(it)}
                          disabled={isLoading || !!deletingId}
                          className="inline-flex items-center gap-2"
                          title="Excluir integração"
                        >
                          <Trash2Icon className="h-4 w-4" />
                          Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashWrapper>
  );
}

