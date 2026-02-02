import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';
import { CreditCard, ExternalLink } from 'lucide-react';
import { getStatusConfig } from '@/lib/constants';

interface TransactionSuccessViewProps {
  result: any;
  gradientClass: string;
  locale?: 'en' | 'es';
  onClose: () => void;
}

export function TransactionSuccessView({ result, gradientClass, locale = 'en', onClose }: TransactionSuccessViewProps) {
  const checkoutUrl = result?.gateway_result?.checkout_url
    || result?.gateway_result?.authorization_payload_result?.started_transaction?.redirect_endpoint;

  const statusConfig = getStatusConfig(result.status, locale);

  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
          {locale === 'es' ? 'Transaccion Creada' : 'Transaction Created'}
        </h3>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {locale === 'es' ? 'ID de Transaccion' : 'Transaction ID'}
        </p>
        <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg">{result._id}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {locale === 'es' ? 'Estado' : 'Status'}
        </p>
        <Badge variant={statusConfig.variant} className={statusConfig.className}>
          {statusConfig.label}
        </Badge>
      </div>

      {checkoutUrl && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {locale === 'es' ? 'Link de Pago' : 'Payment Link'}
          </p>
          <div className="flex gap-2">
            <Input value={checkoutUrl} readOnly className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(checkoutUrl)}
            >
              {locale === 'es' ? 'Copiar' : 'Copy'}
            </Button>
          </div>
          <Button
            type="button"
            className={`w-full gap-2 bg-gradient-to-r ${gradientClass} text-white`}
            onClick={() => window.open(checkoutUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            {locale === 'es' ? 'Abrir Pagina de Pago' : 'Open Payment Page'}
          </Button>
        </div>
      )}

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" className="w-full" onClick={onClose}>
          {locale === 'es' ? 'Cerrar' : 'Close'}
        </Button>
      </DialogFooter>
    </div>
  );
}
