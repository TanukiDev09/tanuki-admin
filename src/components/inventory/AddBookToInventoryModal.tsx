'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { Search, Loader2, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash';


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

  // Debounced refetch
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

  // Trigger debounced search when term changes
  useEffect(() => {
    debouncedRefetch();
    // cancel debounce on unmount
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Libros al Inventario</DialogTitle>
          <DialogDescription>
            Busca libros en el catálogo para habilitarlos en esta bodega.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título o ISBN..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && refetchBooks()}
              />
            </div>
            <Button onClick={() => refetchBooks()} disabled={isFetchingBooks}>
              {isFetchingBooks ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {searchResults.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {searchTerm ? 'No se encontraron resultados.' : 'Busca un libro para comenzar.'}
              </p>
            ) : (
              searchResults.map((book) => {
                const isAlreadyIn = existingBookIds.includes(book._id);
                const hasImage = book.coverImage && !imageError[book._id];

                return (
                  <div key={book._id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="relative w-10 h-14 bg-muted rounded overflow-hidden shrink-0">
                      {hasImage ? (
                        <Image
                          src={book.coverImage!.startsWith('http') ? book.coverImage! : `/uploads/covers/${book.coverImage}`}
                          alt={book.title}
                          fill
                          className="object-cover"
                          onError={() => setImageError(prev => ({ ...prev, [book._id]: true }))}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                          -
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" title={book.title}>
                        {book.title}
                      </p>
                      <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={isAlreadyIn ? "ghost" : "outline"}
                      disabled={isAlreadyIn || addingId === book._id}
                      onClick={() => handleAdd(book)}
                    >
                      {addingId === book._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isAlreadyIn ? (
                        'Ya está'
                      ) : (
                        <Plus className="w-4 h-4 mr-1" />
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
