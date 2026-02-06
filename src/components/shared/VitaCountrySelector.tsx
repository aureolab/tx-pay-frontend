import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { VitaCountry } from '@/lib/vita-countries';

interface VitaCountrySelectorProps {
  value: string;
  onChange: (code: string) => void;
  countries: VitaCountry[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

/**
 * Get flag image URL from flagcdn.com
 * Uses ISO 3166-1 alpha-2 country codes (lowercase)
 * Special case: EU is not a country code, use European flag
 */
function getFlagUrl(code: string): string {
  // EU is a special case - use European Union flag
  if (code === 'EU') {
    return 'https://flagcdn.com/24x18/eu.png';
  }
  return `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;
}

export function VitaCountrySelector({
  value,
  onChange,
  countries,
  disabled = false,
  className = '',
  placeholder = 'Seleccionar país',
}: VitaCountrySelectorProps) {
  const selectedCountry = countries.find(c => c.code === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={`h-10 ${className}`}>
        <SelectValue placeholder={placeholder}>
          {selectedCountry && (
            <span className="flex items-center gap-2">
              <img
                src={getFlagUrl(selectedCountry.code)}
                alt={selectedCountry.name}
                className="w-6 h-4 object-cover rounded-sm"
                loading="lazy"
              />
              <span>{selectedCountry.name}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {countries.map(country => (
          <SelectItem key={country.code} value={country.code}>
            <span className="flex items-center gap-2">
              <img
                src={getFlagUrl(country.code)}
                alt={country.name}
                className="w-6 h-4 object-cover rounded-sm"
                loading="lazy"
              />
              <span>{country.name}</span>
              <span className="text-zinc-400 text-xs">({country.code})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
