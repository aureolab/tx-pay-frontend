import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreditCard, Link2, QrCode, Copy, Check, ExternalLink } from 'lucide-react';
import type { Transaction } from '@/types/admin.types';
import { getStatusConfig, getPaymentMethodLabel } from '@/lib/constants';
import { getVitaCountryByCode } from '@/lib/vita-countries';

/** Safely extract a value from a MongoDecimal (number | { $numberDecimal: string }) */
const getDecimal = (val: unknown): string | number => {
  if (typeof val === 'object' && val !== null && '$numberDecimal' in val)
    return (val as { $numberDecimal: string }).$numberDecimal;
  return val as number;
};

export function TransactionDetailDialog({ item, open, onOpenChange }: { item: Transaction | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation('admin');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);

  if (!item) return null;
  const statusConfig = getStatusConfig(item.status);

  // Extract payment URLs
  const isPaymentLink = item.payment_method === 'PAYMENT_LINK' ||
    item.gateway_result?.original_payment_method === 'PAYMENT_LINK';

  const checkoutUrl = item.gateway_result?.checkout_url;
  const qrUrl = item.gateway_result?.qr_url;
  const redirectUrl = item.gateway_result?.authorization_payload_result?.started_transaction?.redirect_endpoint;

  // Determine which URL to show for non-PAYMENT_LINK methods
  const directUrl = isPaymentLink ? checkoutUrl : redirectUrl;
  const hasPaymentUrls = directUrl || qrUrl;

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
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 truncate max-w-[260px]">
              {item._id}
            </code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(item._id);
                setCopiedId(true);
                setTimeout(() => setCopiedId(false), 2000);
              }}
              className={`
                p-1 rounded-md transition-all duration-200 flex-shrink-0
                ${copiedId
                  ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }
              `}
            >
              {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
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

            {/* Payment URLs */}
            {hasPaymentUrls && (
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.paymentUrls')}</Label>
                <div className="mt-2 space-y-3">
                  {/* Direct Link */}
                  {directUrl && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          {t('dialogs.transactionDetail.directLink')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Input value={directUrl} readOnly className="font-mono text-xs h-9" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 px-2.5"
                          onClick={() => handleCopy(directUrl, 'link')}
                        >
                          {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 px-2.5"
                          onClick={() => window.open(directUrl, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* QR Link (only for PAYMENT_LINK) */}
                  {isPaymentLink && qrUrl && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          {t('dialogs.transactionDetail.qrLink')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Input value={qrUrl} readOnly className="font-mono text-xs h-9" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 px-2.5"
                          onClick={() => handleCopy(qrUrl, 'qr')}
                        >
                          {copiedQr ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 px-2.5"
                          onClick={() => window.open(qrUrl, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Financials */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.financialDetails')}</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.grossAmount')}</Label>
                  <p className="font-semibold text-lg text-zinc-900 dark:text-white">
                    {item.financials?.currency} {getDecimal(item.financials?.amount_gross)}
                  </p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.netAmount')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {item.financials?.currency} {item.financials?.amount_net ? getDecimal(item.financials.amount_net) : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.currency')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white">{item.financials?.currency || '-'}</p>
                </div>
              </div>
              {item.financials?.fee_snapshot && (
                <div className="mt-2 bg-zinc-50/80 dark:bg-zinc-800/30 p-3 rounded-lg text-sm border border-zinc-200/60 dark:border-zinc-700/40 space-y-1">
                  <p><span className="text-zinc-500">{t('dialogs.transactionDetail.feeFixed')}:</span> {getDecimal(item.financials.fee_snapshot.fixed) || 0}</p>
                  <p><span className="text-zinc-500">{t('dialogs.transactionDetail.feePercentage')}:</span> {getDecimal(item.financials.fee_snapshot.percentage) || 0}%</p>
                  <p><span className="text-zinc-500">{t('dialogs.transactionDetail.ivaPercentage')}:</span> {item.financials.fee_snapshot.iva_percentage ? getDecimal(item.financials.fee_snapshot.iva_percentage) : 0}%</p>
                  <p><span className="text-zinc-500">{t('dialogs.transactionDetail.ivaAmount')}:</span> {item.financials?.currency} {item.financials.fee_snapshot.iva_amount ? getDecimal(item.financials.fee_snapshot.iva_amount) : 0}</p>
                  <div className="pt-1 mt-1 border-t border-zinc-200/60 dark:border-zinc-700/40">
                    <p className="font-medium"><span className="text-zinc-500">{t('dialogs.transactionDetail.totalFee')}:</span> {item.financials?.currency} {
                      (() => {
                        const gross = parseFloat(String(getDecimal(item.financials?.amount_gross) || 0));
                        const net = parseFloat(String(getDecimal(item.financials?.amount_net) || 0));
                        return (gross - net).toFixed(2);
                      })()
                    }</p>
                  </div>
                  {item.financials?.fee_snapshot?.provider_fee_amount && (
                    <div className="pt-1 mt-1 border-t border-zinc-200/60 dark:border-zinc-700/40 space-y-1">
                      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{t('dialogs.transactionDetail.feeBreakdown')}</p>
                      <p><span className="text-zinc-500">{t('dialogs.transactionDetail.providerFee')}:</span> {item.financials?.currency} {getDecimal(item.financials.fee_snapshot.provider_fee_amount)} ({getDecimal(item.financials.fee_snapshot.provider_fee_percentage)}%)</p>
                      <p><span className="text-zinc-500">{t('dialogs.transactionDetail.txPayMargin')}:</span> {item.financials?.currency} {
                        (() => {
                          const totalFee = parseFloat(String(getDecimal(item.financials?.amount_gross) || 0)) - parseFloat(String(getDecimal(item.financials?.amount_net) || 0));
                          const providerFee = parseFloat(String(getDecimal(item.financials?.fee_snapshot?.provider_fee_amount) || 0));
                          return (totalFee - providerFee).toFixed(2);
                        })()
                      }</p>
                    </div>
                  )}
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

            {/* Vita Country */}
            {item.vita_country && (
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.transactionDetail.vitaCountry')}</Label>
                <p className="font-medium text-zinc-900 dark:text-white mt-0.5 flex items-center gap-2">
                  {(() => {
                    const country = getVitaCountryByCode(item.vita_country);
                    const flagUrl = item.vita_country === 'EU'
                      ? 'https://flagcdn.com/24x18/eu.png'
                      : `https://flagcdn.com/24x18/${item.vita_country.toLowerCase()}.png`;
                    return country ? (
                      <>
                        <img src={flagUrl} alt={country.name} className="w-6 h-4 object-cover rounded-sm" />
                        <span>{country.name}</span>
                      </>
                    ) : item.vita_country;
                  })()}
                </p>
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
