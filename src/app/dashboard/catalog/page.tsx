'use client';

import { useState } from 'react';
import { BookPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import BookManagementTable from '@/components/admin/BookManagementTable';
import CreateBookModal from '@/components/admin/CreateBookModal';
import EditBookModal from '@/components/admin/EditBookModal';
import { BookResponse } from '@/types/book';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import '../dashboard.scss';

export default function CatalogoPage() {
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(ModuleName.BOOKS, PermissionAction.CREATE);

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
      <div className="dashboard-page">
        <div className="dashboard-page__container">
          {/* Header */}
          <div className="dashboard-page__header">
            <div className="dashboard-page__title-group">
              <h1 className="dashboard-page__title">
                Catálogo de Libros
              </h1>
              <p className="dashboard-page__subtitle">
                Administra el catálogo de la editorial
              </p>
            </div>
            {canCreate && (
              <Button
                onClick={() => setCreateModalOpen(true)}
                className="dashboard-page__action-btn"
              >
                <BookPlus className="dashboard-page__icon" />
                <span className="dashboard-page__text-hidden-sm">Crear Libro</span>
              </Button>
            )}
          </div>

          {/* Table */}
          <BookManagementTable
            key={refreshKey}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </div>



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
