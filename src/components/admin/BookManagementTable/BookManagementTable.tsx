'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import Image from 'next/image';
import { BookResponse } from '@/types/book';
import {
  Pencil,
  Trash2,
  BookX,
  BookCheck,
  Search,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import './BookManagementTable.scss';

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
  const { hasPermission } = usePermission();
  const canUpdate = hasPermission(ModuleName.BOOKS, PermissionAction.UPDATE);
  const canDelete = hasPermission(ModuleName.BOOKS, PermissionAction.DELETE);

  const [books, setBooks] = useState<BookResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');

  const getNames = (items: (string | { name: string })[] | undefined) => {
    if (!items || !Array.isArray(items)) return '';
    return items
      .map((item) => (typeof item === 'string' ? item : item.name))
      .join(', ');
  };

  const fetchCollections = useCallback(async () => {
    try {
      const response = await fetch('/api/books/collections');
      const data = await response.json();
      if (data.success) {
        setCollections(data.data);
      }
    } catch (error) {
      console.error('Error al cargar colecciones:', error);
    }
  }, []);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '100',
        includeInventory: 'true',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCollection !== 'all')
        params.append('collectionName', selectedCollection);

      const response = await fetch(`/api/books?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      if (data.success) {
        setBooks(data.data);
      }
    } catch (error) {
      console.error('Error al cargar libros:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCollection]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

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
      <div className="book-management-table book-management-table--loading">
        <div className="book-management-table__spinner-container">
          <div className="book-management-table__spinner" />
          <p className="book-management-table__loading-text">
            Cargando catálogo...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="book-management-table">
      {/* Search & Filters */}
      <div className="book-management-table__filters">
        <div className="book-management-table__search-wrapper">
          <Search className="book-management-table__search-icon" />
          <Input
            type="text"
            placeholder="Buscar por título, autor o ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="book-management-table__search-input"
          />
        </div>
        <div className="book-management-table__collection-filter-wrapper">
          <Select
            value={selectedCollection}
            onValueChange={setSelectedCollection}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las colecciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las colecciones</SelectItem>
              {collections.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="book-management-table__filter-group">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Todos ({formatNumber(books.length)})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            onClick={() => setFilter('active')}
            size="sm"
          >
            Activos ({formatNumber(books.filter((b) => b.isActive).length)})
          </Button>
          <Button
            variant={filter === 'inactive' ? 'default' : 'outline'}
            onClick={() => setFilter('inactive')}
            size="sm"
          >
            Inactivos ({formatNumber(books.filter((b) => !b.isActive).length)})
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="book-management-table__container">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Portada</TableHead>
              <TableHead className="book-management-table__hide-on-mobile">
                ISBN
              </TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead className="book-management-table__hide-on-tablet">
                Colección
              </TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="book-management-table__hide-on-mobile">
                Estado
              </TableHead>
              <TableHead className="book-management-table__actions-head">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBooks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="book-management-table__empty-cell"
                >
                  <p className="book-management-table__empty-text">
                    No se encontraron libros
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredBooks.map((book) => (
                <TableRow key={book._id} className="book-management-table__row">
                  <TableCell>
                    {book.coverImage ? (
                      <div className="book-management-table__cover-wrapper">
                        <Image
                          src={
                            book.coverImage.startsWith('http')
                              ? book.coverImage
                              : `/uploads/covers/${book.coverImage}`
                          }
                          alt={book.title}
                          fill
                          className="book-management-table__cover-image"
                        />
                      </div>
                    ) : (
                      <div className="book-management-table__no-cover">
                        <ImageIcon className="book-management-table__icon-muted" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="book-management-table__hide-on-mobile">
                    <span className="book-management-table__isbn">
                      {book.isbn}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="book-management-table__title-cell">
                      <a
                        href={`/dashboard/catalog/${book._id}`}
                        className="book-management-table__title-link"
                      >
                        {book.title}
                      </a>
                      <div className="book-management-table__book-meta">
                        {book.pages} págs • {book.language.toUpperCase()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="book-management-table__author-info">
                      <div className="book-management-table__author-name">
                        {getNames(book.authors)}
                      </div>
                      {((book.translators?.length ?? 0) > 0 ||
                        (book.illustrators?.length ?? 0) > 0) && (
                          <div className="book-management-table__extra-credits">
                            {(book.translators?.length ?? 0) > 0 && (
                              <span>Trad: {book.translators!.length}</span>
                            )}
                            {(book.translators?.length ?? 0) > 0 &&
                              (book.illustrators?.length ?? 0) > 0 &&
                              ' • '}
                            {(book.illustrators?.length ?? 0) > 0 && (
                              <span>Ilust: {book.illustrators!.length}</span>
                            )}
                          </div>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="book-management-table__hide-on-tablet">
                    <Badge
                      variant="outline"
                      className="book-management-table__collection-badge"
                    >
                      {book.collectionName || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="book-management-table__price">
                      {formatCurrency(book.price)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="book-management-table__stock-info">
                      <span
                        className={`book-management-table__stock-count ${(book.totalStock ?? book.stock) > 0
                          ? 'book-management-table__stock-count--in-stock'
                          : 'book-management-table__stock-count--out-of-stock'
                          }`}
                      >
                        {formatNumber(book.totalStock ?? book.stock)}
                      </span>
                      {(() => {
                        const stock = book.totalStock ?? book.stock;
                        if (stock === 0)
                          return <Badge variant="destructive">Agotado</Badge>;
                        if (stock < 10)
                          return <Badge variant="warning">Bajo</Badge>;
                        return null;
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className="book-management-table__hide-on-mobile">
                    <Badge variant={book.isActive ? 'success' : 'destructive'}>
                      {book.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="book-management-table__actions-cell">
                    <div className="book-management-table__actions">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(book)}
                          className="book-management-table__action-btn--edit"
                          title="Editar"
                        >
                          <Pencil className="book-management-table__icon" />
                        </Button>
                      )}
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            onToggleStatus(book._id, book.isActive)
                          }
                          className={
                            book.isActive
                              ? 'book-management-table__action-btn--deactivate'
                              : 'book-management-table__action-btn--activate'
                          }
                          title={book.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {book.isActive ? (
                            <BookX className="book-management-table__icon" />
                          ) : (
                            <BookCheck className="book-management-table__icon" />
                          )}
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(book._id)}
                          className="book-management-table__action-btn--delete"
                          title="Eliminar"
                        >
                          <Trash2 className="book-management-table__icon" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
