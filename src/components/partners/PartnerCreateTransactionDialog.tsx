import { useState, useEffect } from 'react';
import type { PartnerMerchant, CreateTransactionRequest } from '../../types/partner.types';
import { getErrorMessage } from '@/types/api-error.types';
import { partnerTransactionsApi } from '../../api/partnerClient';
import { getPaymentMethodLabel } from '@/lib/constants';
import { TransactionSuccessView } from '@/components/shared/TransactionSuccessView';
import { VitaCountrySelector } from '@/components/shared/VitaCountrySelector';
import { DEFAULT_VITA_COUNTRY, type VitaCountry } from '@/lib/vita-countries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { CreditCard, AlertCircle } from 'lucide-react';

interface PartnerCreateTransactionDialogProps {
  merchant?: PartnerMerchant | null;
  merchants?: PartnerMerchant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PartnerCreateTransactionDialog({
  merchant,
  merchants,
  open,
  onOpenChange,
  onSuccess,
}: PartnerCreateTransactionDialogProps) {
  const [vitaCountries, setVitaCountries] = useState<VitaCountry[]>([]);
  const [defaultCountry, setDefaultCountry] = useState(DEFAULT_VITA_COUNTRY);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');

  // Determine the effective merchant
  const effectiveMerchant = merchant || merchants?.find(m => m._id === selectedMerchantId);
  const showMerchantSelector = !merchant && merchants && merchants.length > 0;

  // Get first valid payment method (excluding QR and PAYMENT_LINK)
  const getDefaultPaymentMethod = () => {
    const validMethods = effectiveMerchant?.enabled_payment_methods?.filter(
      (m: string) => m !== 'QR' && m !== 'PAYMENT_LINK'
    );
    return validMethods?.[0] || 'WEBPAY';
  };

  const [formData, setFormData] = useState<CreateTransactionRequest>({
    amount: 0,
    currency: 'CLP',
    payment_method: getDefaultPaymentMethod(),
    vita_country: DEFAULT_VITA_COUNTRY,
  });
  const [useNetAmount, setUseNetAmount] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<Record<string, unknown> | null>(null);

  // Determine if we should show the country selector
  // Show for VITA_WALLET only
  const showCountrySelector = formData.payment_method === 'VITA_WALLET';

  // Load Vita countries when dialog opens and merchant is selected
  useEffect(() => {
    if (open && effectiveMerchant?._id) {
      partnerTransactionsApi.getVitaCountries(effectiveMerchant._id)
        .then(res => {
          setVitaCountries(res.data.countries);
          setDefaultCountry(res.data.default_country);
          setFormData(prev => ({ ...prev, vita_country: res.data.default_country }));
        })
        .catch(() => {
          // Fallback to empty
        });
    }
  }, [open, effectiveMerchant?._id]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        amount: 0,
        currency: 'CLP',
        payment_method: getDefaultPaymentMethod(),
        vita_country: defaultCountry,
      });
      setError('');
      setSuccessResult(null);
      setUseNetAmount(false);
      if (!merchant) {
        setSelectedMerchantId('');
      }
    }
  }, [open]);

  // Update payment method when merchant changes
  useEffect(() => {
    if (effectiveMerchant) {
      setFormData(prev => ({
        ...prev,
        payment_method: getDefaultPaymentMethod(),
      }));
    }
  }, [effectiveMerchant?._id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveMerchant) {
      setError('Debe seleccionar un comercio');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const payload: CreateTransactionRequest = {
        amount: useNetAmount ? 0 : formData.amount,
        amount_net_desired: useNetAmount ? formData.amount : undefined,
        currency: formData.currency,
        payment_method: formData.payment_method,
        callback_url: formData.callback_url,
      };
      // Include vita_country if applicable
      if (showCountrySelector && formData.vita_country) {
        payload.vita_country = formData.vita_country;
      }
      const res = await partnerTransactionsApi.create(payload, effectiveMerchant._id);
      setSuccessResult(res.data);
      onSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Error al crear transaccion');
    } finally {
      setCreating(false);
    }
  }

  const inputClass = "h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg focus:border-amber-500 focus:ring-amber-500/20 dark:focus:border-amber-400 dark:focus:ring-amber-400/20 transition-colors placeholder:text-zinc-400";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-amber-900/5 dark:shadow-amber-900/20 p-0 gap-0">
        {/* Decorative top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 flex-shrink-0" />

        <DialogHeader className="px-6 pt-5 pb-0 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
              <CreditCard className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              Nueva Transaccion
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {effectiveMerchant ? (
              <>
                Crear transaccion para{' '}
                <span className="font-medium text-zinc-900 dark:text-white">
                  {effectiveMerchant?.profile?.fantasy_name}
                </span>
              </>
            ) : (
              'Selecciona un comercio para crear la transaccion'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-6">
          {successResult ? (
            <div className="py-4">
              <TransactionSuccessView
                result={successResult}
                gradientClass="from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                locale="es"
                onClose={() => onOpenChange(false)}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="py-4 space-y-4">
              {error && (
                <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Merchant Selector */}
              {showMerchantSelector && (
                <div className="space-y-1.5">
                  <Label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                    Comercio <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedMerchantId}
                    onValueChange={setSelectedMerchantId}
                  >
                    <SelectTrigger className="h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg">
                      <SelectValue placeholder="Seleccionar comercio" />
                    </SelectTrigger>
                    <SelectContent>
                      {merchants?.filter(m => m.status === 'ACTIVE').map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          {m.profile?.fantasy_name || m._id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <Label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">Monto neto deseado</Label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Ingresa el monto que el comercio desea recibir</p>
                </div>
                <Switch checked={useNetAmount} onCheckedChange={setUseNetAmount} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="partner-amount" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                    {useNetAmount ? 'Monto neto deseado' : 'Monto bruto'} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="partner-amount"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.amount || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })
                    }
                    placeholder="10000"
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="partner-currency" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                    Moneda
                  </Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(v) => setFormData({ ...formData, currency: v })}
                  >
                    <SelectTrigger id="partner-currency" className="h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLP">CLP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="partner-payment-method" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                  Metodo de Pago <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(v) => setFormData({ ...formData, payment_method: v })}
                  disabled={!effectiveMerchant}
                >
                  <SelectTrigger id="partner-payment-method" className="h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg">
                    <SelectValue placeholder="Seleccionar metodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {effectiveMerchant?.enabled_payment_methods?.length ? (
                      effectiveMerchant.enabled_payment_methods
                        .filter((method: string) => method !== 'QR' && method !== 'PAYMENT_LINK')
                        .map((method: string) => (
                          <SelectItem key={method} value={method}>
                            {getPaymentMethodLabel(method, 'es')}
                          </SelectItem>
                        ))
                    ) : (
                      <>
                        <SelectItem value="WEBPAY">{getPaymentMethodLabel('WEBPAY', 'es')}</SelectItem>
                        <SelectItem value="VITA_WALLET">{getPaymentMethodLabel('VITA_WALLET', 'es')}</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {showCountrySelector && vitaCountries.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="partner-vita-country" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                    Pais destino (Vita Wallet)
                  </Label>
                  <VitaCountrySelector
                    value={formData.vita_country || defaultCountry}
                    onChange={(code) => setFormData({ ...formData, vita_country: code })}
                    countries={vitaCountries}
                    className="bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg"
                    placeholder="Seleccionar pais"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="partner-callback-url" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                  URL de Callback
                </Label>
                <Input
                  id="partner-callback-url"
                  type="url"
                  value={formData.callback_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, callback_url: e.target.value })
                  }
                  placeholder="https://mi-sitio.com/callback"
                  className={inputClass}
                />
              </div>

              {/* Footer */}
              <DialogFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={creating || formData.amount <= 0 || (!merchant && !selectedMerchantId)}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 min-w-[90px]"
                >
                  {creating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creando...</span>
                    </div>
                  ) : (
                    'Crear Transaccion'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
