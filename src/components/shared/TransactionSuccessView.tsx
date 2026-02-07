import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ExternalLink, Copy, Check, Clock, Sparkles } from 'lucide-react';
import { getStatusConfig } from '@/lib/constants';

interface TransactionSuccessViewProps {
  result: any;
  gradientClass: string;
  locale?: 'en' | 'es';
  onClose: () => void;
}

const labels = {
  en: {
    title: 'Transaction Created',
    subtitle: 'Your payment is ready to be processed',
    transactionId: 'Transaction ID',
    status: 'Status',
    paymentLink: 'Payment Link',
    qrCode: 'Scan to Pay',
    copy: 'Copy',
    copied: 'Copied!',
    copyLink: 'Copy Link',
    openPayment: 'Open Payment',
    close: 'Done',
    expiresIn: 'Expires in',
    minutes: 'min',
  },
  es: {
    title: 'Transaccion Creada',
    subtitle: 'Tu pago esta listo para ser procesado',
    transactionId: 'ID de Transaccion',
    status: 'Estado',
    paymentLink: 'Link de Pago',
    qrCode: 'Escanea para Pagar',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyLink: 'Copiar Link',
    openPayment: 'Abrir Pago',
    close: 'Listo',
    expiresIn: 'Expira en',
    minutes: 'min',
  },
};

export function TransactionSuccessView({ result, gradientClass, locale = 'en', onClose }: TransactionSuccessViewProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  const t = labels[locale];

  const checkoutUrl = result?.gateway_result?.checkout_url
    || result?.gateway_result?.authorization_payload_result?.started_transaction?.redirect_endpoint;

  const qrUrl = result?.gateway_result?.qr_url;
  const timeoutMinutes = result?.gateway_result?.timeout_minutes;

  const statusConfig = getStatusConfig(result.status, locale);

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Extract gradient colors for theming
  const isAmber = gradientClass.includes('amber');

  return (
    <div className="py-2 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Success Header with Celebration */}
      <div className="text-center space-y-3">
        {/* Animated Success Icon */}
        <div className="relative inline-flex">
          <div className={`
            w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientClass.split(' ')[0]}
            flex items-center justify-center shadow-lg
            ${isAmber ? 'shadow-amber-500/25' : 'shadow-blue-500/25'}
            animate-in zoom-in-50 duration-500
          `}>
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          {/* Sparkle decoration */}
          <Sparkles className={`
            absolute -top-1 -right-1 w-5 h-5
            ${isAmber ? 'text-amber-400' : 'text-blue-400'}
            animate-in spin-in-180 duration-700 delay-200
          `} />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">
            {t.title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t.subtitle}
          </p>
        </div>

        {/* Timer Badge */}
        {timeoutMinutes && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>{t.expiresIn} {timeoutMinutes} {t.minutes}</span>
          </div>
        )}
      </div>

      {/* Transaction Details Card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-800/30 overflow-hidden">
        {/* ID Row */}
        <div className="px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-700/60">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {t.transactionId}
            </span>
            <code className="text-xs font-mono text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900/50 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 truncate max-w-[180px]">
              {result._id}
            </code>
          </div>
        </div>

        {/* Status Row */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {t.status}
            </span>
            <Badge variant={statusConfig.variant} className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      {checkoutUrl && (
        <div className="space-y-4">
          {/* Payment Link Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                {t.paymentLink}
              </span>
            </div>

            {/* Link Input with Actions */}
            <div className="flex gap-2">
              <div className="flex-1 min-w-0 relative group">
                <input
                  type="text"
                  value={checkoutUrl}
                  readOnly
                  className="
                    w-full h-10 px-3 pr-10
                    text-xs font-mono text-zinc-600 dark:text-zinc-300
                    bg-white dark:bg-zinc-900/60
                    border border-zinc-200 dark:border-zinc-700
                    rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-offset-1
                    focus:ring-zinc-300 dark:focus:ring-zinc-600
                    truncate
                  "
                />
                <button
                  type="button"
                  onClick={() => handleCopy(checkoutUrl)}
                  className={`
                    absolute right-2 top-1/2 -translate-y-1/2
                    p-1.5 rounded-md transition-all duration-200
                    ${copiedLink
                      ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }
                  `}
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <Button
              type="button"
              className={`
                w-full h-11 gap-2
                bg-gradient-to-r ${gradientClass}
                text-white font-medium
                shadow-md hover:shadow-lg
                ${isAmber ? 'shadow-amber-500/20 hover:shadow-amber-500/30' : 'shadow-blue-500/20 hover:shadow-blue-500/30'}
                transition-all duration-200
              `}
              onClick={() => window.open(checkoutUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
              {t.openPayment}
            </Button>
          </div>

          {/* QR Code Section */}
          {qrUrl && (
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700/80">
              <div className="text-center space-y-3">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                  {t.qrCode}
                </span>

                {/* QR Container with styling */}
                <div className="inline-flex p-4 bg-white rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                  <QRCodeSVG
                    value={qrUrl}
                    size={140}
                    level="M"
                    includeMargin={false}
                    bgColor="transparent"
                    fgColor={isAmber ? '#d97706' : '#3b82f6'}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Done Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 font-medium border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        onClick={onClose}
      >
        {t.close}
      </Button>
    </div>
  );
}
