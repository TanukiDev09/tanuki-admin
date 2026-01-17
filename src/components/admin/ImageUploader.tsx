'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  value?: string;
  onChange: (filename: string) => void;
  onRemove: () => void;
}

export default function ImageUploader({
  value,
  onChange,
  onRemove,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/cover', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir la imagen');
      }

      onChange(data.filename);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        Portada del Libro
      </label>

      {value ? (
        <div className="relative">
          <img
            src={`/uploads/covers/${value}`}
            alt="Portada"
            className="w-full h-64 object-cover rounded-lg border border-border"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary hover:bg-surface'
            }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
              <p className="text-sm text-foreground-muted">Subiendo imagen...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-primary/20 rounded-full">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Arrastra una imagen aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-foreground-muted mt-1">
                  PNG, JPG, WEBP hasta 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
