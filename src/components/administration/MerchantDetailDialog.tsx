import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { merchantsApi, paymentLinksApi } from '../../api/client';
import type { PaymentLink } from '@/types/payment-link.types';
import { formatCurrency } from '@/types/payment-link.types';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Store, Link2, Plus, Copy, Check, ExternalLink } from 'lucide-react';
import { getStatusConfig, getPaymentMethodLabel } from '@/lib/constants';
import { PaymentLinkDialog } from './PaymentLinkDialog';
import { PaymentLinkDetailDialog } from './PaymentLinkDetailDialog';

export function MerchantDetailDialog({ item, open, onOpenChange }: { item: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation('admin');
  const [showSecret, setShowSecret] = useState(false);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [visibleSensitiveFields, setVisibleSensitiveFields] = useState<Set<string>>(new Set());
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
    if (!open) {
      setShowSecret(false);
      setSecretKey(null);
      setVisibleSensitiveFields(new Set());
      setActiveTab('info');
      setPaymentLinks([]);
    }
  }, [open, item?._id]);

  // Load payment links when tab changes
  useEffect(() => {
    if (activeTab === 'links' && item?._id) {
      loadPaymentLinks();
    }
  }, [activeTab, item?._id]);

  const loadPaymentLinks = async () => {
    if (!item?._id) return;
    setLoadingLinks(true);
    try {
      const res = await paymentLinksApi.getByMerchant(item._id);
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

  const toggleSensitiveField = (fieldKey: string) => {
    setVisibleSensitiveFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey);
      } else {
        newSet.add(fieldKey);
      }
      return newSet;
    });
  };

  const handleToggleSecret = async () => {
    if (showSecret) {
      setShowSecret(false);
      return;
    }

    if (secretKey) {
      setShowSecret(true);
      return;
    }

    setLoadingSecret(true);
    try {
      const res = await merchantsApi.getSecret(item._id);
      setSecretKey(res.data);
      setShowSecret(true);
    } catch (err) {
      console.error('Failed to fetch secret:', err);
    } finally {
      setLoadingSecret(false);
    }
  };

  if (!item) return null;
  const statusConfig = getStatusConfig(item.status);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-blue-900/5 dark:shadow-blue-900/20 p-0 gap-0 overflow-hidden flex flex-col">
          {/* Decorative top accent */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 flex-shrink-0" />

          <DialogHeader className="px-6 pt-5 pb-0 flex-shrink-0">
            <DialogTitle className="flex items-center gap-3 text-lg">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                <Store className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-zinc-900 dark:text-zinc-50">
                {t('dialogs.merchantDetail.title')}
              </span>
            </DialogTitle>
            <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
              {t('dialogs.merchantDetail.description', { name: item.profile?.fantasy_name })}
            </DialogDescription>
          </DialogHeader>

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
                      <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.fantasyName')}</Label>
                      <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.profile?.fantasy_name || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.legalName')}</Label>
                      <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.profile?.legal_name || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.taxId')}</Label>
                      <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.profile?.tax_id || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.mcc')}</Label>
                      <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.profile?.mcc || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.contactEmail')}</Label>
                      <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.profile?.contact_email || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.status')}</Label>
                      <div className="mt-1">
                        <Badge variant={statusConfig.variant} className={statusConfig.className}>{statusConfig.label}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* IDs */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                    <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.ids')}</Label>
                    <div className="grid gap-2 mt-2">
                      <div>
                        <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.merchantId')}</Label>
                        <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg mt-0.5">{item._id}</p>
                      </div>
                      <div>
                        <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.ownerPartnerId')}</Label>
                        <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg mt-0.5">{item.owner || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Integration Keys */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                    <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.apiIntegration')}</Label>
                    <div className="grid gap-2 mt-2">
                      <div>
                        <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.publicKey')}</Label>
                        <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg break-all mt-0.5">{item.integration?.public_key || '-'}</p>
                      </div>
                      <div>
                        <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.secretKey')}</Label>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg break-all flex-1">
                            {showSecret && secretKey ? secretKey : '••••••••••••••••••••••••'}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleToggleSecret}
                            disabled={loadingSecret}
                            className="shrink-0 h-8 w-8 p-0"
                          >
                            {loadingSecret ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : showSecret ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                    <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.enabledPaymentMethods')}</Label>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.enabled_payment_methods?.length > 0 ? item.enabled_payment_methods.filter((m: string) => m !== 'QR').map((method: string) => (
                        <Badge key={method} variant="outline" className="text-xs bg-blue-500/5 text-blue-700 dark:text-blue-300 border-blue-500/20">{getPaymentMethodLabel(method)}</Badge>
                      )) : <span className="text-zinc-500 text-sm">{t('dialogs.common.none')}</span>}
                    </div>
                  </div>

                  {/* Bank Accounts */}
                  {item.bank_accounts?.length > 0 && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                      <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.bankAccounts')}</Label>
                      <div className="space-y-2 mt-2">
                        {item.bank_accounts.map((account: any, idx: number) => (
                          <div key={idx} className="bg-zinc-50/80 dark:bg-zinc-800/30 p-3 rounded-lg text-sm border border-zinc-200/60 dark:border-zinc-700/40">
                            <p><span className="text-zinc-500">{t('dialogs.merchantDetail.bank')}</span> {account.bank_name}</p>
                            <p><span className="text-zinc-500">{t('dialogs.merchantDetail.accountType')}</span> {account.account_type}</p>
                            <p><span className="text-zinc-500">{t('dialogs.merchantDetail.accountCurrency')}</span> {account.currency}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing Rules */}
                  {item.pricing_rules?.fees?.length > 0 && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                      <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.pricingRules')}</Label>
                      <div className="space-y-2 mt-2">
                        {item.pricing_rules.fees.map((fee: any, idx: number) => (
                          <div key={idx} className="bg-zinc-50/80 dark:bg-zinc-800/30 p-3 rounded-lg text-sm border border-zinc-200/60 dark:border-zinc-700/40">
                            <p><span className="text-zinc-500">{t('dialogs.merchantDetail.method')}</span> {getPaymentMethodLabel(fee.method)}</p>
                            <p><span className="text-zinc-500">{t('dialogs.merchantDetail.fixed')}</span> {fee.fixed?.$numberDecimal || fee.fixed || 0}</p>
                            <p><span className="text-zinc-500">{t('dialogs.merchantDetail.percentage')}</span> {fee.percentage?.$numberDecimal || fee.percentage || 0}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acquirer Configs */}
                  {item.acquirer_configs?.length > 0 && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                      <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.acquirerConfigs')}</Label>
                      <div className="space-y-3 mt-2">
                        {item.acquirer_configs.map((config: any, idx: number) => (
                          <div key={idx} className="bg-zinc-50/80 dark:bg-zinc-800/30 p-3 rounded-lg text-sm border border-zinc-200/60 dark:border-zinc-700/40 space-y-2">
                            <p className="font-medium text-zinc-900 dark:text-white">{config.provider}</p>
                            {config.config && Object.keys(config.config).length > 0 && (
                              <div className="grid gap-1 pl-3 border-l-2 border-blue-500/30">
                                {Object.entries(config.config).map(([key, value]) => {
                                  const isSensitive = /secret|key|password|token/i.test(key);
                                  const fieldKey = `${idx}-${key}`;
                                  const isVisible = visibleSensitiveFields.has(fieldKey);
                                  const displayValue = isSensitive && !isVisible
                                    ? '••••••••••••'
                                    : String(value);
                                  return (
                                    <div key={key} className="flex items-center gap-2">
                                      <span className="text-zinc-500 shrink-0">{key}:</span>
                                      <span className="font-mono break-all flex-1">{displayValue}</span>
                                      {isSensitive && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleSensitiveField(fieldKey)}
                                          className="shrink-0 h-6 w-6 p-0"
                                        >
                                          {isVisible ? (
                                            <EyeOff className="h-3 w-3" />
                                          ) : (
                                            <Eye className="h-3 w-3" />
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Settings */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                    <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.settings')}</Label>
                    <p className="text-sm mt-1 text-zinc-700 dark:text-zinc-300">
                      {t('dialogs.merchantDetail.paymentLinkTimeout', { minutes: item.payment_link_timeout_minutes || 15 })}
                    </p>
                  </div>

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
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
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
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
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
                            className="bg-zinc-50/80 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-700/40 hover:border-blue-500/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-zinc-900 dark:text-white truncate">{link.name}</h4>
                                  <Badge variant="outline" className={linkStatus.className}>
                                    {linkStatus.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">/{link.slug}</p>
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
        </DialogContent>
      </Dialog>

      {/* Payment Link Create/Edit Dialog */}
      <PaymentLinkDialog
        merchantId={item?._id || ''}
        item={editingLink}
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        onSuccess={handleLinkSuccess}
      />

      {/* Payment Link Detail Dialog */}
      <PaymentLinkDetailDialog
        item={detailLink}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </>
  );
}
