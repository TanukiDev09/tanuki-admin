'use client';

import * as React from 'react';
import './ColorPicker.scss';

export const CATEGORY_COLORS = [
  '#64748b', // Slate
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
];

export interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  return (
    <div className={`color-picker ${className || ''}`}>
      <div className="color-picker__grid">
        {CATEGORY_COLORS.map((color) => (
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
  );
}
