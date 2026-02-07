import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { transactionsApi } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CreditCard } from 'lucide-react';
import { getPaymentMethodLabel } from '@/lib/constants';
import { TransactionSuccessView } from '@/components/shared/TransactionSuccessView';
import { VitaCountrySelector } from '@/components/shared/VitaCountrySelector';
import { DEFAULT_VITA_COUNTRY, type VitaCountry } from '@/lib/vita-countries';

interface CreateTransactionDialogProps {
  merchant: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateTransactionDialog({ merchant, open, onOpenChange, onSuccess }: CreateTransactionDialogProps) {
  const { t, i18n } = useTranslation('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [vitaCountries, setVitaCountries] = useState<VitaCountry[]>([]);
  const [defaultCountry, setDefaultCountry] = useState(DEFAULT_VITA_COUNTRY);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'CLP',
    payment_method: 'PAYMENT_LINK' as string,
    callback_url: '',
    vita_country: DEFAULT_VITA_COUNTRY,
  });

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
      transactionsApi.getVitaCountries(merchant._id)
        .then(res => {
          setVitaCountries(res.data.countries);
          setDefaultCountry(res.data.default_country);
          setFormData(prev => ({ ...prev, vita_country: res.data.default_country }));
        })
        .catch(() => {
          // Fallback to empty, selector won't show if no countries
        });
    }
  }, [open, merchant?._id]);

  useEffect(() => {
    if (open) {
      setFormData({
        amount: '',
        currency: 'CLP',
        payment_method: 'PAYMENT_LINK',
        callback_url: '',
        vita_country: defaultCountry,
      });
      setError('');
      setResult(null);
    }
  }, [open, defaultCountry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload: any = {
        user_context: {
          is_guest: true,
        },
        financials: {
          amount_gross: parseFloat(formData.amount),
          currency: formData.currency,
        },
        payment_method: formData.payment_method,
        callback_url: formData.callback_url || undefined,
      };

      // Include vita_country if applicable
      if (showCountrySelector && formData.vita_country) {
        payload.vita_country = formData.vita_country;
      }

      const res = await transactionsApi.create(payload, merchant._id);
      setResult(res.data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || t('dialogs.createTransaction.createError'));
    } finally {
      setLoading(false);
    }
  };

  const locale = i18n.language?.startsWith('es') ? 'es' : 'en';
  const inputClass = "h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg focus:border-blue-500 focus:ring-blue-500/20 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 transition-colors placeholder:text-zinc-400";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-blue-900/5 dark:shadow-blue-900/20 p-0 gap-0 overflow-hidden">
        {/* Decorative top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <CreditCard className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              {t('dialogs.createTransaction.title')}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {t('dialogs.createTransaction.description')}{' '}
            <span className="font-medium text-zinc-900 dark:text-white">{merchant?.profile?.fantasy_name}</span>
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="px-6 pb-6 pt-4">
            <TransactionSuccessView
              result={result}
              gradientClass="from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              locale={locale}
              onClose={() => onOpenChange(false)}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tx-amount" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                  {t('dialogs.createTransaction.amount')} {t('dialogs.common.required')}
                </Label>
                <Input
                  id="tx-amount"
                  type="number"
                  step="1"
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder={t('dialogs.createTransaction.placeholderAmount')}
                  required
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tx-currency" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                  {t('dialogs.createTransaction.currency')}
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger className="h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg">
                    <SelectValue placeholder={t('dialogs.createTransaction.selectCurrency')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLP">CLP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tx-method" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('dialogs.createTransaction.paymentMethod')} {t('dialogs.common.required')}
              </Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger className="h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg">
                  <SelectValue placeholder={t('dialogs.createTransaction.selectMethod')} />
                </SelectTrigger>
                <SelectContent>
                  {merchant?.enabled_payment_methods?.length > 0
                    ? merchant.enabled_payment_methods
                        .filter((method: string) => method !== 'QR') // QR is now consolidated into PAYMENT_LINK
                        .map((method: string) => (
                        <SelectItem key={method} value={method}>
                          {getPaymentMethodLabel(method)}
                        </SelectItem>
                      ))
                    : <>
                        <SelectItem value="PAYMENT_LINK">{getPaymentMethodLabel('PAYMENT_LINK')}</SelectItem>
                        <SelectItem value="WEBPAY">{getPaymentMethodLabel('WEBPAY')}</SelectItem>
                        <SelectItem value="VITA_WALLET">{getPaymentMethodLabel('VITA_WALLET')}</SelectItem>
                      </>
                  }
                </SelectContent>
              </Select>
            </div>

            {showCountrySelector && vitaCountries.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="tx-vita-country" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                  {t('dialogs.createTransaction.vitaCountry', 'Pais destino (Vita Wallet)')}
                </Label>
                <VitaCountrySelector
                  value={formData.vita_country}
                  onChange={(code) => setFormData({ ...formData, vita_country: code })}
                  countries={vitaCountries}
                  className="bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg"
                  placeholder={t('dialogs.createTransaction.selectCountry', 'Seleccionar pais')}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="tx-callback" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('dialogs.createTransaction.callbackUrl')}
              </Label>
              <Input
                id="tx-callback"
                type="url"
                value={formData.callback_url}
                onChange={(e) => setFormData({ ...formData, callback_url: e.target.value })}
                placeholder={t('dialogs.createTransaction.placeholderCallback')}
                className={inputClass}
              />
            </div>

            {/* Footer */}
            <DialogFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 -mx-6 px-6 -mb-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {t('dialogs.common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 min-w-[90px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('dialogs.common.creating')}</span>
                  </div>
                ) : (
                  t('dialogs.createTransaction.submit')
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
