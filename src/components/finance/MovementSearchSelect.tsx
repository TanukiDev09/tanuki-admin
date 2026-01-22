'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
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
import { Movement } from '@/types/movement';

interface MovementSearchSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  type?: 'INCOME' | 'EXPENSE';
  placeholder?: string;
}

export function MovementSearchSelect({
  value,
  onValueChange,
  type,
  placeholder = 'Seleccionar movimiento financiero...',
}: MovementSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMovements = async () => {
      setLoading(true);
      try {
        let url = `/api/finance/movements?limit=20`;
        if (type) url += `&type=${type}`;
        if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setMovements(data.data);
        }
      } catch (error) {
        console.error('Error fetching movements:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchMovements();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, type]);

  const selectedMovement = movements.find((m) => m._id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedMovement ? (
            <span className="truncate">
              {selectedMovement.date.split('T')[0]} -{' '}
              {selectedMovement.description} (
              {formatCurrency(
                selectedMovement.amount,
                selectedMovement.currency
              )}
              )
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por descripción o beneficiario..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandEmpty>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Buscando...
              </div>
            ) : (
              'No se encontraron movimientos.'
            )}
          </CommandEmpty>
          <CommandList>
            <CommandGroup>
              {movements.map((movement) => (
                <CommandItem
                  key={movement._id}
                  value={movement._id}
                  onSelect={() => {
                    onValueChange(movement._id === value ? '' : movement._id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === movement._id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{movement.description}</span>
                    <span className="text-xs text-muted-foreground">
                      {movement.date.split('T')[0]} • {movement.beneficiary} •{' '}
                      {formatCurrency(movement.amount, movement.currency)}
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
