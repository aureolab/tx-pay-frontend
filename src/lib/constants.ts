import i18n from '@/i18n';
import type { StatusConfig } from '@/types/dashboard.types';

export const AdminRoles = ['SUPER_ADMIN', 'FINANCE', 'SUPPORT', 'COMPLIANCE'] as const;
export const MerchantStatuses = ['ACTIVE', 'BLOCKED', 'REVIEW', 'INACTIVE'] as const;
// Note: QR has been consolidated into PAYMENT_LINK - when creating a PAYMENT_LINK, both direct URL and QR URL are returned
export const PaymentMethods = ['CREDIT', 'DEBIT', 'PREPAID', 'PAYMENT_LINK', 'VITA_WALLET', 'WEBPAY'] as const;
export const PartnerStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
export const PartnerUserTypes = ['PARTNER', 'CLIENT'] as const;
export const PartnerUserStatuses = ['ACTIVE', 'INACTIVE'] as const;
export const TransactionStatuses = ['CREATED', 'PENDING', 'APPROVED', 'REJECTED', 'VOIDED', 'REFUNDED', 'EXPIRED'] as const;
export const TransactionCurrencies = ['CLP', 'USD'] as const;

const STATUS_STYLES: Record<string, { variant: StatusConfig['variant']; className: string }> = {
  APPROVED: { variant: 'default', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  CAPTURED: { variant: 'default', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  PENDING: { variant: 'secondary', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  CREATED: { variant: 'secondary', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  EXPIRED: { variant: 'destructive', className: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20' },
  REJECTED: { variant: 'destructive', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  VOIDED: { variant: 'destructive', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  REFUNDED: { variant: 'outline', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  ACTIVE: { variant: 'default', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  BLOCKED: { variant: 'destructive', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  REVIEW: { variant: 'secondary', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  INACTIVE: { variant: 'outline', className: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20' },
  SUSPENDED: { variant: 'destructive', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
};

const STATUS_LABELS: Record<string, { en: string; es: string }> = {
  APPROVED: { en: 'Approved', es: 'Aprobada' },
  CAPTURED: { en: 'Captured', es: 'Capturada' },
  PENDING: { en: 'Pending', es: 'Pendiente' },
  CREATED: { en: 'Created', es: 'Creada' },
  EXPIRED: { en: 'Expired', es: 'Expirada' },
  REJECTED: { en: 'Rejected', es: 'Rechazada' },
  VOIDED: { en: 'Voided', es: 'Anulada' },
  REFUNDED: { en: 'Refunded', es: 'Reembolsada' },
  ACTIVE: { en: 'Active', es: 'Activo' },
  BLOCKED: { en: 'Blocked', es: 'Bloqueado' },
  REVIEW: { en: 'Review', es: 'En revision' },
  INACTIVE: { en: 'Inactive', es: 'Inactivo' },
  SUSPENDED: { en: 'Suspended', es: 'Suspendido' },
};

function resolveLocale(locale?: 'en' | 'es'): 'en' | 'es' {
  if (locale) return locale;
  return i18n.language?.startsWith('es') ? 'es' : 'en';
}

export function getStatusConfig(status: string, locale?: 'en' | 'es'): StatusConfig {
  const style = STATUS_STYLES[status] || { variant: 'outline' as const, className: '' };
  const labels = STATUS_LABELS[status];
  return { ...style, label: labels?.[resolveLocale(locale)] || status };
}

const PAYMENT_METHOD_LABELS: Record<string, { en: string; es: string }> = {
  PAYMENT_LINK: { en: 'Payment Link', es: 'Link de Pago' },
  QR: { en: 'QR Code', es: 'Codigo QR' },
  CREDIT: { en: 'Credit', es: 'Credito' },
  DEBIT: { en: 'Debit', es: 'Debito' },
  PREPAID: { en: 'Prepaid', es: 'Prepago' },
  VITA_WALLET: { en: 'Vita Wallet', es: 'Vita Wallet' },
  WEBPAY: { en: 'Webpay', es: 'Webpay' },
};

export function getPaymentMethodLabel(method: string, locale?: 'en' | 'es'): string {
  return PAYMENT_METHOD_LABELS[method]?.[resolveLocale(locale)] || method;
}
