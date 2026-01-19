'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Search,
  PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/Command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { CreatorResponse } from '@/types/creator';
import { CreatorForm } from './CreatorForm';
import './CreatorSelect.scss';

interface CreatorSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  max?: number;
}

export function CreatorSelect({
  value = [],
  onChange,
  placeholder = 'Seleccionar creador...',
  max,
}: CreatorSelectProps) {
  const [open, setOpen] = useState(false);
  const [creators, setCreators] = useState<CreatorResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchCreators = useCallback(async (searchTerm: string = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const res = await fetch(`/api/creators?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar creadores');
      const data = await res.json();
      setCreators(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar creadores inicialmente
  useEffect(() => {
    fetchCreators('');
  }, [fetchCreators]);

  // Efecto para buscar con delay
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCreators(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchCreators]);

  const handleSelect = (id: string) => {
    let newValue: string[];
    if (value.includes(id)) {
      newValue = value.filter((v) => v !== id);
    } else {
      if (max && value.length >= max) return;
      newValue = [...value, id];
    }
    onChange(newValue);
  };

  // Helper para mostrar el nombre de los seleccionados
  const getSelectedLabels = () => {
    if (value.length === 0) return placeholder;

    // Combinamos la lista actual de búsqueda con los seleccionados previamente (que deberíamos persistir)
    // Para simplificar, usaremos 'creators' del estado.
    // NOTA: Esto fallará visualmente si el ID seleccionado no está en la lista 'creators' actual.
    // Solución ideal: Mantener un mapa de id -> creator o fetch de los seleccionados.

    const count = value.length;
    if (count === 1) {
      const creator = creators.find((c) => c._id === value[0]);
      return creator ? creator.name : 'Cargando...';
    }
    return `${count} seleccionados`;
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="creator-select__trigger"
          >
            <span className="creator-select__trigger-text">
              {getSelectedLabels()}
            </span>
            <ChevronsUpDown className="creator-select__icon-muted" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="creator-select__popover" align="start">
          <Command shouldFilter={false}>
            <div className="creator-select__search-wrapper">
              <Search className="creator-select__search-icon" />
              <input
                className="creator-select__input"
                placeholder={placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <CommandList>
              {loading && (
                <div className="creator-select__loading">
                  <Loader2 className="creator-select__loading-icon" />
                </div>
              )}

              {!loading && creators.length === 0 && (
                <CommandEmpty>No se encontraron resultados.</CommandEmpty>
              )}

              <CommandGroup>
                {creators.map((creator) => (
                  <CommandItem
                    key={creator._id}
                    value={creator._id}
                    onSelect={() => handleSelect(creator._id)}
                  >
                    <Check
                      className={cn(
                        'creator-select__icon-check',
                        value.includes(creator._id)
                          ? 'creator-select__icon-check--selected'
                          : 'creator-select__icon-check--unselected'
                      )}
                    />
                    <div className="creator-select__item-col">
                      <span>{creator.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem onSelect={() => setIsCreateOpen(true)}>
                  <PlusCircle className="creator-select__icon-check" />
                  Crear nuevo creador
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CreatorForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          fetchCreators(search); // Recargar lista
          // Opcional: Seleccionar automáticamente el recién creado si pudiéramos obtener su ID
        }}
      />
    </>
  );
}
