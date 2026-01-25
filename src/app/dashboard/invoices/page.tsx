"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import "./invoices-list.scss";

interface Invoice {
  _id: string;
  number: string;
  date: string;
  customerName: string;
  total: number;
  status: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const limit = 10;

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter && statusFilter !== "ALL") params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`/api/invoices?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar facturas");
      const data = await res.json();
      setInvoices(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalResults(data.pagination?.total || 0);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las facturas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, limit, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchInvoices]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta factura?")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      toast({ title: "Éxito", description: "Factura eliminada correctamente" });
      fetchInvoices();
    } catch {
      toast({
        title: "Error",
        description: "No se pudo eliminar la factura",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Draft: "secondary",
      Sent: "outline",
      Paid: "default",
      Partial: "outline",
      Cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      Draft: "Borrador",
      Sent: "Enviada",
      Paid: "Pagada",
      Partial: "Parcial",
      Cancelled: "Anulada",
    };
    return <Badge variant={map[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="invoices-list">
      <div className="invoices-list__container">
        <div className="invoices-list__header">
          <h1 className="invoices-list__title">Facturas</h1>
          <Button onClick={() => router.push("/dashboard/invoices/crear")}>
            <Plus className="invoices-list__icon" /> Nueva Factura
          </Button>
        </div>

        <div className="flex gap-4 mb-4 flex-wrap">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por número, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="Draft">Borrador</SelectItem>
              <SelectItem value="Sent">Enviada</SelectItem>
              <SelectItem value="Paid">Pagada</SelectItem>
              <SelectItem value="Partial">Parcial</SelectItem>
              <SelectItem value="Cancelled">Anulada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="invoices-list__table-wrapper">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="invoices-list__loading-row">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="invoices-list__empty-row">
                    No hay facturas registradas.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice._id}>
                    <TableCell className="font-medium">
                      <a href={`/dashboard/invoices/${invoice._id}`} className="invoices-list__link">
                        {invoice.number}
                      </a>
                    </TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell className="invoices-list__amount">
                      {formatCurrency(invoice.total, "COP")}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="invoices-list__actions-cell">
                      <div className="invoices-list__actions">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/invoices/${invoice._id}`)}
                        >
                          <Eye className="invoices-list__icon-sm" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/invoices/${invoice._id}/editar`)}
                        >
                          <Pencil className="invoices-list__icon-sm" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(invoice._id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="invoices-list__icon-sm" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="invoices-list__pagination">
          <div className="invoices-list__pagination-info">
            Mostrando <strong>{invoices.length}</strong> de <strong>{totalResults}</strong> resultados
          </div>
          <div className="invoices-list__pagination-controls">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Anterior
            </Button>
            <span className="invoices-list__pagination-current">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
