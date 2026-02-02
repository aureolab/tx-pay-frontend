import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Search, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date';
  placeholder?: string;
  options?: FilterOption[];
}

interface FilterBarProps {
  config: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
  hasFilters: boolean;
}

function DebouncedTextInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [localValue, value, onChange]);

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className={`pl-8 ${className || ''}`}
      />
    </div>
  );
}

function DatePickerFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const { t, i18n } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const dateValue = value ? parseISO(value) : undefined;
  const isSpanish = i18n.language?.startsWith('es');

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange('');
    }
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[150px] h-9 justify-start text-left text-sm font-normal bg-white dark:bg-zinc-900',
              !dateValue && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
            {dateValue ? format(dateValue, 'dd/MM/yyyy') : t('filters.select')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleSelect}
            defaultMonth={dateValue}
            locale={isSpanish ? es : undefined}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function FilterBar({ config, values, onChange, onClear, hasFilters }: FilterBarProps) {
  const { t } = useTranslation('common');

  if (config.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/30">
      {config.map((filter) => {
        if (filter.type === 'select') {
          return (
            <Select
              key={filter.key}
              value={values[filter.key] || '__all__'}
              onValueChange={(val) => onChange(filter.key, val === '__all__' ? '' : val)}
            >
              <SelectTrigger className="w-[160px] h-9 text-sm bg-white dark:bg-zinc-900">
                <SelectValue placeholder={filter.placeholder || filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{filter.placeholder || filter.label}</SelectItem>
                {filter.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        if (filter.type === 'text') {
          return (
            <DebouncedTextInput
              key={filter.key}
              value={values[filter.key] || ''}
              onChange={(val) => onChange(filter.key, val)}
              placeholder={filter.placeholder || t('filters.search')}
              className="w-[200px] h-9 text-sm bg-white dark:bg-zinc-900"
            />
          );
        }

        if (filter.type === 'date') {
          return (
            <DatePickerFilter
              key={filter.key}
              label={filter.label}
              value={values[filter.key] || ''}
              onChange={(val) => onChange(filter.key, val)}
            />
          );
        }

        return null;
      })}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-9 gap-1 text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
        >
          <X className="h-3.5 w-3.5" />
          {t('filters.clearFilters')}
        </Button>
      )}
    </div>
  );
}
