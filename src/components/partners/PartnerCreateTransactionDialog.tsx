import { useState, useEffect } from 'react';
import type { PartnerMerchant, CreateTransactionRequest } from '../../types/partner.types';
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
import { Plus, AlertCircle } from 'lucide-react';

interface PartnerCreateTransactionDialogProps {
  merchant: PartnerMerchant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PartnerCreateTransactionDialog({
  merchant,
  open,
  onOpenChange,
  onSuccess,
}: PartnerCreateTransactionDialogProps) {
  const [vitaCountries, setVitaCountries] = useState<VitaCountry[]>([]);
  const [defaultCountry, setDefaultCountry] = useState(DEFAULT_VITA_COUNTRY);
  const [formData, setFormData] = useState<CreateTransactionRequest>({
    amount: 0,
    currency: 'CLP',
    payment_method: merchant?.enabled_payment_methods[0] || 'PAYMENT_LINK',
    vita_country: DEFAULT_VITA_COUNTRY,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState<any>(null);

  // Check if merchant has Vita Wallet enabled
  const merchantHasVita = merchant?.enabled_payment_methods?.includes('VITA_WALLET');

  // Determine if we should show the country selector
  // Show for VITA_WALLET or PAYMENT_LINK when merchant has Vita enabled
  const showCountrySelector =
    formData.payment_method === 'VITA_WALLET' ||
    (formData.payment_method === 'PAYMENT_LINK' && merchantHasVita);

  // Load Vita countries when dialog opens
  useEffect(() => {
    if (open && merchant?._id) {
      partnerTransactionsApi.getVitaCountries(merchant._id)
        .then(res => {
          setVitaCountries(res.data.countries);
          setDefaultCountry(res.data.default_country);
          setFormData(prev => ({ ...prev, vita_country: res.data.default_country }));
        })
        .catch(() => {
          // Fallback to empty
        });
    }
  }, [open, merchant?._id]);

  function handleOpenChange(value: boolean) {
    if (value) {
      // Reset state when opening
      setFormData({
        amount: 0,
        currency: 'CLP',
        payment_method: merchant?.enabled_payment_methods[0] || 'PAYMENT_LINK',
        vita_country: defaultCountry,
      });
      setError('');
      setSuccessResult(null);
    }
    onOpenChange(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!merchant) return;

    setCreating(true);
    setError('');
    try {
      const res = await partnerTransactionsApi.create(
        {
          amount: formData.amount,
          currency: formData.currency,
          payment_method: formData.payment_method,
          callback_url: formData.callback_url,
        },
        merchant._id,
      );
      setSuccessResult(res.data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear transaccion');
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Nueva Transaccion
          </DialogTitle>
          <DialogDescription>
            Crear transaccion para{' '}
            <span className="font-medium text-zinc-900 dark:text-white">
              {merchant?.profile.fantasy_name}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {successResult ? (
            <TransactionSuccessView
              result={successResult}
              gradientClass="from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              locale="es"
              onClose={() => onOpenChange(false)}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pb-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="partner-amount">Monto</Label>
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
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partner-currency">Moneda</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(v) => setFormData({ ...formData, currency: v })}
                  >
                    <SelectTrigger id="partner-currency" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLP">CLP</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partner-payment-method">Metodo de Pago</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(v) => setFormData({ ...formData, payment_method: v })}
                  >
                    <SelectTrigger id="partner-payment-method" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {merchant?.enabled_payment_methods
                        .filter((method) => method !== 'QR') // QR is now consolidated into PAYMENT_LINK
                        .map((method) => (
                        <SelectItem key={method} value={method}>
                          {getPaymentMethodLabel(method, 'es')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {showCountrySelector && vitaCountries.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="partner-vita-country">Pais destino (Vita Wallet)</Label>
                  <VitaCountrySelector
                    value={formData.vita_country || defaultCountry}
                    onChange={(code) => setFormData({ ...formData, vita_country: code })}
                    countries={vitaCountries}
                    className="h-11"
                    placeholder="Seleccionar pais"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="partner-callback-url">URL de Callback (opcional)</Label>
                <Input
                  id="partner-callback-url"
                  type="url"
                  value={formData.callback_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, callback_url: e.target.value })
                  }
                  placeholder="https://mi-sitio.com/callback"
                  className="h-11"
                />
              </div>

              <DialogFooter className="pt-4 flex-shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={creating || formData.amount <= 0}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Creando...
                    </>
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
