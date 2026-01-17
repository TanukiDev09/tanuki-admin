'use client';

import { useState } from 'react';
import { BookPlus } from 'lucide-react';
import BookManagementTable from '@/components/admin/BookManagementTable';
import CreateBookModal from '@/components/admin/CreateBookModal';
import EditBookModal from '@/components/admin/EditBookModal';
import { BookResponse } from '@/types/book';

export default function CatalogoPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (book: BookResponse) => {
    setSelectedBook(book);
    setEditModalOpen(true);
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este libro?')) {
      return;
    }

    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRefreshKey((prev) => prev + 1);
      } else {
        alert('Error al eliminar libro');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar libro');
    }
  };

  const handleToggleStatus = async (
    bookId: string,
    currentStatus: boolean
  ) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    if (!confirm(`¿Estás seguro de que deseas ${action} este libro?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setRefreshKey((prev) => prev + 1);
      } else {
        alert(`Error al ${action} libro`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al ${action} libro`);
    }
  };

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Catálogo de Libros
            </h1>
            <p className="text-foreground-muted">
              Administra el catálogo de la editorial
            </p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
          >
            <BookPlus className="w-5 h-5" />
            <span className="hidden sm:inline">Crear Libro</span>
          </button>
        </div>

        {/* Table */}
        <BookManagementTable
          key={refreshKey}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      {/* Modals */}
      <CreateBookModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleSuccess}
      />
      <EditBookModal
        isOpen={editModalOpen}
        book={selectedBook}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedBook(null);
        }}
        onSuccess={handleSuccess}
      />
    </>
  );
}
