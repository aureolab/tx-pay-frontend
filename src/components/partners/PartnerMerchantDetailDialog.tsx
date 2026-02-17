import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { partnerMerchantsApi } from '../../api/partnerClient';
import type { PartnerMerchant } from '../../types/partner.types';
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
import { Store } from 'lucide-react';
import { getStatusConfig, getPaymentMethodLabel } from '@/lib/constants';
import { getDecimalValue } from '@/lib/formatters';

interface Props {
  merchant: PartnerMerchant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerMerchantDetailDialog({ merchant, open, onOpenChange }: Props) {
  const { t } = useTranslation(['partner', 'common']);
  const [detail, setDetail] = useState<PartnerMerchant | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && merchant?._id) {
      setLoading(true);
      partnerMerchantsApi.getOne(merchant._id)
        .then(res => setDetail(res.data))
        .catch(() => setDetail(merchant))
        .finally(() => setLoading(false));
    }
    if (!open) {
      setDetail(null);
    }
  }, [open, merchant?._id]);

  const item = detail || merchant;
  if (!item) return null;

  const statusConfig = getStatusConfig(item.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-amber-900/5 dark:shadow-amber-900/20 p-0 gap-0 overflow-hidden flex flex-col">
        {/* Decorative top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 flex-shrink-0" />

        <DialogHeader className="px-6 pt-5 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Store className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              {t('partner:dialogs.merchantDetail.title')}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {t('partner:dialogs.merchantDetail.description', { name: item.profile?.fantasy_name })}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="px-6 pb-6 pt-4 flex items-center justify-center h-40">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(90vh-100px)]">
            <div className="px-6 pb-6 grid gap-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.merchantDetail.fantasyName')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.profile?.fantasy_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.merchantDetail.legalName')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.profile?.legal_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.merchantDetail.taxId')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.profile?.tax_id || '-'}</p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.merchantDetail.mcc')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.profile?.mcc || '-'}</p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.merchantDetail.contactEmail')}</Label>
                  <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.profile?.contact_email || '-'}</p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.merchantDetail.status')}</Label>
                  <div className="mt-1">
                    <Badge variant={statusConfig.variant} className={statusConfig.className}>{statusConfig.label}</Badge>
                  </div>
                </div>
              </div>

              {/* Merchant ID */}
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.merchantDetail.merchantId')}</Label>
                <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg mt-1">{item._id}</p>
              </div>

              {/* API Integration - Public Key Only */}
              {item.integration?.public_key && (
                <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.merchantDetail.apiIntegration')}</Label>
                  <div className="mt-2">
                    <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.merchantDetail.publicKey')}</Label>
                    <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg break-all mt-0.5">{item.integration.public_key}</p>
                  </div>
                </div>
              )}

              {/* Payment Methods */}
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.merchantDetail.enabledPaymentMethods')}</Label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {item.enabled_payment_methods?.length > 0 ? item.enabled_payment_methods.filter((m: string) => m !== 'QR').map((method: string) => (
                    <Badge key={method} variant="outline" className="text-xs bg-amber-500/5 text-amber-700 dark:text-amber-300 border-amber-500/20">{getPaymentMethodLabel(method)}</Badge>
                  )) : <span className="text-zinc-500 text-sm">{t('partner:dialogs.common.none')}</span>}
                </div>
              </div>

              {/* Pricing Rules */}
              {item.pricing_rules?.fees && item.pricing_rules.fees.length > 0 && (
                <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.merchantDetail.pricingRules')}</Label>
                  <div className="space-y-2 mt-2">
                    {item.pricing_rules.fees.map((fee: { method: string; fixed: any; percentage: any }, idx: number) => (
                      <div key={idx} className="bg-zinc-50/80 dark:bg-zinc-800/30 p-3 rounded-lg text-sm border border-zinc-200/60 dark:border-zinc-700/40">
                        <p><span className="text-zinc-500">{t('partner:dialogs.merchantDetail.method')}</span> {getPaymentMethodLabel(fee.method)}</p>
                        <p><span className="text-zinc-500">{t('partner:dialogs.merchantDetail.fixed')}</span> {getDecimalValue(fee.fixed)}</p>
                        <p><span className="text-zinc-500">{t('partner:dialogs.merchantDetail.percentage')}</span> {getDecimalValue(fee.percentage)}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings */}
              {item.payment_link_timeout_minutes && (
                <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('partner:dialogs.merchantDetail.settings')}</Label>
                  <p className="text-sm mt-1 text-zinc-700 dark:text-zinc-300">
                    {t('partner:dialogs.merchantDetail.paymentLinkTimeout', { minutes: item.payment_link_timeout_minutes })}
                  </p>
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
        )}
      </DialogContent>
    </Dialog>
  );
}
