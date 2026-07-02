'use client';

import { useState } from 'react';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InventoryStockBadge } from './InventoryStockBadge';
import { History, Search, Trash2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { getBookCoverAlt } from '@/lib/accessibility';
import './InventoryList.scss';

interface Book {
  _id: string;
  title: string;
  isbn: string;
  price: number;
  coverImage?: string;
}

interface InventoryItem {
  _id: string;
  bookId: Book;
  quantity: number;
  minStock?: number;
  maxStock?: number;
}

interface InventoryListProps {
  data: InventoryItem[];
  onAdjust?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
}

export function InventoryList({
  data,
  onAdjust,
  onDelete,
}: InventoryListProps) {
  const [search, setSearch] = useState('');
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  const filteredData = data.filter((item) => {
    const book = item.bookId;
    if (!book) return false;
    const searchLower = search.toLowerCase();
    return (
      book.title.toLowerCase().includes(searchLower) ||
      book.isbn.toLowerCase().includes(searchLower)
    );
  });

  const columns: Column<InventoryItem>[] = [
    {
      header: 'Portada',
      accessorKey: 'bookId.coverImage',
      className: 'inventory-list__head-cover',
      cell: (item) => (
        <div className="inventory-list__cover-container">
          {item.bookId?.coverImage && !imageError[item.bookId._id] ? (
            <Image
              src={
                item.bookId.coverImage.startsWith('http')
                  ? item.bookId.coverImage
                  : `/uploads/covers/${item.bookId.coverImage}`
              }
              alt={getBookCoverAlt(item.bookId.title)}
              fill
              className="inventory-list__cover-image"
              onError={() =>
                setImageError((prev) => ({
                  ...prev,
                  [item.bookId._id]: true,
                }))
              }
            />
          ) : (
            <div className="inventory-list__cover-fallback">Sin foto</div>
          )}
        </div>
      ),
    },
    {
      header: 'Libro',
      accessorKey: 'bookId.title',
      sortable: true,
      cell: (item) => (
        <Link
          href={`/dashboard/catalog/${item.bookId._id}`}
          className="inventory-list__link"
        >
          {item.bookId.title}
        </Link>
      ),
    },
    {
      header: 'ISBN',
      accessorKey: 'bookId.isbn',
      sortable: true,
      className: 'inventory-list__col-isbn',
    },
    {
      header: 'Precio',
      accessorKey: 'bookId.price',
      sortable: true,
      className: 'inventory-list__col-price',
      cell: (item) => formatCurrency(item.bookId.price),
    },
    {
      header: 'Stock',
      accessorKey: 'quantity',
      sortable: true,
      className: 'inventory-list__stock',
      cell: (item) => formatNumber(item.quantity),
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      className: 'inventory-list__status',
      cell: (item) => (
        <InventoryStockBadge
          quantity={item.quantity}
          minStock={item.minStock}
        />
      ),
    },
    {
      header: 'Acciones',
      accessorKey: '_id',
      className: 'inventory-list__actions',
      cell: (item) => (
        <div className="inventory-list__actions-group">
          {onAdjust && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onAdjust(item)}
              title="Ajustar Stock"
            >
              <History className="inventory-list__icon" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item)}
              title="Eliminar del Inventario"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="inventory-list__icon" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="inventory-list">
      <div className="inventory-list__controls">
        <div className="inventory-list__search">
          <Search className="inventory-list__search-icon" />
          <Input
            placeholder="Buscar por título o ISBN..."
            className="inventory-list__search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="inventory-list__table-container">
        <DataTable
          data={filteredData}
          columns={columns}
          emptyMessage={
            search
              ? 'No se encontraron resultados.'
              : 'No hay productos en esta bodega.'
          }
        />
      </div>
    </div>
  );
}
