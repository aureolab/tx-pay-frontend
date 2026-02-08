import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { partnerMerchantsApi, partnerPaymentLinksApi } from '../../api/partnerClient';
import type { PartnerMerchant } from '../../types/partner.types';
import type { PaymentLink } from '@/types/payment-link.types';
import { formatCurrency } from '@/types/payment-link.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, Link2, Plus, Eye, Copy, Check, ExternalLink } from 'lucide-react';
import { getStatusConfig, getPaymentMethodLabel } from '@/lib/constants';
import { getDecimalValue } from '@/lib/formatters';
import { PartnerPaymentLinkDialog } from './PartnerPaymentLinkDialog';
import { PartnerPaymentLinkDetailDialog } from './PartnerPaymentLinkDetailDialog';

interface Props {
  merchant: PartnerMerchant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerMerchantDetailDialog({ merchant, open, onOpenChange }: Props) {
  const { t } = useTranslation(['partner', 'common']);
  const [detail, setDetail] = useState<PartnerMerchant | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Payment Links state
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<PaymentLink | null>(null);
  const [detailLink, setDetailLink] = useState<PaymentLink | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      setActiveTab('info');
      setPaymentLinks([]);
    }
  }, [open, merchant?._id]);

  // Load payment links when tab changes or dialog opens
  useEffect(() => {
    if (activeTab === 'links' && merchant?._id) {
      loadPaymentLinks();
    }
  }, [activeTab, merchant?._id]);

  const loadPaymentLinks = async () => {
    if (!merchant?._id) return;
    setLoadingLinks(true);
    try {
      const res = await partnerPaymentLinksApi.getByMerchant(merchant._id);
      setPaymentLinks(res.data);
    } catch (err) {
      console.error('Failed to load payment links:', err);
    } finally {
      setLoadingLinks(false);
    }
  };

  const handleCopyLink = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateLink = () => {
    setEditingLink(null);
    setLinkDialogOpen(true);
  };

  const handleViewLink = (link: PaymentLink) => {
    setDetailLink(link);
    setDetailDialogOpen(true);
  };

  const handleLinkSuccess = () => {
    loadPaymentLinks();
  };

  const getLinkStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'Activo', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'INACTIVE':
        return { label: 'Inactivo', className: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400' };
      case 'EXPIRED':
        return { label: 'Expirado', className: 'bg-red-500/10 text-red-600 dark:text-red-400' };
      case 'EXHAUSTED':
        return { label: 'Agotado', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' };
      default:
        return { label: status, className: '' };
    }
  };

  const item = detail || merchant;
  if (!item) return null;

  const statusConfig = getStatusConfig(item.status);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-amber-900/5 dark:shadow-amber-900/20 p-0 gap-0 overflow-hidden flex flex-col">
          {/* Decorative top accent */}
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 flex-shrink-0" />

          <DialogHeader className="px-6 pt-5 pb-0 flex-shrink-0">
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-6 mt-4 flex-shrink-0 grid w-auto grid-cols-2 bg-zinc-100/80 dark:bg-zinc-800/50">
                <TabsTrigger value="info" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700">
                  <Store className="w-4 h-4 mr-2" />
                  Información
                </TabsTrigger>
                <TabsTrigger value="links" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700">
                  <Link2 className="w-4 h-4 mr-2" />
                  Links de Pago
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="flex-1 min-h-0 mt-0">
                <ScrollArea className="h-[calc(90vh-200px)]">
                  <div className="px-6 pb-6 pt-4 grid gap-4">
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
              </TabsContent>

              <TabsContent value="links" className="flex-1 min-h-0 mt-0">
                <div className="px-6 py-4 flex-shrink-0 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-white">Links de Pago</h3>
                      <p className="text-sm text-zinc-500">Gestiona los links de pago de este comercio</p>
                    </div>
                    <Button
                      onClick={handleCreateLink}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Link
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[calc(90vh-280px)]">
                  <div className="px-6 py-4">
                    {loadingLinks ? (
                      <div className="flex items-center justify-center py-12">
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                      </div>
                    ) : paymentLinks.length === 0 ? (
                      <div className="text-center py-12">
                        <Link2 className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
                        <p className="text-zinc-500 dark:text-zinc-400">No hay links de pago creados</p>
                        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Crea tu primer link para comenzar a recibir pagos</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {paymentLinks.map((link) => {
                          const linkStatus = getLinkStatusConfig(link.status);
                          return (
                            <div
                              key={link._id}
                              className="bg-zinc-50/80 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-700/40 hover:border-amber-500/30 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-zinc-900 dark:text-white truncate">{link.name}</h4>
                                    <Badge variant="outline" className={linkStatus.className}>
                                      {linkStatus.label}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">/{link.code}</p>
                                  <div className="flex items-center gap-4 mt-2 text-sm">
                                    <span className="text-zinc-600 dark:text-zinc-300">
                                      {link.amount_mode === 'FIXED'
                                        ? formatCurrency(link.fixed_amount || 0, link.currency)
                                        : 'Monto variable'}
                                    </span>
                                    <span className="text-zinc-400">•</span>
                                    <span className="text-zinc-500">
                                      {link.link_mode === 'SINGLE_USE' ? 'Uso único' : 'Reutilizable'}
                                    </span>
                                    <span className="text-zinc-400">•</span>
                                    <span className="text-zinc-500">
                                      {link.stats.usage_count} usos
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopyLink(link.checkout_url || '', link._id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    {copiedId === link._id ? (
                                      <Check className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(link.checkout_url, '_blank')}
                                    className="h-8 w-8 p-0"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewLink(link)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Link Create/Edit Dialog */}
      <PartnerPaymentLinkDialog
        merchantId={merchant?._id || ''}
        item={editingLink}
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        onSuccess={handleLinkSuccess}
      />

      {/* Payment Link Detail Dialog */}
      <PartnerPaymentLinkDetailDialog
        item={detailLink}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </>
  );
}
