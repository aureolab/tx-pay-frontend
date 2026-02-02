import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreditCard } from 'lucide-react';
import { getStatusConfig, getPaymentMethodLabel } from '@/lib/constants';

export function TransactionDetailDialog({ item, open, onOpenChange }: { item: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation('admin');
  if (!item) return null;
  const statusConfig = getStatusConfig(item.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-blue-900/5 dark:shadow-blue-900/20 p-0 gap-0 overflow-hidden">
        {/* Decorative top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <CreditCard className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              {t('dialogs.transactionDetail.title')}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {t('dialogs.transactionDetail.description', { id: item._id })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 pb-6 pt-4 grid gap-4">
            {/* Status & Payment Method */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.status')}</Label>
                <div className="mt-1">
                  <Badge variant={statusConfig.variant} className={statusConfig.className}>{statusConfig.label}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.paymentMethod')}</Label>
                <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{getPaymentMethodLabel(item.payment_method) || '-'}</p>
              </div>
            </div>

            {/* Financials */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.financialDetails')}</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.grossAmount')}</Label>
                  <p className="font-semibold text-lg text-zinc-900 dark:text-white">
                    {item.financials?.currency} {
                      item.financials?.amount_gross?.$numberDecimal ||
                      item.financials?.amount_gross?.toLocaleString() ||
                      item.financials?.amount_gross
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.netAmount')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {item.financials?.currency} {
                      item.financials?.amount_net?.$numberDecimal ||
                      item.financials?.amount_net?.toLocaleString() ||
                      item.financials?.amount_net || '-'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.currency')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white">{item.financials?.currency || '-'}</p>
                </div>
              </div>
              {item.financials?.fee_snapshot && (
                <div className="mt-2 bg-zinc-50/80 dark:bg-zinc-800/30 p-3 rounded-lg text-sm border border-zinc-200/60 dark:border-zinc-700/40">
                  <p><span className="text-zinc-500">{t('dialogs.transactionDetail.feeFixed')}</span> {item.financials.fee_snapshot.fixed?.$numberDecimal || item.financials.fee_snapshot.fixed || 0}</p>
                  <p><span className="text-zinc-500">{t('dialogs.transactionDetail.feePercentage')}</span> {item.financials.fee_snapshot.percentage?.$numberDecimal || item.financials.fee_snapshot.percentage || 0}%</p>
                </div>
              )}
            </div>

            {/* IDs */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.references')}</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="min-w-0">
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.merchantId')}</Label>
                  <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg break-all mt-0.5">{item.merchant_id || '-'}</p>
                </div>
                {item.terminal_id && (
                  <div className="min-w-0">
                    <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.terminalId')}</Label>
                    <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg break-all mt-0.5">{item.terminal_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* User Context */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.userContext')}</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.isGuest')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.user_context?.is_guest ? t('dialogs.common.yes') : t('dialogs.common.no')}</p>
                </div>
                {item.user_context?.psp_user_id && (
                  <div className="min-w-0">
                    <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.pspUserId')}</Label>
                    <p className="font-mono text-sm break-all mt-0.5">{item.user_context.psp_user_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Callback URL */}
            {item.callback_url && (
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.callbackUrl')}</Label>
                <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg break-all mt-1">{item.callback_url}</p>
              </div>
            )}

            {/* Gateway Result */}
            {item.gateway_result && Object.keys(item.gateway_result).length > 0 && (
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.gatewayResult')}</Label>
                <ScrollArea className="mt-2 h-40 rounded-lg border border-zinc-200/80 dark:border-zinc-700/50 bg-zinc-50/80 dark:bg-zinc-800/30">
                  <pre className="p-3 text-xs whitespace-pre-wrap break-all">
                    {JSON.stringify(item.gateway_result, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}

            {/* Expires At */}
            {item.expires_at && (
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.expiresAt')}</Label>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{new Date(item.expires_at).toLocaleString()}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.common.createdAt')}</Label>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.common.updatedAt')}</Label>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
