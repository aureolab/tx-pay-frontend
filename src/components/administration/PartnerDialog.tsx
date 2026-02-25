import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { partnersApi } from '../../api/client';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Handshake } from 'lucide-react';
import type { Partner, CreatePartnerRequest, UpdatePartnerRequest } from '@/types/admin.types';
import { getErrorMessage } from '@/types/api-error.types';
import { PartnerStatuses } from '@/lib/constants';

interface PartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  item?: Partner | null;
}

export function PartnerDialog({ open, onOpenChange, onSuccess, item }: PartnerDialogProps) {
  const { t } = useTranslation('admin');
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fantasy_name: '',
    legal_name: '',
    tax_id: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    status: 'ACTIVE' as string,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        fantasy_name: item.fantasy_name || '',
        legal_name: item.legal_name || '',
        tax_id: item.tax_id || '',
        contact_name: item.contact_name || '',
        contact_email: item.contact_email || '',
        contact_phone: item.contact_phone || '',
        status: item.status || 'ACTIVE',
      });
    } else {
      setFormData({
        fantasy_name: '',
        legal_name: '',
        tax_id: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        status: 'ACTIVE',
      });
    }
    setError('');
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        fantasy_name: formData.fantasy_name,
        legal_name: formData.legal_name,
        tax_id: formData.tax_id,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
      };

      if (isEdit) {
        payload.status = formData.status;
        await partnersApi.update(item._id, payload as unknown as UpdatePartnerRequest);
      } else {
        await partnersApi.create(payload as unknown as CreatePartnerRequest);
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t(isEdit ? 'dialogs.partner.updateError' : 'dialogs.partner.createError'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg focus:border-amber-500 focus:ring-amber-500/20 dark:focus:border-amber-400 dark:focus:ring-amber-400/20 transition-colors placeholder:text-zinc-400";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-amber-900/5 dark:shadow-amber-900/20 p-0 gap-0 overflow-hidden">
        {/* Decorative top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Handshake className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              {isEdit ? t('dialogs.partner.editTitle') : t('dialogs.partner.createTitle')}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {isEdit ? t('dialogs.partner.editDescription') : t('dialogs.partner.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="partner-fantasy" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('dialogs.partner.fantasyName')} {t('dialogs.common.required')}
              </Label>
              <Input
                id="partner-fantasy"
                value={formData.fantasy_name}
                onChange={(e) => setFormData({ ...formData, fantasy_name: e.target.value })}
                placeholder={t('dialogs.partner.placeholderFantasy')}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="partner-business" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('dialogs.partner.businessName')} {t('dialogs.common.required')}
              </Label>
              <Input
                id="partner-business"
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                placeholder={t('dialogs.partner.placeholderBusiness')}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="partner-tax" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('dialogs.partner.taxId')}
            </Label>
            <Input
              id="partner-tax"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              placeholder={t('dialogs.partner.placeholderTaxId')}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="partner-contact-name" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('dialogs.partner.contactName')} {t('dialogs.common.required')}
            </Label>
            <Input
              id="partner-contact-name"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              placeholder={t('dialogs.partner.placeholderContact')}
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="partner-email" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('dialogs.partner.contactEmail')} {t('dialogs.common.required')}
              </Label>
              <Input
                id="partner-email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder={t('dialogs.partner.placeholderEmail')}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="partner-phone" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('dialogs.partner.contactPhone')}
              </Label>
              <Input
                id="partner-phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder={t('dialogs.partner.placeholderPhone')}
                className={inputClass}
              />
            </div>
          </div>

          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="partner-status" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('dialogs.partner.status')}
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg">
                  <SelectValue placeholder={t('dialogs.common.selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  {PartnerStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 min-w-[90px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('dialogs.common.saving')}</span>
                </div>
              ) : (
                isEdit ? t('dialogs.common.update') : t('dialogs.common.create')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
