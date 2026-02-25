import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Copy, Check, Clock, Sparkles, Link2, QrCode } from 'lucide-react';
import { getStatusConfig } from '@/lib/constants';

interface TransactionSuccessViewProps {
  result: Record<string, unknown>;
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
    paymentLink: 'Direct Link',
    qrLink: 'QR Link',
    close: 'Done',
    expiresIn: 'Expires in',
    minutes: 'min',
  },
  es: {
    title: 'Transaccion Creada',
    subtitle: 'Tu pago esta listo para ser procesado',
    transactionId: 'ID de Transaccion',
    status: 'Estado',
    paymentLink: 'Link Directo',
    qrLink: 'Link QR',
    close: 'Listo',
    expiresIn: 'Expira en',
    minutes: 'min',
  },
};

export function TransactionSuccessView({ result, gradientClass, locale = 'en', onClose }: TransactionSuccessViewProps) {
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);

  const t = labels[locale];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gr = result?.gateway_result as Record<string, any> | undefined;
  const checkoutUrl = gr?.checkout_url
    || gr?.authorization_payload_result?.started_transaction?.redirect_endpoint;

  const qrUrl = gr?.qr_url;
  const timeoutMinutes = gr?.timeout_minutes;

  const statusConfig = getStatusConfig(result.status as string, locale);

  const handleCopy = async (url: string, type: 'direct' | 'qr') => {
    await navigator.clipboard.writeText(url);
    if (type === 'direct') {
      setCopiedDirect(true);
      setTimeout(() => setCopiedDirect(false), 2000);
    } else {
      setCopiedQr(true);
      setTimeout(() => setCopiedQr(false), 2000);
    }
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
              {String(result._id)}
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

      {/* Payment Links */}
      {checkoutUrl && (
        <div className="space-y-3">
          {/* Direct Link */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link2 className={`w-4 h-4 ${isAmber ? 'text-amber-500' : 'text-blue-500'}`} />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                {t.paymentLink}
              </span>
            </div>
            <div className="flex-1 min-w-0 relative">
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
                onClick={() => handleCopy(checkoutUrl, 'direct')}
                className={`
                  absolute right-2 top-1/2 -translate-y-1/2
                  p-1.5 rounded-md transition-all duration-200
                  ${copiedDirect
                    ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }
                `}
              >
                {copiedDirect ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* QR Link */}
          {qrUrl && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <QrCode className={`w-4 h-4 ${isAmber ? 'text-amber-500' : 'text-blue-500'}`} />
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                  {t.qrLink}
                </span>
              </div>
              <div className="flex-1 min-w-0 relative">
                <input
                  type="text"
                  value={qrUrl}
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
                  onClick={() => handleCopy(qrUrl, 'qr')}
                  className={`
                    absolute right-2 top-1/2 -translate-y-1/2
                    p-1.5 rounded-md transition-all duration-200
                    ${copiedQr
                      ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }
                  `}
                >
                  {copiedQr ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
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
