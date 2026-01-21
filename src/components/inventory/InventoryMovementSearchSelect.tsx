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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InventoryMovement {
  _id: string;
  type: string;
  date: string;
  observations?: string;
  fromWarehouseId?: { name: string };
  toWarehouseId?: { name: string };
}

interface InventoryMovementSearchSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  type?: 'LIQUIDACION' | 'INGRESO' | 'REMISION' | 'DEVOLUCION';
  placeholder?: string;
}

export function InventoryMovementSearchSelect({
  value,
  onValueChange,
  type,
  placeholder = 'Seleccionar movimiento de inventario...',
}: InventoryMovementSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);


  useEffect(() => {
    const fetchMovements = async () => {
      setLoading(true);
      try {
        let url = `/api/inventory/movements?limit=20`;
        if (type) url += `&type=${type}`;
        // Note: Inventory API might not support 'search' directly in the same way, 
        // but it's good to keep it consistent if it does or to filter here.

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setMovements(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching inventory movements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovements();
  }, [type]);

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
              {format(new Date(selectedMovement.date), 'dd/MM/yyyy')} - {selectedMovement.type}
              {selectedMovement.observations ? ` (${selectedMovement.observations})` : ''}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por observaciones..." />
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
                    <span className="font-medium">
                      {movement.type} - {format(new Date(movement.date), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {movement.fromWarehouseId ? `De: ${movement.fromWarehouseId.name}` : ''}
                      {movement.toWarehouseId ? ` A: ${movement.toWarehouseId.name}` : ''}
                    </span>
                    {movement.observations && (
                      <span className="text-xs italic">{movement.observations}</span>
                    )}
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
