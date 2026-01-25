"use client";

import { useEffect, useState } from "react";
import InvoiceForm from "@/components/finance/InvoiceForm";
import { useParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function EditInvoicePage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (!res.ok) throw new Error("Error al cargar la factura");
        const data = await res.json();

        // Format date for input type="date"
        if (data.date) data.date = new Date(data.date).toISOString().split("T")[0];
        if (data.dueDate) data.dueDate = new Date(data.dueDate).toISOString().split("T")[0];
        if (data.costCenter && typeof data.costCenter === "object") data.costCenter = data.costCenter._id;

        setInvoice(data);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "No se pudo cargar la información de la factura",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInvoice();
  }, [id, toast]);

  if (loading) {
    return <div className="p-10 text-center">Cargando...</div>;
  }

  if (!invoice) {
    return <div className="p-10 text-center text-destructive">Factura no encontrada</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-primary">Editar Factura</h1>
      <InvoiceForm initialData={invoice} isEditing={true} />
    </div>
  );
}
