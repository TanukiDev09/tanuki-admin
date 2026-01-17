'use client';

interface MonthYearSelectProps {
  month: string;
  year: string;
  onMonthChange: (month: string) => void;
  onYearChange: (year: string) => void;
  required?: boolean;
}

export default function MonthYearSelect({
  month,
  year,
  onMonthChange,
  onYearChange,
  required = false,
}: MonthYearSelectProps) {
  const months = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  // Generar años desde 1900 hasta el año actual + 1
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1899 + 1 }, (_, i) => currentYear - i + 1);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <select
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          required={required}
          className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Mes</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <select
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          required={required}
          className="w-full px-4 py-2 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Año</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
