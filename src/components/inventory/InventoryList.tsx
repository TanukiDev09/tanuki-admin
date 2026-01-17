'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InventoryStockBadge } from './InventoryStockBadge';
import { History, Plus, Minus, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o ISBN..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Portada</TableHead>
              <TableHead>Libro</TableHead>
              <TableHead className="hidden xl:table-cell">ISBN</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Precio</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              {onAdjust && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={onAdjust ? 7 : 6} className="text-center h-24">
                  {search ? 'No se encontraron resultados.' : 'No hay productos en esta bodega.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div className="relative w-12 h-16 bg-muted rounded overflow-hidden">
                      {item.bookId.coverImage && !imageError[item.bookId._id] ? (
                        <Image
                          src={item.bookId.coverImage.startsWith('http') ? item.bookId.coverImage : `/uploads/covers/${item.bookId.coverImage}`}
                          alt={item.bookId.title}
                          fill
                          className="object-cover"
                          onError={() => setImageError(prev => ({ ...prev, [item.bookId._id]: true }))}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                          Sin foto
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/catalog/${item.bookId._id}`}
                      className="hover:text-primary hover:underline transition-colors"
                    >
                      {item.bookId.title}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">{item.bookId.isbn}</TableCell>
                  <TableCell className="hidden lg:table-cell text-right">
                    {formatCurrency(item.bookId.price)}
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-center">
                    <InventoryStockBadge
                      quantity={item.quantity}
                      minStock={item.minStock}
                    />
                  </TableCell>
                  {onAdjust && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAdjust(item)}
                        title="Ajustar Stock"
                      >
                        <History className="h-4 w-4" />
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
