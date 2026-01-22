'use client';

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import './PeriodSelector.scss';

interface PeriodSelectorProps {
  year: number;
  month: number | null;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number | null) => void;
  type: 'monthly' | 'annual';
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function PeriodSelector({ year, month, onYearChange, onMonthChange, type }: PeriodSelectorProps) {
  const currentYear = new Date().getFullYear();
  const startYear = 2018;
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i).reverse();

  const handlePrev = () => {
    if (type === 'monthly' && month !== null) {
      if (month === 1) {
        onYearChange(year - 1);
        onMonthChange(12);
      } else {
        onMonthChange(month - 1);
      }
    } else {
      onYearChange(year - 1);
    }
  };

  const handleNext = () => {
    if (type === 'monthly' && month !== null) {
      if (month === 12) {
        onYearChange(year + 1);
        onMonthChange(1);
      } else {
        onMonthChange(month + 1);
      }
    } else {
      onYearChange(year + 1);
    }
  };

  return (
    <div className="period-selector">
      <div className="period-selector__controls">
        <Button variant="outline" size="icon" onClick={handlePrev} className="period-selector__btn">
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="period-selector__selects">
          <Calendar className="w-4 h-4 text-muted-foreground mr-2" />

          {type === 'monthly' && (
            <Select
              value={month?.toString()}
              onValueChange={(val) => onMonthChange(parseInt(val))}
            >
              <SelectTrigger className="period-selector__trigger w-[130px]">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((name, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={year.toString()}
            onValueChange={(val) => onYearChange(parseInt(val))}
          >
            <SelectTrigger className="period-selector__trigger w-[100px]">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="icon" onClick={handleNext} className="period-selector__btn">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
