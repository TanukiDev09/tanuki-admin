'use client';

import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import './ImageUploader.scss';

interface ImageUploaderProps {
  value?: string;
  onChange: (filename: string) => void;
  onRemove: () => void;
  label?: string;
}

export default function ImageUploader({
  value,
  onChange,
  onRemove,
  label = 'Portada del Libro',
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
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

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
    <div className="image-uploader">
      <Label className="image-uploader__label">{label}</Label>

      {value ? (
        <div className="image-uploader__preview">
          <Image
            src={value.startsWith('http') ? value : `/uploads/covers/${value}`}
            alt="Portada"
            fill
            className="image-uploader__image"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleRemove}
            className="image-uploader__remove-btn"
          >
            <X className="image-uploader__remove-icon" />
          </Button>
        </div>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`image-uploader__dropzone ${
            isDragging ? 'image-uploader__dropzone--dragging' : ''
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="image-uploader__input"
          />

          {uploading ? (
            <div className="image-uploader__loading">
              <div className="image-uploader__spinner" />
              <p className="image-uploader__text">Subiendo imagen...</p>
            </div>
          ) : (
            <div className="image-uploader__content">
              <div className="image-uploader__icon-wrapper">
                <Upload className="image-uploader__icon" />
              </div>
              <div className="image-uploader__info">
                <p className="image-uploader__text">
                  Arrastra una imagen aquí o haz clic para seleccionar
                </p>
                <p className="image-uploader__hint">PNG, JPG, WEBP hasta 5MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="image-uploader__error">{error}</p>}
    </div>
  );
}
