"use client";

import * as React from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandGroup, CommandItem, CommandList, CommandEmpty, CommandInput } from "@/components/ui/Command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";
import "./MultiCostCenterSelect.scss";

interface CostCenter {
  _id: string;
  code: string;
  name: string;
}

interface MultiCostCenterSelectProps {
  value?: string[]; // Array of IDs
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiCostCenterSelect({
  value = [],
  onValueChange,
  placeholder = "Seleccionar centros de costo...",
  className,
}: MultiCostCenterSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [costCenters, setCostCenters] = React.useState<CostCenter[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch data
  React.useEffect(() => {
    const fetchCostCenters = async () => {
      try {
        const response = await fetch("/api/costcenters");
        const data = await response.json();
        if (data.success) {
          setCostCenters(data.data);
        }
      } catch {
        console.error("Error loading cost centers");
      } finally {
        setLoading(false);
      }
    };
    fetchCostCenters();
  }, []);

  const handleUnselect = (id: string) => {
    onValueChange(value.filter((v) => v !== id));
  };

  const handleSelect = (id: string) => {
    if (value.includes(id)) {
      onValueChange(value.filter((v) => v !== id));
    } else {
      onValueChange([...value, id]);
    }
  };

  // Helper to get selected objects
  const selectedCostCenters = costCenters.filter((cc) => value.includes(cc._id));

  return (
    <div className={cn("multi-cost-center-select-wrapper", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls="cost-center-listbox"
            className={cn(
              "multi-cost-center-select",
              open && "multi-cost-center-select--open"
            )}
          >
            {value.length > 0 ? (
              <span className="multi-cost-center-select__value">
                {value.length} {value.length === 1 ? 'seleccionado' : 'seleccionados'}
              </span>
            ) : (
              <span className="multi-cost-center-select__placeholder">{placeholder}</span>
            )}
            <ChevronsUpDown className="multi-cost-center-select__icon" />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="multi-cost-center-select__popover"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Buscar por código o nombre..." className="multi-cost-center-select__input" />
            <CommandList id="cost-center-listbox">
              {loading && <div className="multi-cost-center-select__loading">Cargando...</div>}

              {!loading && (
                <>
                  <CommandEmpty>No se hallaron resultados.</CommandEmpty>
                  <CommandGroup>
                    {costCenters.map((cc) => (
                      <CommandItem
                        key={cc._id}
                        value={`${cc.code} ${cc.name}`}
                        onSelect={() => handleSelect(cc._id)}
                      >
                        <div className={cn(
                          "command-item-check",
                          value.includes(cc._id) ? "command-item-check--active" : "command-item-check--inactive"
                        )}>
                          {value.includes(cc._id) && <Check className="command-item-check__icon" />}
                        </div>
                        <div className="item-label">
                          <span className="item-label__code">{cc.code}</span>
                          <span className="item-label__name">{cc.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Items List - Vertically stacked below */}
      {selectedCostCenters.length > 0 && (
        <div className="selected-cost-centers-list">
          {selectedCostCenters.map((cc) => (
            <div key={cc._id} className="cost-center-item">
              <div className="cost-center-item__content">
                <span className="cost-center-item__code">{cc.code}</span>
                <span className="cost-center-item__name">{cc.name}</span>
              </div>
              <button
                type="button"
                className="cost-center-item__remove"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnselect(cc._id);
                }}
                aria-label={`Remover ${cc.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
