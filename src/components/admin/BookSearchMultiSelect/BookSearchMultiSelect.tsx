'use client';

import { useState } from 'react';
import { Search, Plus, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { BookResponse } from '@/types/book';
import './BookSearchMultiSelect.scss';

interface BookSearchMultiSelectProps {
  label: string;
  selectedBookIds: string[];
  onAdd: (book: BookResponse) => void;
  onRemove: (bookId: string) => void;
  selectedBooksData: BookResponse[];
}

export default function BookSearchMultiSelect({
  label,
  selectedBookIds,
  onAdd,
  onRemove,
  selectedBooksData,
}: BookSearchMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BookResponse[]>([]);
  const [searching, setSearching] = useState(false);

  const searchBooks = async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    try {
      const response = await fetch(`/api/books?search=${encodeURIComponent(searchTerm)}&limit=5&isActive=true`);
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data as BookResponse[]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="book-search-multi-select">
      <Label>{label}</Label>

      <div className="book-search-multi-select__search-group">
        <div className="book-search-multi-select__input-wrapper">
          <Search className="book-search-multi-select__search-icon" />
          <Input
            placeholder="Buscar por título o ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchBooks())}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={searchBooks}
          disabled={searching}
          className="book-search-multi-select__search-btn"
        >
          {searching ? <Loader2 className="animate-spin" size={16} /> : 'Buscar'}
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="book-search-multi-select__results">
          {searchResults.map((book) => {
            const isSelected = selectedBookIds.includes(book._id);
            return (
              <div key={book._id} className="book-search-multi-select__result-item">
                <div className="book-search-multi-select__result-info">
                  <span className="book-search-multi-select__result-title">{book.title}</span>
                  <span className="book-search-multi-select__result-isbn">ISBN: {book.isbn}</span>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={isSelected}
                  onClick={() => {
                    onAdd(book);
                    setSearchResults([]);
                    setSearchTerm('');
                  }}
                >
                  <Plus size={16} />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {selectedBooksData.length > 0 && (
        <div className="book-search-multi-select__selected-list">
          {selectedBooksData.map((book) => (
            <div key={book._id} className="book-search-multi-select__selected-item">
              <div className="book-search-multi-select__selected-info">
                <span className="book-search-multi-select__selected-title">{book.title}</span>
                <span className="book-search-multi-select__selected-isbn">{book.isbn}</span>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="book-search-multi-select__remove-btn"
                onClick={() => onRemove(book._id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
