'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';
import './DocumentUploader.scss';

interface DocumentUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  label?: string;
  className?: string;
}

export default function DocumentUploader({
  value,
  onChange,
  onRemove,
  label = 'Documento de Soporte (Factura física/PDF)',
  className,
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPDF = value?.toLowerCase().endsWith('.pdf') || value?.includes('blob.vercel-storage.com') && value.toLowerCase().includes('.pdf');
  const isImage = value && !isPDF && (
    value.toLowerCase().includes('.png') ||
    value.toLowerCase().includes('.jpg') ||
    value.toLowerCase().includes('.jpeg') ||
    value.toLowerCase().includes('.webp') ||
    value.includes('blob.vercel-storage.com')
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Por favor selecciona un PDF o una imagen válida (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no debe superar los 10MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/invoice', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir el documento');
      }

      onChange(data.filename);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove();
  };

  return (
    <div className={cn("document-uploader", className)}>
      <Label className="document-uploader__label">{label}</Label>

      {value ? (
        <div className="document-uploader__preview">
          {isImage ? (
            <div className="document-uploader__image-container">
              <Image
                src={value}
                alt="Vista previa"
                fill
                className="document-uploader__image"
              />
            </div>
          ) : (
            <div className="document-uploader__file-info">
              <FileText className="document-uploader__file-icon" />
              <div className="document-uploader__file-details">
                <span className="document-uploader__file-name">Documento PDF</span>
                <a href={value} target="_blank" rel="noopener noreferrer" className="document-uploader__view-link">
                  Ver documento
                </a>
              </div>
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleRemove}
            className="document-uploader__remove-btn"
          >
            <X className="document-uploader__remove-icon" />
          </Button>
        </div>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "document-uploader__dropzone",
            isDragging && "document-uploader__dropzone--dragging"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileSelect}
            className="document-uploader__input"
          />

          {uploading ? (
            <div className="document-uploader__loading">
              <Loader2 className="document-uploader__spinner animate-spin" />
              <p className="document-uploader__text">Subiendo documento...</p>
            </div>
          ) : (
            <div className="document-uploader__content">
              <div className="document-uploader__icon-wrapper">
                <Upload className="document-uploader__icon" />
              </div>
              <div className="document-uploader__info">
                <p className="document-uploader__text">
                  Arrastra un PDF o imagen aquí o haz clic
                </p>
                <p className="document-uploader__hint">Hasta 10MB (PDF, PNG, JPG)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="document-uploader__error">{error}</p>}
    </div>
  );
}
