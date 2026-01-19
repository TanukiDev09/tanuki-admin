'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import Image from 'next/image';
import { Search, Loader2, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash';
import './AddBookToInventoryModal.scss';

interface Book {
  _id: string;
  title: string;
  isbn: string;
  price: number;
  coverImage?: string;
}

interface AddBookToInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string;
  onSuccess: () => void;
  existingBookIds: string[];
}

export function AddBookToInventoryModal({
  isOpen,
  onClose,
  warehouseId,
  onSuccess,
  existingBookIds,
}: AddBookToInventoryModalProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setImageError({});
    }
  }, [isOpen]);

  const fetchBooks = async (term: string) => {
    const response = await fetch(`/api/books?search=${encodeURIComponent(term)}&limit=10`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error fetching books');
    return data.data as Book[];
  };

  const { data: booksData, refetch: refetchBooks, isFetching: isFetchingBooks } = useQuery<Book[], Error>({
    queryKey: ['searchBooks', searchTerm],
    queryFn: () => fetchBooks(searchTerm),
    enabled: false,
    staleTime: Infinity,
  });

  const debouncedRefetch = useMemo(
    () =>
      debounce(() => {
        if (searchTerm.trim()) {
          refetchBooks();
        }
      }, 300),
    [searchTerm, refetchBooks]
  );

  useEffect(() => {
    setSearchResults(booksData ?? []);
  }, [booksData]);

  useEffect(() => {
    debouncedRefetch();
    return () => debouncedRefetch.cancel();
  }, [searchTerm, debouncedRefetch]);

  const addInventory = async (book: Book) => {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        warehouseId,
        bookId: book._id,
        quantity: 0,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al agregar libro al inventario');
    }
    return data;
  };

  const { mutateAsync: mutateAdd } = useMutation({
    mutationFn: addInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', warehouseId] });
    },
  });

  const handleAdd = async (book: Book) => {
    setAddingId(book._id);
    try {
      await mutateAdd(book);
      toast({
        title: 'Libro agregado',
        description: `"${book.title}" ha sido agregado al inventario de esta bodega.`,
      });
      onSuccess();
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="add-book-inventory-modal__dialog">
        <DialogHeader>
          <DialogTitle>Agregar Libros al Inventario</DialogTitle>
          <DialogDescription>
            Busca libros en el catálogo para habilitarlos en esta bodega.
          </DialogDescription>
        </DialogHeader>

        <div className="add-book-inventory-modal">
          <div className="add-book-inventory-modal__search-container">
            <div className="add-book-inventory-modal__search">
              <Search className="add-book-inventory-modal__search-icon" />
              <Input
                placeholder="Buscar por título o ISBN..."
                className="add-book-inventory-modal__search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && refetchBooks()}
              />
            </div>
            <Button onClick={() => refetchBooks()} disabled={isFetchingBooks}>
              {isFetchingBooks ? <Loader2 className="add-book-inventory-modal__spinner" /> : 'Buscar'}
            </Button>
          </div>

          <div className="add-book-inventory-modal__results-list">
            {searchResults.length === 0 ? (
              <p className="add-book-inventory-modal__empty">
                {searchTerm ? 'No se encontraron resultados.' : 'Busca un libro para comenzar.'}
              </p>
            ) : (
              searchResults.map((book) => {
                const isAlreadyIn = existingBookIds.includes(book._id);
                const hasImage = book.coverImage && !imageError[book._id];

                return (
                  <div key={book._id} className="add-book-inventory-modal__book-card">
                    <div className="add-book-inventory-modal__cover-wrapper">
                      {hasImage ? (
                        <Image
                          src={book.coverImage!.startsWith('http') ? book.coverImage! : `/uploads/covers/${book.coverImage}`}
                          alt={book.title}
                          fill
                          className="add-book-inventory-modal__cover-image"
                          onError={() => setImageError(prev => ({ ...prev, [book._id]: true }))}
                        />
                      ) : (
                        <div className="add-book-inventory-modal__cover-fallback">
                          -
                        </div>
                      )}
                    </div>
                    <div className="add-book-inventory-modal__book-info">
                      <p className="add-book-inventory-modal__book-title" title={book.title}>
                        {book.title}
                      </p>
                      <p className="add-book-inventory-modal__book-isbn">ISBN: {book.isbn}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={isAlreadyIn ? "ghost" : "outline"}
                      disabled={isAlreadyIn || addingId === book._id}
                      onClick={() => handleAdd(book)}
                      className="add-book-inventory-modal__action-btn"
                    >
                      {addingId === book._id ? (
                        <Loader2 className="add-book-inventory-modal__spinner" />
                      ) : isAlreadyIn ? (
                        'Ya está'
                      ) : (
                        <Plus className="add-book-inventory-modal__icon" />
                      )}
                      {!isAlreadyIn && addingId !== book._id && 'Agregar'}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
