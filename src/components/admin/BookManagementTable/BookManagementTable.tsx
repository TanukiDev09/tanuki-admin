'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePermission } from '@/hooks/usePermissions';
import { ModuleName, PermissionAction } from '@/types/permission';
import Image from 'next/image';
import { getBookCoverAlt } from '@/lib/accessibility';
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
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import './BookManagementTable.scss';

type SortOption =
  | 'title-asc'
  | 'title-desc'
  | 'sold-desc'
  | 'sold-asc'
  | 'revenue-desc'
  | 'revenue-asc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'title-asc', label: 'Nombre (A → Z)' },
  { value: 'title-desc', label: 'Nombre (Z → A)' },
  { value: 'sold-desc', label: 'Más vendidos' },
  { value: 'sold-asc', label: 'Menos vendidos' },
  { value: 'revenue-desc', label: 'Mayor facturación' },
  { value: 'revenue-asc', label: 'Menor facturación' },
];

// Algunos valores pueden llegar como Decimal128 ({ $numberDecimal }) en vez de number
function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && '$numberDecimal' in value) {
    return Number((value as { $numberDecimal: string }).$numberDecimal) || 0;
  }
  return Number(value) || 0;
}

interface BookManagementTableProps {
  onEdit: (book: BookResponse) => void;
  onDelete: (bookId: string) => void;
  onToggleStatus: (bookId: string, currentStatus: boolean) => void;
}

function StockLabel({
  stock,
  isBundle,
}: {
  stock: number;
  isBundle?: boolean;
}) {
  let tone = 'ok';
  let text = `${formatNumber(stock)} en stock`;
  if (stock === 0) {
    tone = 'out';
    text = 'Agotado';
  } else if (stock < 10) {
    tone = 'low';
    text = `${formatNumber(stock)} en stock · bajo`;
  }
  return (
    <span
      className={`book-card__stock book-card__stock--${tone}`}
      title={isBundle ? 'Stock calculado de sus volúmenes' : undefined}
    >
      {text}
    </span>
  );
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
  const [sortBy, setSortBy] = useState<SortOption>('title-asc');

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

  const sortedBooks = useMemo(() => {
    const [field, direction] = sortBy.split('-') as [string, 'asc' | 'desc'];
    const factor = direction === 'asc' ? 1 : -1;
    const value = (book: BookResponse) =>
      toNumber(field === 'sold' ? book.soldCopies : book.totalRevenue);
    return [...filteredBooks].sort((a, b) =>
      field === 'title'
        ? factor * a.title.localeCompare(b.title, 'es', { sensitivity: 'base' })
        : factor * (value(a) - value(b))
    );
  }, [filteredBooks, sortBy]);

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
        <div className="book-management-table__collection-filter-wrapper">
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
            <SelectTrigger aria-label="Ordenar por">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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

      {/* Cards */}
      {sortedBooks.length === 0 ? (
        <div className="book-management-table__empty">
          <p className="book-management-table__empty-text">
            No se encontraron libros
          </p>
        </div>
      ) : (
        <div className="book-management-table__grid">
          {sortedBooks.map((book) => {
            const stock = book.totalStock ?? book.stock;
            const authors = getNames(book.authors);
            const subtitle = [
              book.collectionName,
              book.isBundle ? 'Obra completa' : '',
              book.isActive ? '' : 'Inactivo',
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <article
                key={book._id}
                className={`book-card ${book.isActive ? '' : 'book-card--inactive'}`}
              >
                <div className="book-card__cover">
                  {book.coverImage ? (
                    <Image
                      src={
                        book.coverImage.startsWith('http')
                          ? book.coverImage
                          : `/uploads/covers/${book.coverImage}`
                      }
                      alt={getBookCoverAlt(book.title)}
                      fill
                      sizes="80px"
                      className="book-card__cover-image"
                    />
                  ) : (
                    <ImageIcon className="book-card__cover-placeholder" />
                  )}
                </div>

                <div className="book-card__body">
                  <div className="book-card__text">
                    <h3 className="book-card__title">
                      <a
                        href={`/dashboard/catalog/${book._id}`}
                        className="book-card__link"
                      >
                        {book.title}
                      </a>
                    </h3>
                    {authors && <p className="book-card__authors">{authors}</p>}
                    {subtitle && (
                      <p className="book-card__subtitle">{subtitle}</p>
                    )}
                  </div>

                  <dl className="book-card__stats">
                    <div className="book-card__stat">
                      <dt className="book-card__stat-label">Vendidos</dt>
                      <dd className="book-card__stat-value">
                        {formatNumber(toNumber(book.soldCopies))}
                      </dd>
                    </div>
                    <div className="book-card__stat">
                      <dt className="book-card__stat-label">Facturado</dt>
                      <dd className="book-card__stat-value">
                        {formatCurrency(toNumber(book.totalRevenue))}
                      </dd>
                    </div>
                  </dl>

                  <div className="book-card__footer">
                    <div className="book-card__figures">
                      <span className="book-card__price">
                        {formatCurrency(book.price)}
                      </span>
                      <StockLabel stock={stock} isBundle={book.isBundle} />
                    </div>
                    <div className="book-card__actions">
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
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
