'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/Command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { cn, formatCurrency } from '@/lib/utils';
import { BookResponse } from '@/types/book';
import './BookSelect.scss';

interface BookSelectProps {
  value?: string;
  onSelect: (book: BookResponse) => void;
  placeholder?: string;
}

export function BookSelect({
  value,
  onSelect,
  placeholder = 'Buscar libro en el catálogo...',
}: BookSelectProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: '20',
          isActive: 'true',
        });
        if (searchTerm) params.append('search', searchTerm);

        const res = await fetch(`/api/books?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setBooks(data.data);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchBooks();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const selectedBook = books.find((b) => b._id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="book-select__trigger"
        >
          {selectedBook ? (
            <span className="truncate">
              {selectedBook.title} ({selectedBook.isbn})
            </span>
          ) : (
            <>
              <BookOpen className="w-4 h-4 mr-3 opacity-40 shrink-0" />
              <span className="opacity-60">{placeholder}</span>
            </>
          )}
          <ChevronsUpDown className="book-select__icon w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="book-select__content" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Título, autor o ISBN..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandEmpty>
            {loading ? (
              <div className="book-select__loading">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </div>
            ) : (
              'No se encontraron libros.'
            )}
          </CommandEmpty>
          <CommandList>
            <CommandGroup>
              {books.map((book) => (
                <CommandItem
                  key={book._id}
                  value={book._id}
                  onSelect={() => {
                    onSelect(book);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'book-select__check-icon',
                      value === book._id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="book-select__item">
                    <span className="book-select__item-title">
                      {book.title}
                    </span>
                    <span className="book-select__item-details">
                      ISBN: {book.isbn} • {formatCurrency(book.price)} • CC:{' '}
                      {book.costCenter || 'Sin asignar'}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
