import { useState, useEffect } from 'react';
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

interface CreateTransactionDialogProps {
  merchant: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateTransactionDialog({ merchant, open, onOpenChange, onSuccess }: CreateTransactionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'CLP',
    payment_method: 'PAYMENT_LINK' as string,
    callback_url: '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        amount: '',
        currency: 'CLP',
        payment_method: 'PAYMENT_LINK',
        callback_url: '',
      });
      setError('');
      setResult(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = {
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

      const res = await transactionsApi.create(payload, merchant._id);
      setResult(res.data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            Create Transaction
          </DialogTitle>
          <DialogDescription>
            Create a payment link or QR for{' '}
            <span className="font-medium text-zinc-900 dark:text-white">{merchant?.profile?.fantasy_name}</span>
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <TransactionSuccessView
            result={result}
            gradientClass="from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            locale="en"
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tx-amount">Amount *</Label>
                <Input
                  id="tx-amount"
                  type="number"
                  step="1"
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="10000"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLP">CLP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-method">Payment Method *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {merchant?.enabled_payment_methods?.length > 0
                    ? merchant.enabled_payment_methods.map((method: string) => (
                        <SelectItem key={method} value={method}>
                          {getPaymentMethodLabel(method)}
                        </SelectItem>
                      ))
                    : <>
                        <SelectItem value="PAYMENT_LINK">Payment Link</SelectItem>
                        <SelectItem value="QR">QR Code</SelectItem>
                        <SelectItem value="WEBPAY">Webpay</SelectItem>
                        <SelectItem value="VITA_WALLET">Vita Wallet</SelectItem>
                      </>
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-callback">Callback URL (optional)</Label>
              <Input
                id="tx-callback"
                type="url"
                value={formData.callback_url}
                onChange={(e) => setFormData({ ...formData, callback_url: e.target.value })}
                placeholder="https://your-site.com/callback"
                className="h-11"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  'Create Transaction'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
