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

interface InventorySettlementSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

interface InventoryMovement {
  _id: string;
  consecutive: number;
  date: string;
  fromWarehouseId?: { name: string };
  toWarehouseId?: { name: string };
  type: string;
}

export default function InventorySettlementSelect({
  value,
  onValueChange,
  placeholder = 'Seleccionar liquidación...',
}: InventorySettlementSelectProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  useEffect(() => {
    const fetchMovements = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          '/api/inventory/movements?limit=50&type=LIQUIDACION'
        );
        if (res.ok) {
          const data = await res.json();
          setMovements(data.success ? data.data : []);
        }
      } catch (error) {
        console.error('Error fetching inventory movements:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchMovements();
    }
  }, [open]);

  const selectedMovement = movements.find((m) => m._id === value);
  // If value exists but wasn't loaded (e.g. initial load), we might show just the ID or "Cargando..."
  // Ideally we would fetch the single item if not in list, but for now we assume it's in the recent list or we just show "Seleccionado" in a real app.
  // A better approach for initial values is to pass the selected object or fetch it if missing.
  // For simplicity, we just check the list.

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? (
            selectedMovement ? (
              <span>
                Liquidación #{selectedMovement.consecutive} -{' '}
                {new Date(selectedMovement.date).toLocaleDateString()}
              </span>
            ) : (
              <span>Liquidación ID: {value}</span> // Fallback
            )
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar liquidación..." />
          <CommandEmpty>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cargando...
              </div>
            ) : (
              'No se encontraron liquidaciones.'
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
                      Liquidación #{movement.consecutive}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(movement.date).toLocaleDateString()} •{' '}
                      {movement.fromWarehouseId?.name || 'S/N'}
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
