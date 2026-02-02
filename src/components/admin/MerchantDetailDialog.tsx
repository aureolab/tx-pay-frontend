import { useState, useEffect } from 'react';
import { merchantsApi } from '../../api/client';
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
import { Eye, EyeOff, Store } from 'lucide-react';
import { getStatusConfig, getPaymentMethodLabel } from '@/lib/constants';

export function MerchantDetailDialog({ item, open, onOpenChange }: { item: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [showSecret, setShowSecret] = useState(false);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [visibleSensitiveFields, setVisibleSensitiveFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setShowSecret(false);
      setSecretKey(null);
      setVisibleSensitiveFields(new Set());
    }
  }, [open, item?._id]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            Merchant Details
          </DialogTitle>
          <DialogDescription>
            Complete information for {item.profile?.fantasy_name}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-100px)] px-6 pb-6">
        <div className="grid gap-4 pt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Fantasy Name</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{item.profile?.fantasy_name || '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Legal Name</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{item.profile?.legal_name || '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Tax ID</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{item.profile?.tax_id || '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">MCC</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{item.profile?.mcc || '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Contact Email</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{item.profile?.contact_email || '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Status</Label>
              <div className="mt-1">
                <Badge variant={statusConfig.variant} className={statusConfig.className}>{statusConfig.label}</Badge>
              </div>
            </div>
          </div>

          {/* IDs */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">IDs</Label>
            <div className="grid gap-2 mt-2">
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Merchant ID</Label>
                <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg">{item._id}</p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Parent Client ID</Label>
                <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg">{item.parent_client_id || '-'}</p>
              </div>
            </div>
          </div>

          {/* Integration Keys */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">API Integration</Label>
            <div className="grid gap-2 mt-2">
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Public Key</Label>
                <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg break-all">{item.integration?.public_key || '-'}</p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Secret Key</Label>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg break-all flex-1">
                    {showSecret && secretKey ? secretKey : '••••••••••••••••••••••••'}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleSecret}
                    disabled={loadingSecret}
                    className="shrink-0"
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
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Enabled Payment Methods</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {item.enabled_payment_methods?.length > 0 ? item.enabled_payment_methods.map((method: string) => (
                <Badge key={method} variant="outline" className="text-xs">{getPaymentMethodLabel(method)}</Badge>
              )) : <span className="text-zinc-500">None</span>}
            </div>
          </div>

          {/* Bank Accounts */}
          {item.bank_accounts?.length > 0 && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Bank Accounts</Label>
              <div className="space-y-2 mt-2">
                {item.bank_accounts.map((account: any, idx: number) => (
                  <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg text-sm">
                    <p><span className="text-zinc-500">Bank:</span> {account.bank_name}</p>
                    <p><span className="text-zinc-500">Type:</span> {account.account_type}</p>
                    <p><span className="text-zinc-500">Currency:</span> {account.currency}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Rules */}
          {item.pricing_rules?.fees?.length > 0 && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Pricing Rules</Label>
              <div className="space-y-2 mt-2">
                {item.pricing_rules.fees.map((fee: any, idx: number) => (
                  <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg text-sm">
                    <p><span className="text-zinc-500">Method:</span> {getPaymentMethodLabel(fee.method)}</p>
                    <p><span className="text-zinc-500">Fixed:</span> {fee.fixed?.$numberDecimal || fee.fixed || 0}</p>
                    <p><span className="text-zinc-500">Percentage:</span> {fee.percentage?.$numberDecimal || fee.percentage || 0}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acquirer Configs */}
          {item.acquirer_configs?.length > 0 && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Acquirer Configurations</Label>
              <div className="space-y-3 mt-2">
                {item.acquirer_configs.map((config: any, idx: number) => (
                  <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg text-sm space-y-2">
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
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Settings</Label>
            <p className="text-sm mt-1 text-zinc-700 dark:text-zinc-300">Payment Link Timeout: {item.payment_link_timeout_minutes || 15} minutes</p>
          </div>

          {/* Timestamps */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Created At</Label>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Updated At</Label>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</p>
            </div>
          </div>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
