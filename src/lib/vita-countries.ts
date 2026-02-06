/**
 * Vita Wallet supported countries configuration
 * These countries are available for payment processing through Vita Wallet
 */

export interface VitaCountry {
  code: string;
  name: string;
  flag: string;
}

export const VITA_WALLET_COUNTRIES: VitaCountry[] = [
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'EU', name: 'Unión Europea', flag: '🇪🇺' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
];

export const VITA_WALLET_COUNTRY_CODES = VITA_WALLET_COUNTRIES.map(c => c.code);

/**
 * Default country from environment variable or fallback to CL
 */
export const DEFAULT_VITA_COUNTRY = import.meta.env.VITE_DEFAULT_COUNTRY || 'CL';

/**
 * Get a VitaCountry by its code
 */
export function getVitaCountryByCode(code: string): VitaCountry | undefined {
  return VITA_WALLET_COUNTRIES.find(c => c.code === code);
}

/**
 * Check if a country code is valid for Vita Wallet
 */
export function isValidVitaCountry(code: string): boolean {
  return VITA_WALLET_COUNTRY_CODES.includes(code);
}
