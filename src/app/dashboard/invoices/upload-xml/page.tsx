'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import InvoiceForm from '@/components/finance/InvoiceForm';
import { useToast } from '@/components/ui/Toast';
import styles from './upload-xml.module.scss';
import FileCard, { UploadedFile } from './FileCard';

export default function UploadXMLPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [reviewingIndex, setReviewingIndex] = useState<number | null>(null);

  const stats = useMemo(() => ({
    total: uploadedFiles.length,
    success: uploadedFiles.filter(f => f.status === 'success').length,
    imported: uploadedFiles.filter(f => f.status === 'imported').length,
    error: uploadedFiles.filter(f => f.status === 'error').length,
  }), [uploadedFiles]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prev => [
      ...prev,
      ...acceptedFiles.map(file => ({ file, status: 'pending' as const }))
    ]);
    if (currentStep === 1) setCurrentStep(2);
  }, [currentStep]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/xml': ['.xml'], 'application/xml': ['.xml'] },
  });

  const processFiles = async () => {
    setIsProcessing(true);
    for (let i = 0; i < uploadedFiles.length; i++) {
      if (uploadedFiles[i].status !== 'pending') continue;
      updateFile(i, { status: 'processing' });
      try {
        const formData = new FormData();
        formData.append('file', uploadedFiles[i].file);
        const res = await fetch('/api/invoices/upload-xml', { method: 'POST', body: formData });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Error al procesar el archivo' }));
          throw new Error(errorData.error || 'Error al procesar');
        }
        const data = await res.json();
        updateFile(i, { status: 'success', invoice: data.invoice });
      } catch (err) {
        updateFile(i, { status: 'error', error: err instanceof Error ? err.message : 'Error' });
      }
    }
    setIsProcessing(false);
    setCurrentStep(3);
  };

  const updateFile = (i: number, update: Partial<UploadedFile>) => {
    setUploadedFiles(prev => prev.map((f, idx) => idx === i ? { ...f, ...update } : f));
  };

  const saveAll = async () => {
    setIsSavingAll(true);
    let ok = 0, fail = 0;
    for (let i = 0; i < uploadedFiles.length; i++) {
      if (uploadedFiles[i].status !== 'success' || !uploadedFiles[i].invoice) continue;
      updateFile(i, { status: 'saving' });
      try {
        const res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...uploadedFiles[i].invoice, status: 'Sent' }),
        });
        if (!res.ok) throw new Error();
        ok++;
        updateFile(i, { status: 'imported' });
      } catch {
        fail++;
        updateFile(i, { status: 'error', error: 'Error al guardar' });
      }
    }
    setIsSavingAll(false);
    toast({
      title: fail === 0 ? 'Exito' : 'Parcial',
      description: `Guardados: ${ok}. Fallidos: ${fail}.`,
      variant: fail === 0 ? 'default' : 'destructive'
    });
  };

  const renderSteps = () => (
    reviewingIndex === null && (
      <div className={styles.steps}>
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`${styles.step} ${currentStep >= s ? styles.active : ''}`}>
            <div className={styles['step-number']}>{s}</div>
            <div className={styles['step-label']}>
              {s === 1 ? 'Cargar' : s === 2 ? 'Procesar' : s === 3 ? 'Verificar' : 'Resumen'}
            </div>
          </div>
        ))}
      </div>
    )
  );

  const renderReview = () => {
    const f = reviewingIndex !== null ? uploadedFiles[reviewingIndex] : null;
    if (!f || !f.invoice) return null;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles['review-section']}>
        <div className={styles['review-header']}>
          <button onClick={() => setReviewingIndex(null)} className={styles['back-button']}>← Volver</button>
          <h2>Verificar: {f.invoice.number}</h2>
        </div>
        <InvoiceForm
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialData={f.invoice as any}
          onSuccess={() => {
            updateFile(reviewingIndex!, { status: 'imported' });
            setReviewingIndex(null);
          }}
          onCancel={() => setReviewingIndex(null)}
        />
      </motion.div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Importar Facturas DIAN</h1>
        <p>{reviewingIndex !== null ? 'Revisando datos extraídos' : 'Carga archivos XML'}</p>
      </div>

      {renderSteps()}

      {reviewingIndex !== null ? renderReview() : (
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div key="u" className={styles['upload-section']}>
              <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}>
                <input {...getInputProps()} />
                <motion.div
                  className={styles['dropzone-content']}
                  animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
                >
                  <div className={styles['upload-icon']}>
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <h2>
                    {isDragActive
                      ? '¡Suelta los archivos aquí!'
                      : 'Arrastra archivos XML aquí'}
                  </h2>
                  <p>o haz clic para seleccionar</p>
                  <div className={styles['file-types']}>
                    <span>.xml</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {currentStep >= 2 && currentStep <= 3 && (
            <motion.div key="f" className={styles['file-list']}>
              <div className={styles['file-list-header']}>
                <h2>Archivos ({stats.total})</h2>
                <div className={styles['file-list-actions']}>
                  {currentStep === 2 && (
                    <button onClick={processFiles} disabled={isProcessing} className={styles['process-button']}>
                      {isProcessing ? 'Procesando...' : 'Analizar Archivos'}
                    </button>
                  )}
                  {currentStep === 3 && (
                    <>
                      {stats.success > 0 && (
                        <button onClick={saveAll} disabled={isSavingAll} className={styles['save-all-button']}>
                          {isSavingAll ? 'Guardando...' : `Guardar Todas (${stats.success})`}
                        </button>
                      )}
                      {stats.imported > 0 && (
                        <button onClick={() => setCurrentStep(4)} className={styles['finish-button']}>Terminar</button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className={styles.files}>
                {uploadedFiles.map((f, i) => (
                  <FileCard key={i} fileObj={f} index={i} currentStep={currentStep}
                    onRemove={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                    onReview={() => setReviewingIndex(i)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <div className={styles.summary}>
              <h2>¡Completado!</h2>
              <p>Guardadas: {stats.imported}</p>
              <button onClick={() => router.push('/dashboard/invoices')} className={styles['primary-button']}>Ver Facturas</button>
              <button onClick={() => { setUploadedFiles([]); setCurrentStep(1); }} className={styles['secondary-button']}>Importar Más</button>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
