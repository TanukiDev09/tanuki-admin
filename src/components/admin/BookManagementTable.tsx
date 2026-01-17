'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { BookResponse } from '@/types/book';
import { Pencil, Trash2, BookX, BookCheck, Search } from 'lucide-react';

interface BookManagementTableProps {
  onEdit: (book: BookResponse) => void;
  onDelete: (bookId: string) => void;
  onToggleStatus: (bookId: string, currentStatus: boolean) => void;
}

export default function BookManagementTable({
  onEdit,
  onDelete,
  onToggleStatus,
}: BookManagementTableProps) {
  const [books, setBooks] = useState<BookResponse[]>([]);

  const getNames = (items: (string | { name: string })[] | undefined) => {
    if (!items || !Array.isArray(items)) return '';
    return items.map((item) => (typeof item === 'string' ? item : item.name)).join(', ');
  };
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/books?limit=100&includeInventory=true${searchTerm ? `&search=${searchTerm}` : ''}`,
        { cache: 'no-store' }
      );
      const data = await response.json();
      if (data.success) {
        setBooks(data.data);
      }
    } catch (error) {
      console.error('Error al cargar libros:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const filteredBooks = books.filter((book) => {
    if (filter === 'active') return book.isActive;
    if (filter === 'inactive') return !book.isActive;
    return true;
  });

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary mx-auto mb-4"></div>
        <p className="text-foreground-muted">Cargando catálogo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground-muted" />
          <input
            type="text"
            placeholder="Buscar por título, autor o ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-surface text-foreground-muted hover:bg-muted'
              }`}
          >
            Todos ({books.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${filter === 'active'
              ? 'bg-primary text-white'
              : 'bg-surface text-foreground-muted hover:bg-muted'
              }`}
          >
            Activos ({books.filter((b) => b.isActive).length})
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${filter === 'inactive'
              ? 'bg-primary text-white'
              : 'bg-surface text-foreground-muted hover:bg-muted'
              }`}
          >
            Inactivos ({books.filter((b) => !b.isActive).length})
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Portada
                </th>
                <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  ISBN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Autor
                </th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Colección
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Stock
                </th>
                <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center">
                    <p className="text-foreground-muted">
                      No se encontraron libros
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => (
                  <tr
                    key={book._id}
                    className="hover:bg-surface/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {book.coverImage ? (
                        <div className="relative w-12 h-16">
                          <Image
                            src={`/uploads/covers/${book.coverImage}`}
                            alt={book.title}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-16 bg-surface border border-border rounded flex items-center justify-center">
                          <span className="text-xs text-foreground-muted">
                            Sin portada
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground-muted">
                        {book.isbn}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground max-w-xs truncate">
                        <a href={`/dashboard/catalog/${book._id}`} className="hover:underline hover:text-primary">
                          {book.title}
                        </a>
                      </div>
                      <div className="text-xs text-foreground-muted">
                        {book.pages} páginas • {book.language.toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">
                        {getNames(book.authors)}
                      </div>
                      {((book.translators && book.translators.length > 0) ||
                        (book.illustrators && book.illustrators.length > 0)) && (
                          <div className="text-xs text-foreground-muted mt-1">
                            {book.translators && book.translators.length > 0 && (
                              <span>Trad: {book.translators.length}</span>
                            )}
                            {book.translators && book.translators.length > 0 &&
                              book.illustrators && book.illustrators.length > 0 && ' • '}
                            {book.illustrators && book.illustrators.length > 0 && (
                              <span>Ilust: {book.illustrators.length}</span>
                            )}
                          </div>
                        )}
                    </td>
                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                        {book.collectionName || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">
                        ${book.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`text-sm font-medium ${(book.totalStock ?? book.stock) > 0
                            ? 'text-green-400'
                            : 'text-red-400'
                            }`}
                        >
                          {book.totalStock ?? book.stock}
                        </div>
                        {(() => {
                          const stock = book.totalStock ?? book.stock;
                          if (stock === 0) {
                            return (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                Agotado
                              </span>
                            );
                          } else if (stock < 10) {
                            return (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                Bajo
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                    <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${book.isActive
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}
                      >
                        {book.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => onEdit(book)}
                          className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            onToggleStatus(book._id, book.isActive)
                          }
                          className={`p-2 rounded-lg transition-colors ${book.isActive
                            ? 'hover:bg-orange-500/20 text-orange-400'
                            : 'hover:bg-green-500/20 text-green-400'
                            }`}
                          title={book.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {book.isActive ? (
                            <BookX className="w-4 h-4" />
                          ) : (
                            <BookCheck className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => onDelete(book._id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
