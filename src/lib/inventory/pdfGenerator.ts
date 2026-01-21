import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency, formatNumber } from '../utils';
import { EditorialSettings } from '@/types/settings';

interface MovementItem {
  bookId: {
    title: string;
    isbn: string;
    price: number;
  };
  quantity: number;
}

interface Warehouse {
  name: string;
  type: string;
  address?: string;
  city?: string;
  pointOfSaleId?: {
    name?: string;
    identificationType?: string;
    identificationNumber?: string;
    address?: string;
    city?: string;
    discountPercentage?: number;
  };
}

interface Movement {
  _id: string;
  type: string;
  date: string | Date;
  fromWarehouseId: Warehouse;
  toWarehouseId: Warehouse;
  items: MovementItem[];
  observations?: string;
  consecutive?: number;
}

export const generateMovementPDF = (
  movement: Movement,
  editorialSettings?: EditorialSettings
) => {
  const doc = new jsPDF({
    format: 'letter',
    unit: 'mm',
  });
  const pageWidth = doc.internal.pageSize.width;

  // Header Colors (Grayscale)
  const primaryColor: [number, number, number] = [40, 40, 40]; // Dark Gray

  // Title and Date
  doc.setFontSize(18);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  const title =
    movement.type === 'REMISION' && movement.consecutive
      ? `REMISIÓN N° ${movement.consecutive}`
      : `MOVIMIENTO DE INVENTARIO: ${movement.type}`;
  doc.text(title, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Fecha: ${format(new Date(movement.date), 'dd/MM/yyyy HH:mm', { locale: es })}`,
    14,
    28
  );

  // Helper to get sender/receiver details
  const getDetails = (wh: Warehouse) => {
    if (wh?.type === 'editorial') {
      return {
        name: (editorialSettings?.name || 'EDITORIAL TANUKI SAS').toUpperCase(),
        id: `NIT ${editorialSettings?.nit || '901.624.469-6'}`,
        address: editorialSettings?.address || 'Calle 45 # 21 - 34',
        city: editorialSettings?.city || 'Bogotá',
        discount: 0,
      };
    }
    const pos = wh?.pointOfSaleId;
    return {
      name: (pos?.name || wh?.name || 'N/A').toUpperCase(),
      id: pos
        ? `${pos.identificationType || ''} ${pos.identificationNumber || ''}`.trim()
        : 'N/A',
      address: pos?.address || wh?.address || 'N/A',
      city: pos?.city || wh?.city || '',
      discount: pos?.discountPercentage || 0,
    };
  };

  const sender = getDetails(movement.fromWarehouseId);
  const receiver = getDetails(movement.toWarehouseId);

  // Sender and Receiver Information Blocks
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DE ENVÍO', 14, 45);
  doc.text('INFORMACIÓN DE RECEPCIÓN', pageWidth / 2 + 7, 45);

  doc.setLineWidth(0.5);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(14, 47, pageWidth / 2 - 5, 47);
  doc.line(pageWidth / 2 + 7, 47, pageWidth - 14, 47);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // From details
  doc.setFont('helvetica', 'bold');
  doc.text('Nombre:', 14, 53);
  doc.setFont('helvetica', 'normal');
  doc.text(sender.name, 35, 53);

  doc.setFont('helvetica', 'bold');
  doc.text('Identificación:', 14, 58);
  doc.setFont('helvetica', 'normal');
  doc.text(sender.id, 35, 58);

  doc.setFont('helvetica', 'bold');
  doc.text('Dirección:', 14, 63);
  doc.setFont('helvetica', 'normal');
  doc.text(`${sender.address} ${sender.city}`, 35, 63);

  // To details
  doc.setFont('helvetica', 'bold');
  doc.text('Nombre:', pageWidth / 2 + 7, 53);
  doc.setFont('helvetica', 'normal');
  doc.text(receiver.name, pageWidth / 2 + 28, 53);

  doc.setFont('helvetica', 'bold');
  doc.text('Identificación:', pageWidth / 2 + 7, 58);
  doc.setFont('helvetica', 'normal');
  doc.text(receiver.id, pageWidth / 2 + 28, 58);

  doc.setFont('helvetica', 'bold');
  doc.text('Dirección:', pageWidth / 2 + 7, 63);
  doc.setFont('helvetica', 'normal');
  doc.text(`${receiver.address} ${receiver.city}`, pageWidth / 2 + 28, 63);

  // Items Table
  // Remisión uses receiver's discount, Devolución uses sender's discount (the POS in both cases)
  const appliedDiscount =
    movement.type === 'REMISION' ? receiver.discount : sender.discount;

  const tableData = movement.items.map((item: MovementItem) => {
    const book = item.bookId;
    const qty = item.quantity;
    const pvp = book?.price || 0;

    const totalPpv = pvp * qty;
    const totalLibreria = totalPpv * (appliedDiscount / 100);
    const totalEditorial = totalPpv - totalLibreria;

    return [
      book?.title || 'Libro desconocido',
      book?.isbn || 'N/A',
      formatNumber(qty),
      formatCurrency(pvp),
      `${appliedDiscount}%`,
      formatCurrency(totalLibreria),
      formatCurrency(totalEditorial),
    ];
  });

  const totalQty = movement.items.reduce(
    (sum: number, i: MovementItem) => sum + i.quantity,
    0
  );

  const totalLibOverall = movement.items.reduce((sum, item) => {
    const pvp = item.bookId?.price || 0;
    const totalPpv = pvp * item.quantity;
    return sum + totalPpv * (appliedDiscount / 100);
  }, 0);

  const totalEditOverall = movement.items.reduce((sum, item) => {
    const pvp = item.bookId?.price || 0;
    const totalPpv = pvp * item.quantity;
    return sum + totalPpv * (1 - appliedDiscount / 100);
  }, 0);

  autoTable(doc, {
    startY: 75,
    head: [
      [
        'Título',
        'ISBN',
        'Cant.',
        'PVP',
        'Desc.',
        'Total Librería',
        'Total Editorial',
      ],
    ],
    body: tableData,
    foot: [
      [
        { content: 'TOTALES', styles: { halign: 'right' } },
        '',
        { content: formatNumber(totalQty), styles: { halign: 'center' } },
        '',
        '',
        formatCurrency(totalLibOverall),
        formatCurrency(totalEditOverall),
      ],
    ],
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 50 }, // Título
      1: { cellWidth: 25 }, // ISBN
      2: { halign: 'center' }, // Cant.
      3: { halign: 'right' }, // PVP
      4: { halign: 'center' }, // Desc.
      5: { halign: 'right' }, // Total Lib
      6: { halign: 'right' }, // Total Edit
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: 0,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'right',
    },
  });

  // Observations and Signature
  const finalY =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 15;

  if (movement.observations) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    const splitText = doc.splitTextToSize(
      movement.observations,
      pageWidth - 28
    );
    doc.text(splitText, 14, finalY + 5);
  }

  // Signature lines optimization for Half-Letter
  // We place them relative to finalY with a reasonable margin, instead of forcing bottom of page
  const signatureY = finalY + (movement.observations ? 30 : 20);
  doc.line(14, signatureY, 80, signatureY);
  doc.line(pageWidth - 80, signatureY, pageWidth - 14, signatureY);

  doc.setFontSize(8);
  doc.text('Firma Autorizada Editorial', 14, signatureY + 5);
  doc.text('Firma Recibido / Punto de Venta', pageWidth - 80, signatureY + 5);

  // Save the PDF
  const filename = `Movimiento_${movement.type}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(filename);
};
