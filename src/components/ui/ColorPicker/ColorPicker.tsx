'use client';

import * as React from 'react';
import {
  WARM_COLORS,
  COLD_COLORS,
  NEUTRAL_COLORS,
  CATEGORY_COLORS,
} from '@/styles/category-colors';
import './ColorPicker.scss';

export { CATEGORY_COLORS };

export interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={`color-picker ${className || ''}`}>
      <div className="color-picker__section">
        <span className="color-picker__label">Gastos (Cálidos)</span>
        <div className="color-picker__grid">
          {WARM_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`color-picker__swatch ${value === color ? 'color-picker__swatch--active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
              aria-label={`Seleccionar color ${color}`}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="color-picker__section">
        <span className="color-picker__label">Ingresos (Fríos)</span>
        <div className="color-picker__grid">
          {COLD_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`color-picker__swatch ${value === color ? 'color-picker__swatch--active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
              aria-label={`Seleccionar color ${color}`}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="color-picker__section">
        <span className="color-picker__label">Otros</span>
        <div className="color-picker__grid">
          {NEUTRAL_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`color-picker__swatch ${value === color ? 'color-picker__swatch--active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
              aria-label={`Seleccionar color ${color}`}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
