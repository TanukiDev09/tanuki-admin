'use client';

import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import './DynamicArrayField.scss';

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
    <div className="dynamic-array-field">
      <Label className="dynamic-array-field__label">
        {label} {required && '*'}
      </Label>
      <div className="dynamic-array-field__list">
        {values.map((value, index) => (
          <div key={index} className="dynamic-array-field__item">
            <Input
              type="text"
              value={value}
              onChange={(e) => handleChange(index, e.target.value)}
              required={required && index === 0}
              className="dynamic-array-field__input"
              placeholder={placeholder}
            />
            {values.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                className="dynamic-array-field__remove-btn"
                title="Eliminar"
              >
                <X className="dynamic-array-field__icon-remove" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="dynamic-array-field__add-btn"
        >
          <Plus className="dynamic-array-field__icon-add" />
          Agregar {label.toLowerCase()}
        </Button>
      </div>
    </div>
  );
}
