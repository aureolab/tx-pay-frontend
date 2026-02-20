import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Copy, Check, Sparkles, Link2, QrCode } from 'lucide-react';
import type { PaymentLink } from '@/types/payment-link.types';
import { formatCurrency } from '@/types/payment-link.types';

interface PaymentLinkSuccessViewProps {
  result: PaymentLink;
  gradientClass: string;
  onClose: () => void;
}

export function PaymentLinkSuccessView({ result, gradientClass, onClose }: PaymentLinkSuccessViewProps) {
  const [copiedCheckout, setCopiedCheckout] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);

  const isAmber = gradientClass.includes('amber');

  const handleCopy = async (url: string, type: 'checkout' | 'qr') => {
    await navigator.clipboard.writeText(url);
    if (type === 'checkout') {
      setCopiedCheckout(true);
      setTimeout(() => setCopiedCheckout(false), 2000);
    } else {
      setCopiedQr(true);
      setTimeout(() => setCopiedQr(false), 2000);
    }
  };

  const amountDisplay = result.amount_mode === 'FIXED' && result.fixed_amount
    ? formatCurrency(result.fixed_amount, result.currency)
    : 'Variable';

  const modeLabel = result.link_mode === 'SINGLE_USE' ? 'Uso unico' : 'Reutilizable';

  return (
    <div className="py-2 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Success Header */}
      <div className="text-center space-y-3">
        <div className="relative inline-flex">
          <div className={`
            w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientClass.split(' ')[0]}
            flex items-center justify-center shadow-lg
            ${isAmber ? 'shadow-amber-500/25' : 'shadow-blue-500/25'}
            animate-in zoom-in-50 duration-500
          `}>
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <Sparkles className={`
            absolute -top-1 -right-1 w-5 h-5
            ${isAmber ? 'text-amber-400' : 'text-blue-400'}
            animate-in spin-in-180 duration-700 delay-200
          `} />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">
            Link de Pago Creado
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Comparte el link para recibir pagos
          </p>
        </div>
      </div>

      {/* Payment Link Details Card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-800/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-700/60">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Nombre
            </span>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
              {result.name}
            </span>
          </div>
        </div>
        <div className="px-4 py-3 border-b border-zinc-200/80 dark:border-zinc-700/60">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Monto
            </span>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {amountDisplay}
            </span>
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Tipo
            </span>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {modeLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="space-y-3">
        {/* Checkout URL */}
        {result.checkout_url && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link2 className={`w-4 h-4 ${isAmber ? 'text-amber-500' : 'text-blue-500'}`} />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                Link de Pago
              </span>
            </div>
            <div className="flex-1 min-w-0 relative">
              <input
                type="text"
                value={result.checkout_url}
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
                onClick={() => handleCopy(result.checkout_url!, 'checkout')}
                className={`
                  absolute right-2 top-1/2 -translate-y-1/2
                  p-1.5 rounded-md transition-all duration-200
                  ${copiedCheckout
                    ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }
                `}
              >
                {copiedCheckout ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* QR URL */}
        {result.qr_url && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <QrCode className={`w-4 h-4 ${isAmber ? 'text-amber-500' : 'text-blue-500'}`} />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                Link QR
              </span>
            </div>
            <div className="flex-1 min-w-0 relative">
              <input
                type="text"
                value={result.qr_url}
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
                onClick={() => handleCopy(result.qr_url!, 'qr')}
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

      {/* Done Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 font-medium border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        onClick={onClose}
      >
        Listo
      </Button>
    </div>
  );
}
