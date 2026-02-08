import { useState, useEffect } from 'react';
import { partnerPaymentLinksApi } from '../../api/partnerClient';
import { paymentLinksApi } from '../../api/client';
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
import { AlertCircle, Link2, Check, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  PaymentLink,
  UpdatePaymentLinkRequest,
} from '@/types/payment-link.types';
import { LinkMode, AmountMode, toNumber } from '@/types/payment-link.types';

interface PartnerPaymentLinkDialogProps {
  merchantId: string;
  item?: PaymentLink | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  link_mode: string;
  amount_mode: string;
  fixed_amount: string;
  currency: string;
  min_amount: string;
  max_amount: string;
  max_uses: string;
  expires_at: string;
  callback_url: string;
  success_message: string;
}

const initialFormData: FormData = {
  name: '',
  slug: '',
  description: '',
  link_mode: LinkMode.REUSABLE,
  amount_mode: AmountMode.VARIABLE,
  fixed_amount: '',
  currency: 'CLP',
  min_amount: '',
  max_amount: '',
  max_uses: '',
  expires_at: '',
  callback_url: '',
  success_message: '',
};

export function PartnerPaymentLinkDialog({
  merchantId,
  item,
  open,
  onOpenChange,
  onSuccess,
}: PartnerPaymentLinkDialogProps) {
  const isEditing = !!item;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    if (open) {
      if (item) {
        setFormData({
          name: item.name,
          slug: item.slug,
          description: item.description || '',
          link_mode: item.link_mode,
          amount_mode: item.amount_mode,
          fixed_amount: item.fixed_amount ? toNumber(item.fixed_amount).toString() : '',
          currency: item.currency,
          min_amount: item.amount_limits?.min_amount ? toNumber(item.amount_limits.min_amount).toString() : '',
          max_amount: item.amount_limits?.max_amount ? toNumber(item.amount_limits.max_amount).toString() : '',
          max_uses: item.max_uses?.toString() || '',
          expires_at: item.expires_at ? item.expires_at.slice(0, 16) : '',
          callback_url: item.callback_url || '',
          success_message: item.success_message || '',
        });
        setSlugStatus('idle');
      } else {
        setFormData(initialFormData);
        setSlugStatus('idle');
      }
      setError('');
    }
  }, [open, item]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : generateSlug(name),
    }));
  };

  useEffect(() => {
    if (!formData.slug || isEditing) {
      setSlugStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      setSlugStatus('checking');
      try {
        const res = await paymentLinksApi.validateSlug(formData.slug);
        setSlugStatus(res.data.available ? 'available' : 'taken');
      } catch {
        setSlugStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.slug, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          callback_url: formData.callback_url || undefined,
          success_message: formData.success_message || undefined,
        };
        await partnerPaymentLinksApi.update(item._id, updateData);
      } else {
        const createData = {
          name: formData.name,
          slug: formData.slug,
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
          callback_url: formData.callback_url || undefined,
          success_message: formData.success_message || undefined,
        };
        await partnerPaymentLinksApi.create(createData, merchantId);
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
      <DialogContent className="max-w-lg max-h-[90vh] bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-amber-900/5 dark:shadow-amber-900/20 p-0 gap-0 overflow-hidden flex flex-col">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 flex-shrink-0" />

        <DialogHeader className="px-6 pt-5 pb-0 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Link2 className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              {isEditing ? 'Editar Link de Pago' : 'Crear Link de Pago'}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {isEditing
              ? 'Modifica la configuracion del link de pago'
              : 'Crea un nuevo link de pago para este comercio'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej: Donacion, Pago Mensual"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <div className="relative">
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="mi-link-de-pago"
                    disabled={isEditing}
                    className="pr-10"
                    required
                  />
                  {!isEditing && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {slugStatus === 'checking' && (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent block" />
                      )}
                      {slugStatus === 'available' && <Check className="h-4 w-4 text-emerald-500" />}
                      {slugStatus === 'taken' && <X className="h-4 w-4 text-red-500" />}
                    </div>
                  )}
                </div>
                {!isEditing && slugStatus === 'taken' && (
                  <p className="text-sm text-red-500">Este slug ya esta en uso</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripcion</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripcion opcional del link"
                />
              </div>

              <div className="space-y-2">
                <Label>Modo de Link</Label>
                <Select
                  value={formData.link_mode}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, link_mode: value }))}
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LinkMode.SINGLE_USE}>Uso Unico</SelectItem>
                    <SelectItem value={LinkMode.REUSABLE}>Reutilizable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Modo de Monto</Label>
                <Select
                  value={formData.amount_mode}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, amount_mode: value }))}
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AmountMode.FIXED}>Monto Fijo</SelectItem>
                    <SelectItem value={AmountMode.VARIABLE}>Monto Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.amount_mode === AmountMode.FIXED && (
                <div className="space-y-2">
                  <Label htmlFor="fixed_amount">Monto Fijo *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="fixed_amount"
                      type="number"
                      value={formData.fixed_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, fixed_amount: e.target.value }))}
                      placeholder="10000"
                      min="1"
                      required
                      className="flex-1"
                    />
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                      disabled={isEditing}
                    >
                      <SelectTrigger className="w-24">
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

              {formData.amount_mode === AmountMode.VARIABLE && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_amount">Monto Minimo</Label>
                    <Input
                      id="min_amount"
                      type="number"
                      value={formData.min_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_amount: e.target.value }))}
                      placeholder="Default: 1000"
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_amount">Monto Maximo</Label>
                    <Input
                      id="max_amount"
                      type="number"
                      value={formData.max_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_amount: e.target.value }))}
                      placeholder="Default: 5000000"
                      min="1"
                    />
                  </div>
                </div>
              )}

              {formData.link_mode === LinkMode.REUSABLE && (
                <div className="space-y-2">
                  <Label htmlFor="max_uses">Maximo de Usos</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
                    placeholder="Sin limite"
                    min="1"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="expires_at">Fecha de Expiracion</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="callback_url">URL de Callback</Label>
                <Input
                  id="callback_url"
                  type="url"
                  value={formData.callback_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, callback_url: e.target.value }))}
                  placeholder="https://mi-sitio.com/gracias"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="success_message">Mensaje de Exito</Label>
                <Input
                  id="success_message"
                  value={formData.success_message}
                  onChange={(e) => setFormData(prev => ({ ...prev, success_message: e.target.value }))}
                  placeholder="Gracias por tu pago!"
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || (!isEditing && slugStatus === 'taken')}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {isEditing ? 'Guardando...' : 'Creando...'}
                </span>
              ) : isEditing ? 'Guardar Cambios' : 'Crear Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
