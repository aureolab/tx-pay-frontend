import { useState, useEffect } from 'react';
import { partnerPaymentLinksApi } from '../../api/partnerClient';
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
import { AlertCircle, Link2 } from 'lucide-react';
import type {
  PaymentLink,
  UpdatePaymentLinkRequest,
} from '@/types/payment-link.types';
import { LinkMode, AmountMode, toNumber } from '@/types/payment-link.types';
import { VitaCountrySelector } from '@/components/shared/VitaCountrySelector';
import { VITA_WALLET_COUNTRIES, DEFAULT_VITA_COUNTRY } from '@/lib/vita-countries';

interface Merchant {
  _id: string;
  profile?: { fantasy_name?: string; legal_name?: string };
  enabled_payment_methods?: string[];
}

interface PartnerPaymentLinkDialogProps {
  merchantId?: string;
  merchants?: Merchant[];
  item?: PaymentLink | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  description: string;
  link_mode: string;
  amount_mode: string;
  fixed_amount: string;
  currency: string;
  min_amount: string;
  max_amount: string;
  max_uses: string;
  expires_at: string;
  vita_country: string;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  link_mode: LinkMode.SINGLE_USE,
  amount_mode: AmountMode.FIXED,
  fixed_amount: '',
  currency: 'CLP',
  min_amount: '',
  max_amount: '',
  max_uses: '',
  expires_at: '',
  vita_country: DEFAULT_VITA_COUNTRY,
};

