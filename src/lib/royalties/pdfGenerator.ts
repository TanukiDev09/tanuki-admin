import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { EditorialSettings } from '@/types/settings';
import { IRoyaltyStatement } from '@/types/royalty';

type StatementForPdf = Pick<
  IRoyaltyStatement,
  | 'creatorName'
  | 'creatorEmail'
  | 'creatorIdentification'
  | 'periodStart'
  | 'periodEnd'
  | 'previousBalance'
  | 'advancePayment'
  | 'totalRoyalties'
  | 'netSettlement'
  | 'balanceInFavorOf'
  | 'books'
  | 'generatedAt'
>;

const fmtDate = (d: Date | string) =>
  format(new Date(d), 'dd/MM/yyyy', { locale: es });

const roleEs = (role: string) =>
  role === 'author'
    ? 'Autor'
    : role === 'illustrator'
      ? 'Ilustrador'
      : role === 'translator'
        ? 'Traductor'
        : role;

export const generateRoyaltyPDF = (
  statement: StatementForPdf,
  editorialSettings?: EditorialSettings
) => {
  const doc = new jsPDF({ format: 'letter', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.width;
  const dark: [number, number, number] = [40, 40, 40];
  const num = (v: number | string) => Number(v);

  // --- Encabezado ---
  doc.setFontSize(18);
  doc.setTextColor(...dark);
  doc.setFont('helvetica', 'bold');
  doc.text('LIQUIDACIÓN DE REGALÍAS', 14, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const editorialName = (editorialSettings?.name || 'TANUKI SAS').toUpperCase();
  const editorialNit = editorialSettings?.nit || '901182452-4';
  doc.text(`${editorialName}  NIT: ${editorialNit}`, pageWidth - 14, 16, {
    align: 'right',
  });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  let y = 30;
  const labelValue = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 70, y);
    y += 6;
  };

  labelValue('Liquidación a favor de:', statement.creatorName);
  if (statement.creatorEmail)
    labelValue('Correo electrónico:', statement.creatorEmail);
  labelValue('Fecha:', fmtDate(statement.generatedAt || new Date()));
  labelValue(
    'Período:',
    `${fmtDate(statement.periodStart)}  —  ${fmtDate(statement.periodEnd)}`
  );
  labelValue(
    'Saldo de periodos anteriores:',
    formatCurrency(num(statement.previousBalance))
  );

  // --- Una tabla de ventas en papel por obra ---
  let cursorY = y + 2;
  for (const book of statement.books) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${book.bookTitle}  (${roleEs(book.role)} · ${book.royaltyPercentage}%)`,
      14,
      cursorY
    );
    cursorY += 2;

    const body = book.lines.map((l) => [
      l.invoiceNumber,
      formatNumber(l.quantity),
      formatCurrency(l.pvp),
      fmtDate(l.date),
      formatCurrency(num(l.totalInvoiced)),
      formatCurrency(l.totalRoyalty),
    ]);

    autoTable(doc, {
      startY: cursorY + 2,
      head: [
        [
          'Factura',
          'Ejemplares',
          'PVP',
          'Fecha',
          'Total facturado',
          'Total a liquidar',
        ],
      ],
      body,
      foot: [
        [
          { content: 'Subtotal', styles: { halign: 'right' } },
          { content: formatNumber(book.totalCopies), styles: { halign: 'center' } },
          '',
          '',
          '',
          {
            content: formatCurrency(num(book.totalRoyalties)),
            styles: { halign: 'right' },
          },
        ],
      ],
      theme: 'striped',
      headStyles: { fillColor: dark, textColor: 255, fontSize: 8, halign: 'center' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: 0,
        fontStyle: 'bold',
        fontSize: 8,
      },
    });

    cursorY =
      (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 8;
  }

  // --- Resumen de liquidación (a nivel del creador) ---
  let finalY = cursorY + 2;
  const summaryX = pageWidth - 100;
  const summaryRight = pageWidth - 14;
  const summaryRow = (label: string, value: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 10);
    doc.setTextColor(0, 0, 0);
    doc.text(label, summaryX, finalY);
    doc.text(value, summaryRight, finalY, { align: 'right' });
    finalY += bold ? 8 : 6;
  };

  summaryRow(
    'Saldo de periodos anteriores:',
    formatCurrency(num(statement.previousBalance))
  );
  summaryRow(
    'Regalías generadas:',
    formatCurrency(num(statement.totalRoyalties))
  );
  summaryRow('Anticipo:', `- ${formatCurrency(num(statement.advancePayment))}`);

  doc.setDrawColor(...dark);
  doc.setLineWidth(0.3);
  doc.line(summaryX, finalY - 3, summaryRight, finalY - 3);

  summaryRow(
    'TOTAL A LIQUIDAR:',
    formatCurrency(num(statement.netSettlement)),
    true
  );

  const favorLabel =
    statement.balanceInFavorOf === 'author'
      ? 'Saldo a favor del autor'
      : statement.balanceInFavorOf === 'publisher'
        ? 'Saldo a favor de la editorial'
        : 'Saldo en cero';
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(favorLabel, summaryRight, finalY, { align: 'right' });

  // --- Bloque de firma ---
  const sigY = Math.max(finalY + 25, doc.internal.pageSize.height - 45);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Recibido y aprobado:', 14, sigY);

  doc.setLineWidth(0.4);
  doc.line(14, sigY + 18, 90, sigY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Firma', 14, sigY + 23);
  doc.text(`Nombre: ${statement.creatorName}`, 14, sigY + 31);
  doc.text(
    `Identificación: ${statement.creatorIdentification || ''}`,
    14,
    sigY + 38
  );

  const safeName = statement.creatorName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(
    `Liquidacion_regalias_${safeName}_${format(new Date(), 'yyyyMMdd')}.pdf`
  );
};
