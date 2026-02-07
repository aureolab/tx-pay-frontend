import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';
import { CreditCard, ExternalLink, Copy, QrCode, Link2, Check } from 'lucide-react';
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
    transactionId: 'Transaction ID',
    status: 'Status',
    paymentLink: 'Payment Link',
    qrCode: 'QR Code',
    copy: 'Copy',
    copied: 'Copied!',
    copyLink: 'Copy Link',
    copyQrUrl: 'Copy QR URL',
    openPaymentPage: 'Open Payment Page',
    openQrPage: 'Open QR Page',
    close: 'Close',
    expiresIn: 'Expires in',
    minutes: 'minutes',
  },
  es: {
    title: 'Transaccion Creada',
    transactionId: 'ID de Transaccion',
    status: 'Estado',
    paymentLink: 'Link de Pago',
    qrCode: 'Codigo QR',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyLink: 'Copiar Link',
    copyQrUrl: 'Copiar URL QR',
    openPaymentPage: 'Abrir Pagina de Pago',
    openQrPage: 'Abrir Pagina QR',
    close: 'Cerrar',
    expiresIn: 'Expira en',
    minutes: 'minutos',
  },
};

export function TransactionSuccessView({ result, gradientClass, locale = 'en', onClose }: TransactionSuccessViewProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);

  const t = labels[locale];

  const checkoutUrl = result?.gateway_result?.checkout_url
    || result?.gateway_result?.authorization_payload_result?.started_transaction?.redirect_endpoint;

  const qrUrl = result?.gateway_result?.qr_url;
  const timeoutMinutes = result?.gateway_result?.timeout_minutes;

  const statusConfig = getStatusConfig(result.status, locale);

  const handleCopy = async (url: string, type: 'link' | 'qr') => {
    await navigator.clipboard.writeText(url);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedQr(true);
      setTimeout(() => setCopiedQr(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
          {t.title}
        </h3>
        {timeoutMinutes && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t.expiresIn} {timeoutMinutes} {t.minutes}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.transactionId}</p>
        <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg">{result._id}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.status}</p>
        <Badge variant={statusConfig.variant} className={statusConfig.className}>
          {statusConfig.label}
        </Badge>
      </div>

      {checkoutUrl && (
        <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
          {/* Payment Link Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-zinc-500" />
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{t.paymentLink}</p>
            </div>
            <div className="flex gap-2">
              <Input value={checkoutUrl} readOnly className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy(checkoutUrl, 'link')}
                className="shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button
              type="button"
              className={`w-full gap-2 bg-gradient-to-r ${gradientClass} text-white`}
              onClick={() => window.open(checkoutUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
              {t.openPaymentPage}
            </Button>
          </div>

          {/* QR Code Section */}
          {qrUrl && (
            <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-zinc-500" />
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{t.qrCode}</p>
              </div>

              {/* QR Code Display */}
              <div className="flex justify-center p-4 bg-white rounded-lg border border-zinc-200 dark:border-zinc-700">
                <QRCodeSVG
                  value={qrUrl}
                  size={160}
                  level="M"
                  includeMargin={true}
                />
              </div>

              {/* QR URL Actions */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(qrUrl, 'qr')}
                  className="flex-1 gap-2"
                >
                  {copiedQr ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copiedQr ? t.copied : t.copyQrUrl}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(qrUrl, '_blank')}
                  className="flex-1 gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t.openQrPage}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" className="w-full" onClick={onClose}>
          {t.close}
        </Button>
      </DialogFooter>
    </div>
  );
}
