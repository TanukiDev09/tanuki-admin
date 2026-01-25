"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Pencil, Link as LinkIcon, ExternalLink, Trash2, FileText, Book } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { MovementSearchSelect } from "@/components/finance/MovementSearchSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import "./invoice-detail.scss";

interface Invoice {
  _id: string;
  number: string;
  date: string;
  dueDate?: string;
  customerName: string;
  customerTaxId?: string;
  status: string;
  costCenters?: Array<{ _id: string; name: string; code: string }>;
  items: Array<{
    type: 'libro' | 'servicio';
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    costCenter: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  fileUrl?: string;
  notes?: string;
  movements: Array<{ _id: string; description: string; amount: number; date: string }>;
  inventoryMovement?: { _id: string; consecutive: number; type: string };
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);

  const fetchInvoice = useCallback(async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) throw new Error("Error loading invoice");
      const data = await res.json();
      setInvoice(data);
    } catch (_error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la factura",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (id) fetchInvoice();
  }, [id, fetchInvoice]);

  const handleLinkPayment = async (movementId: string) => {
    try {
      const currentMovements = invoice?.movements.map(m => m._id) || [];
      if (currentMovements.includes(movementId)) {
        toast({ title: "Información", description: "Este movimiento ya está asociado" });
        return;
      }

      const newMovements = [...currentMovements, movementId];

      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movements: newMovements }),
      });

      if (!res.ok) throw new Error("Error linking payment");

      toast({ title: "Éxito", description: "Pago asociado correctamente" });
      setIsLinking(false);
      fetchInvoice();
    } catch (_error) {
      toast({
        title: "Error",
        description: "No se pudo asociar el pago",
        variant: "destructive",
      });
    }
  };

  const handleUnlinkPayment = async (movementId: string) => {
    if (!window.confirm("¿Desvincular este pago?")) return;
    try {
      const currentMovements = invoice?.movements.map(m => m._id) || [];
      const newMovements = currentMovements.filter(mid => mid !== movementId);

      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movements: newMovements }),
      });

      if (!res.ok) throw new Error("Error unlinking payment");

      toast({ title: "Éxito", description: "Pago desvinculado" });
      fetchInvoice();
    } catch (_error) {
      toast({
        title: "Error",
        description: "No se pudo desvincular el pago",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div className="invoice-detail__loading">Cargando...</div>;
  if (!invoice) return <div className="invoice-detail__not-found">Factura no encontrada</div>;

  return (
    <div className="invoice-detail">
      {/* Header Actions */}
      <div className="invoice-detail__header">
        <Button variant="ghost" onClick={() => router.push("/dashboard/invoices")}>
          <ArrowLeft className="invoice-detail__icon" /> Volver
        </Button>
        <div className="invoice-detail__header-actions">
          <Button variant="outline" onClick={() => router.push(`/dashboard/invoices/${id}/editar`)}>
            <Pencil className="invoice-detail__icon" /> Editar
          </Button>
          {invoice.fileUrl && (
            <Button variant="outline" asChild>
              <a href={invoice.fileUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="invoice-detail__icon" /> Ver Documento
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="invoice-detail__grid">

        {/* Invoice Info */}
        <div className="invoice-detail__main">
          <Card>
            <CardHeader className="invoice-detail__info-header">
              <div>
                <CardTitle className="invoice-detail__info-title">Factura {invoice.number}</CardTitle>
                <div className="invoice-detail__info-date">
                  {new Date(invoice.date).toLocaleDateString()}
                </div>
              </div>
              <Badge variant={invoice.status === "Paid" ? "default" : "outline"} className="invoice-detail__status-badge">
                {invoice.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="invoice-detail__customer-grid">
                <div>
                  <h4 className="invoice-detail__field-label">Cliente</h4>
                  <p className="invoice-detail__field-value">{invoice.customerName}</p>
                  {invoice.customerTaxId && <p className="invoice-detail__field-subtext">{invoice.customerTaxId}</p>}
                </div>
                <div>
                  <h4 className="invoice-detail__field-label">Centros de Costo</h4>
                  {invoice.costCenters && invoice.costCenters.length > 0 ? (
                    <div className="invoice-detail__cost-centers">
                      {invoice.costCenters.map((cc) => (
                        <Badge key={cc._id} variant="secondary" style={{ fontSize: '10px' }}>
                          {cc.code} - {cc.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="invoice-detail__field-subtext">-</p>
                  )}
                </div>
              </div>

              <div className="invoice-detail__table-wrapper">
                <table className="invoice-detail__table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Descripción / Libro</th>
                      <th style={{ width: '120px' }}>CC</th>
                      <th className="invoice-detail__table-th--right" style={{ width: '80px' }}>Cant.</th>
                      <th className="invoice-detail__table-th--right" style={{ width: '120px' }}>Vr. Unit</th>
                      <th className="invoice-detail__table-th--right" style={{ width: '120px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="align-middle">
                          {item.type === 'libro' ? (
                            <Book className="w-4 h-4 text-primary opacity-70" />
                          ) : (
                            <FileText className="w-4 h-4 text-muted-foreground opacity-50" />
                          )}
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span>{item.description}</span>
                          </div>
                        </td>
                        <td>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {item.costCenter}
                          </Badge>
                        </td>
                        <td className="invoice-detail__table-td--right">{item.quantity}</td>
                        <td className="invoice-detail__table-td--right">{formatCurrency(item.unitPrice, "COP")}</td>
                        <td className="invoice-detail__table-td--right invoice-detail__table-td--bold">{formatCurrency(item.total, "COP")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="invoice-detail__summary-wrapper">
                <div className="invoice-detail__summary">
                  <div className="invoice-detail__summary-row">
                    <span style={{ opacity: 0.7 }}>Subtotal</span>
                    <span>{formatCurrency(invoice.subtotal, "COP")}</span>
                  </div>
                  <div className="invoice-detail__summary-row">
                    <span style={{ opacity: 0.7 }}>Impuestos</span>
                    <span>{formatCurrency(invoice.tax, "COP")}</span>
                  </div>
                  <div className="invoice-detail__summary-row invoice-detail__summary-row--total">
                    <span>Total</span>
                    <span>{formatCurrency(invoice.total, "COP")}</span>
                  </div>
                </div>
              </div>

              {invoice.notes && (
                <div className="invoice-detail__notes">
                  <h4 className="invoice-detail__notes-title">Notas</h4>
                  <p className="invoice-detail__field-subtext">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Associations */}
        <div className="invoice-detail__sidebar">
          <Card>
            <CardHeader>
              <CardTitle style={{ fontSize: '1.125rem' }}>Pagos Asociados</CardTitle>
            </CardHeader>
            <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {invoice.movements.length > 0 ? (
                <div className="invoice-detail__movements-list">
                  {invoice.movements.map((mov) => (
                    <div key={mov._id} className="invoice-detail__movement-item">
                      <div className="invoice-detail__movement-info">
                        <div className="invoice-detail__movement-desc">{mov.description}</div>
                        <div className="invoice-detail__movement-date">{new Date(mov.date).toLocaleDateString()}</div>
                        <div className="invoice-detail__movement-amount">{formatCurrency(mov.amount, "COP")}</div>
                      </div>
                      <div className="invoice-detail__movement-actions">
                        <Button variant="ghost" size="icon" style={{ height: '1.5rem', width: '1.5rem' }} onClick={() => router.push(`/dashboard/movements/${mov._id}`)}>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" style={{ height: '1.5rem', width: '1.5rem' }} className="text-destructive" onClick={() => handleUnlinkPayment(mov._id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="invoice-detail__not-found" style={{ padding: '0.5rem' }}>No hay pagos vinculados</p>
              )}

              <Dialog open={isLinking} onOpenChange={setIsLinking}>
                <DialogTrigger asChild>
                  <Button style={{ width: '100%' }} variant="outline">
                    <LinkIcon className="invoice-detail__icon" /> Asociar Pago
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Buscar Movimiento Bancario</DialogTitle>
                  </DialogHeader>
                  <div style={{ padding: '1rem 0' }}>
                    <MovementSearchSelect onValueChange={(val: string) => handleLinkPayment(val)} />
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {invoice.inventoryMovement && (
            <Card>
              <CardHeader>
                <CardTitle style={{ fontSize: '1.125rem' }}>Inventario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="invoice-detail__inventory-item">
                  <div>
                    <div style={{ fontWeight: 500 }}>Liquidación #{invoice.inventoryMovement.consecutive}</div>
                    <div className="invoice-detail__movement-date">{invoice.inventoryMovement.type}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/inventory/movements/${invoice.inventoryMovement?._id}`)}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
