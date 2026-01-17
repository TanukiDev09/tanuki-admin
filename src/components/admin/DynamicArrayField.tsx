'use client';

import { Plus, X } from 'lucide-react';

interface DynamicArrayFieldProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  required?: boolean;
}

export default function DynamicArrayField({
  label,
  values,
  onChange,
  placeholder = 'Nombre',
  required = false,
}: DynamicArrayFieldProps) {
  const handleAdd = () => {
    onChange([...values, '']);
  };

  const handleRemove = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  const handleChange = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(newValues);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label} {required && '*'}
      </label>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(index, e.target.value)}
              required={required && index === 0}
              className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={placeholder}
            />
            {values.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Eliminar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar {label.toLowerCase()}
        </button>
      </div>
    </div>
  );
}