export function PartnerPaymentLinkDialog({
  merchantId,
  merchants,
  item,
  open,
  onOpenChange,
  onSuccess,
}: PartnerPaymentLinkDialogProps) {
  const isEditing = !!item;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');

  // Determine the effective merchant ID
  const effectiveMerchantId = merchantId || selectedMerchantId;
  const showMerchantSelector = !merchantId && merchants && merchants.length > 0;

  // Check if selected merchant has VITA_WALLET enabled
  const selectedMerchant = merchants?.find(m => m._id === effectiveMerchantId);
  const hasVitaWallet = selectedMerchant?.enabled_payment_methods?.includes('VITA_WALLET') ?? false;

  useEffect(() => {
    if (open) {
      if (item) {
        setFormData({
          name: item.name,
          description: item.description || '',
          link_mode: item.link_mode,
          amount_mode: item.amount_mode,
          fixed_amount: item.fixed_amount ? toNumber(item.fixed_amount).toString() : '',
          currency: item.currency,
          min_amount: item.amount_limits?.min_amount ? toNumber(item.amount_limits.min_amount).toString() : '',
          max_amount: item.amount_limits?.max_amount ? toNumber(item.amount_limits.max_amount).toString() : '',
          max_uses: item.max_uses?.toString() || '',
          expires_at: item.expires_at ? item.expires_at.slice(0, 16) : '',
          vita_country: item.vita_country || DEFAULT_VITA_COUNTRY,
        });
        // Set merchant from existing item for editing
        if (typeof item.merchant_id === 'string') {
          setSelectedMerchantId(item.merchant_id);
        }
      } else {
        setFormData(initialFormData);
        setSelectedMerchantId('');
      }
      setError('');
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditing && !effectiveMerchantId) {
      setError('Debe seleccionar un comercio');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEditing && item) {
        const updateData: UpdatePaymentLinkRequest = {
          name: formData.name,
          description: formData.description || undefined,
          fixed_amount: formData.amount_mode === AmountMode.FIXED && formData.fixed_amount
            ? parseFloat(formData.fixed_amount)
            : undefined,
          amount_limits: formData.amount_mode === AmountMode.VARIABLE
            ? {
                min_amount: formData.min_amount ? parseFloat(formData.min_amount) : undefined,
                max_amount: formData.max_amount ? parseFloat(formData.max_amount) : undefined,
              }
            : undefined,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : undefined,
          expires_at: formData.expires_at || undefined,
          vita_country: hasVitaWallet ? formData.vita_country : undefined,
        };
        await partnerPaymentLinksApi.update(item._id, updateData);
      } else {
        const createData = {
          name: formData.name,
          description: formData.description || undefined,
          link_mode: formData.link_mode as 'SINGLE_USE' | 'REUSABLE',
          amount_mode: formData.amount_mode as 'FIXED' | 'VARIABLE',
          fixed_amount: formData.amount_mode === AmountMode.FIXED && formData.fixed_amount
            ? parseFloat(formData.fixed_amount)
            : undefined,
          currency: formData.currency,
          amount_limits: formData.amount_mode === AmountMode.VARIABLE
            ? {
                min_amount: formData.min_amount ? parseFloat(formData.min_amount) : undefined,
                max_amount: formData.max_amount ? parseFloat(formData.max_amount) : undefined,
              }
            : undefined,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : undefined,
          expires_at: formData.expires_at || undefined,
          vita_country: hasVitaWallet ? formData.vita_country : undefined,
        };
        await partnerPaymentLinksApi.create(createData, effectiveMerchantId);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al guardar el link de pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl p-0 gap-0 overflow-hidden flex flex-col">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 flex-shrink-0" />

        <DialogHeader className="px-4 sm:px-6 pt-4 pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20 flex-shrink-0">
              <Link2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              {isEditing ? 'Editar Link' : 'Nuevo Link de Pago'}
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {isEditing
              ? 'Modifica la configuración del link'
              : 'Configura tu nuevo link de pago'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3">
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Merchant Selector - shown when creating from dashboard tab */}
              {showMerchantSelector && !isEditing && (
                <div className="space-y-1.5">
                  <Label className="text-sm">Comercio *</Label>
                  <Select
                    value={selectedMerchantId}
                    onValueChange={setSelectedMerchantId}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleccionar comercio" />
                    </SelectTrigger>
                    <SelectContent>
                      {merchants?.map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          {m.profile?.fantasy_name || m.profile?.legal_name || m._id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Nombre */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm">Nombre del link *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Pago Servicio, Donación"
                  required
                  className="h-10"
                />
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm">Descripción (opcional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Se mostrará en el checkout"
                  className="h-10"
                />
              </div>

              {/* Tipo de Link */}
              <div className="space-y-1.5">
                <Label className="text-sm">Tipo de link</Label>
                <Select
                  value={formData.link_mode}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, link_mode: value }))}
                  disabled={isEditing}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LinkMode.SINGLE_USE}>Uso único (expira al pagar)</SelectItem>
                    <SelectItem value={LinkMode.REUSABLE}>Reutilizable (múltiples pagos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Monto */}
              <div className="space-y-1.5">
                <Label className="text-sm">Tipo de monto</Label>
                <Select
                  value={formData.amount_mode}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, amount_mode: value }))}
                  disabled={isEditing}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AmountMode.FIXED}>Monto fijo</SelectItem>
                    <SelectItem value={AmountMode.VARIABLE}>Cliente ingresa monto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Monto Fijo */}
              {formData.amount_mode === AmountMode.FIXED && (
                <div className="space-y-1.5">
                  <Label htmlFor="fixed_amount" className="text-sm">Monto *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="fixed_amount"
                      type="number"
                      value={formData.fixed_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, fixed_amount: e.target.value }))}
                      placeholder="10000"
                      min="1"
                      required
                      className="flex-1 h-10"
                    />
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                      disabled={isEditing}
                    >
                      <SelectTrigger className="w-20 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLP">CLP</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Límites de Monto Variable */}
              {formData.amount_mode === AmountMode.VARIABLE && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="min_amount" className="text-sm">Mínimo</Label>
                    <Input
                      id="min_amount"
                      type="number"
                      value={formData.min_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_amount: e.target.value }))}
                      placeholder="1000"
                      min="1"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="max_amount" className="text-sm">Máximo</Label>
                    <Input
                      id="max_amount"
                      type="number"
                      value={formData.max_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_amount: e.target.value }))}
                      placeholder="5000000"
                      min="1"
                      className="h-10"
                    />
                  </div>
                </div>
              )}

              {/* Máximo de Usos (solo para reutilizable) */}
              {formData.link_mode === LinkMode.REUSABLE && (
                <div className="space-y-1.5">
                  <Label htmlFor="max_uses" className="text-sm">Máximo de usos (opcional)</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
                    placeholder="Sin límite"
                    min="1"
                    className="h-10"
                  />
                </div>
              )}

              {/* Fecha de Expiración */}
              <div className="space-y-1.5">
                <Label htmlFor="expires_at" className="text-sm">Expiración (opcional)</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  className="h-10"
                />
              </div>

              {/* Vita Wallet Country - shown only if merchant has VITA_WALLET enabled */}
              {hasVitaWallet && (
                <div className="space-y-1.5">
                  <Label htmlFor="vita_country" className="text-sm">País destino (Vita Wallet)</Label>
                  <VitaCountrySelector
                    value={formData.vita_country}
                    onChange={(code) => setFormData(prev => ({ ...prev, vita_country: code }))}
                    countries={VITA_WALLET_COUNTRIES}
                    placeholder="Seleccionar país"
                  />
                  <p className="text-xs text-zinc-500">
                    País predeterminado para pagos con Vita Wallet
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="px-4 sm:px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0 flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {isEditing ? 'Guardando...' : 'Creando...'}
                </span>
              ) : isEditing ? 'Guardar' : 'Crear Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
