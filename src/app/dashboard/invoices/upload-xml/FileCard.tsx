'use client';

import { motion } from 'framer-motion';
import styles from './upload-xml.module.scss';

export interface ParsedInvoice {
  number: string;
  date: string;
  dueDate?: string;
  customerName: string;
  customerTaxId?: string;
  customerDocumentType?: string;
  total: number;
  subtotal: number;
  tax: number;
  items: Array<{
    type: 'libro' | 'servicio';
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    costCenter: string;
  }>;
  cufe?: string;
  orderReference?: string;
  newsletterSignup?: boolean;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  notes?: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Cancelled' | 'Unchecked';
}

export interface UploadedFile {
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error' | 'imported' | 'saving';
  invoice?: ParsedInvoice;
  error?: string;
}

interface FileCardProps {
  fileObj: UploadedFile;
  index: number;
  currentStep: number;
  onRemove: () => void;
  onReview: () => void;
}

export default function FileCard({
  fileObj,
  index,
  currentStep,
  onRemove,
  onReview,
}: FileCardProps) {
  const { status, file, invoice, error } = fileObj;

  // Use processing style for saving status to show the spinner
  const statusClassName = status === 'saving' ? styles.processing : styles[status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`${styles.fileCard} ${statusClassName}`}
    >
      <div className={styles.fileInfo}>
        <div className={styles.fileIcon}>
          {(status === 'success' || status === 'imported') && '✓'}
          {status === 'error' && '✗'}
          {(status === 'processing' || status === 'saving') && (
            <div className={styles.spinner} />
          )}
          {status === 'pending' && '📄'}
        </div>
        <div className={styles.fileDetails}>
          <div className={styles.fileName}>{file.name}</div>
          {invoice && (
            <div className={styles.invoicePreview}>
              <span>#{invoice.number}</span>
              <span>{invoice.customerName}</span>
              <span className={styles.amount}>
                ${(invoice.total || 0).toLocaleString()} COP
              </span>
              {invoice.newsletterSignup && (
                <span className={styles.newsletterBadge}>📧 Newsletter</span>
              )}
            </div>
          )}
          {error && <div className={styles.error}>{error}</div>}
        </div>
      </div>
      <div className={styles.fileActions}>
        {currentStep === 2 && status === 'pending' && (
          <button
            onClick={onRemove}
            className={styles.removeButton}
            title="Eliminar"
          >
            ×
          </button>
        )}
        {currentStep === 3 && status === 'success' && (
          <button onClick={onReview} className={styles.reviewButton}>
            Revisar
          </button>
        )}
        {status === 'imported' && (
          <span className={styles.importedBadge}>Guardada ✓</span>
        )}
      </div>
    </motion.div>
  );
}
