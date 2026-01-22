'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { InventoryStockBadge } from './InventoryStockBadge';
import { History, Search } from 'lucide-react';
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
}

export function InventoryList({ data, onAdjust }: InventoryListProps) {
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="inventory-list__head-cover">
                Portada
              </TableHead>
              <TableHead>Libro</TableHead>
              <TableHead className="inventory-list__col-isbn">ISBN</TableHead>
              <TableHead className="inventory-list__col-price">
                Precio
              </TableHead>
              <TableHead className="inventory-list__stock">Stock</TableHead>
              <TableHead className="inventory-list__status">Estado</TableHead>
              {onAdjust && (
                <TableHead className="inventory-list__actions">
                  Acciones
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={onAdjust ? 7 : 6}
                  className="inventory-list__empty"
                >
                  {search
                    ? 'No se encontraron resultados.'
                    : 'No hay productos en esta bodega.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div className="inventory-list__cover-container">
                      {item.bookId.coverImage &&
                        !imageError[item.bookId._id] ? (
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
                        <div className="inventory-list__cover-fallback">
                          Sin foto
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/catalog/${item.bookId._id}`}
                      className="inventory-list__link"
                    >
                      {item.bookId.title}
                    </Link>
                  </TableCell>
                  <TableCell className="inventory-list__col-isbn">
                    {item.bookId.isbn}
                  </TableCell>
                  <TableCell className="inventory-list__col-price">
                    {formatCurrency(item.bookId.price)}
                  </TableCell>
                  <TableCell className="inventory-list__stock">
                    {formatNumber(item.quantity)}
                  </TableCell>
                  <TableCell className="inventory-list__status">
                    <InventoryStockBadge
                      quantity={item.quantity}
                      minStock={item.minStock}
                    />
                  </TableCell>
                  {onAdjust && (
                    <TableCell className="inventory-list__actions">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onAdjust(item)}
                        title="Ajustar Stock"
                      >
                        <History className="inventory-list__icon" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
