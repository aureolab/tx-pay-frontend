import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PartnerTransaction } from '../../types/partner.types';
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
import { getStatusConfig, getPaymentMethodLabel } from '@/lib/constants';
import { getDecimalValue, formatCurrency } from '@/lib/formatters';
import { getVitaCountryByCode } from '@/lib/vita-countries';

interface Props {
  transaction: PartnerTransaction | null;
  merchantName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerTransactionDetailDialog({ transaction, merchantName, open, onOpenChange }: Props) {
  const { t } = useTranslation(['partner', 'common']);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);

  if (!transaction) return null;

  const statusConfig = getStatusConfig(transaction.status);
  const item = transaction;

  // Extract payment URLs
  const isPaymentLink = item.payment_method === 'PAYMENT_LINK' ||
    (item as any).gateway_result?.original_payment_method === 'PAYMENT_LINK';

  const checkoutUrl = (item as any).gateway_result?.checkout_url;
  const qrUrl = (item as any).gateway_result?.qr_url;
  const redirectUrl = (item as any).gateway_result?.authorization_payload_result?.started_transaction?.redirect_endpoint;

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
      <DialogContent className="max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-amber-900/5 dark:shadow-amber-900/20 p-0 gap-0 overflow-hidden">
        {/* Decorative top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
              <CreditCard className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              {t('partner:dialogs.transactionDetail.title')}
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
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.transactionDetail.status')}</Label>
                <div className="mt-1">
                  <Badge variant={statusConfig.variant} className={statusConfig.className}>{statusConfig.label}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.transactionDetail.paymentMethod')}</Label>
                <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{getPaymentMethodLabel(item.payment_method) || '-'}</p>
              </div>
            </div>

            {/* Payment URLs */}
            {hasPaymentUrls && (
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.transactionDetail.paymentUrls')}</Label>
                <div className="mt-2 space-y-3">
                  {/* Direct Link */}
                  {directUrl && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Link2 className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          {t('partner:dialogs.transactionDetail.directLink')}
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
                          {t('partner:dialogs.transactionDetail.qrLink')}
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
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.transactionDetail.financialDetails')}</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.transactionDetail.grossAmount')}</Label>
                  <p className="font-semibold text-lg text-zinc-900 dark:text-white">
                    {formatCurrency(getDecimalValue(item.financials.amount_gross), item.financials.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.transactionDetail.netAmount')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {item.financials?.amount_net
                      ? formatCurrency(getDecimalValue(item.financials.amount_net), item.financials.currency)
                      : '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.transactionDetail.currency')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white">{item.financials?.currency || '-'}</p>
                </div>
              </div>
              {item.financials?.fee_snapshot && (
                <div className="mt-2 bg-zinc-50/80 dark:bg-zinc-800/30 p-3 rounded-lg text-sm border border-zinc-200/60 dark:border-zinc-700/40 space-y-1">
                  <p>
                    <span className="text-zinc-500">{t('partner:dialogs.transactionDetail.feeFixed')}:</span>{' '}
                    {getDecimalValue(item.financials.fee_snapshot.fixed)}
                  </p>
                  <p>
                    <span className="text-zinc-500">{t('partner:dialogs.transactionDetail.feePercentage')}:</span>{' '}
                    {getDecimalValue(item.financials.fee_snapshot.percentage)}%
                  </p>
                  <p>
                    <span className="text-zinc-500">{t('partner:dialogs.transactionDetail.ivaPercentage')}:</span>{' '}
                    {getDecimalValue(item.financials.fee_snapshot.iva_percentage || 0)}%
                  </p>
                  <p>
                    <span className="text-zinc-500">{t('partner:dialogs.transactionDetail.ivaAmount')}:</span>{' '}
                    {formatCurrency(getDecimalValue(item.financials.fee_snapshot.iva_amount || 0), item.financials.currency)}
                  </p>
                  <div className="pt-1 mt-1 border-t border-zinc-200/60 dark:border-zinc-700/40">
                    <p className="font-medium">
                      <span className="text-zinc-500">{t('partner:dialogs.transactionDetail.totalFee')}:</span>{' '}
                      {formatCurrency(
                        getDecimalValue(item.financials.amount_gross) - getDecimalValue(item.financials.amount_net || 0),
                        item.financials.currency
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* References */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.transactionDetail.references')}</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="min-w-0">
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.transactionDetail.merchantName')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{merchantName || item.merchant_id || '-'}</p>
                </div>
                {item.terminal_id && (
                  <div className="min-w-0">
                    <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.transactionDetail.terminalId')}</Label>
                    <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg break-all mt-0.5">{item.terminal_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* External Reference */}
            {item.external_reference && (
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.transactionDetail.externalReference')}</Label>
                <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg break-all mt-1">{item.external_reference}</p>
              </div>
            )}

            {/* Callback URL */}
            {item.callback_url && (
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.transactionDetail.callbackUrl')}</Label>
                <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg break-all mt-1">{item.callback_url}</p>
              </div>
            )}

            {/* Vita Country */}
            {item.vita_country && (
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.transactionDetail.vitaCountry')}</Label>
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

            {/* Expires At */}
            {item.expires_at && (
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.transactionDetail.expiresAt')}</Label>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{new Date(item.expires_at).toLocaleString()}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.common.createdAt')}</Label>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.common.updatedAt')}</Label>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
