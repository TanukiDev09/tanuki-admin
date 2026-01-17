'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Category } from '@/types/category';

interface CategorySelectProps {
  value?: string;
  onChange: (value: string) => void;
  type?: 'Ingreso' | 'Egreso' | 'Ambos' | 'INCOME' | 'EXPENSE';
}

export function CategorySelect({ value, onChange, type }: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('active', 'true');

        let filterType = type;
        if (type === 'INCOME') filterType = 'Ingreso';
        if (type === 'EXPENSE') filterType = 'Egreso';

        if (filterType) params.append('type', filterType);

        const res = await fetch(`/api/finance/categories?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data.data || []);
        }
      } catch (error) {
        console.error('Failed to load categories', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [type]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Cargando..." : "Selecciona categoría"} />
      </SelectTrigger>
      <SelectContent>
        {categories.map((cat) => (
          <SelectItem key={cat._id} value={cat._id}>
            {cat.name}
          </SelectItem>
        ))}
        {categories.length === 0 && !loading && (
          <div className="p-2 text-sm text-muted-foreground text-center">
            No hay categorías disponibles
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
