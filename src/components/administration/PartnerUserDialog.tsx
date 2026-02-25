import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { partnerUsersApi } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { AlertCircle, UserPlus, Eye, EyeOff } from 'lucide-react';
import type { PartnerUser, Merchant, CreatePartnerUserRequest, UpdatePartnerUserRequest } from '@/types/admin.types';
import { getErrorMessage } from '@/types/api-error.types';
import { PartnerUserTypes, PartnerUserStatuses } from '@/lib/constants';

interface PartnerUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  item?: PartnerUser | null;
  partnerId: string;
  partnerMerchants?: Merchant[];
}

export function PartnerUserDialog({ open, onOpenChange, onSuccess, item, partnerId, partnerMerchants = [] }: PartnerUserDialogProps) {
  const { t } = useTranslation('admin');
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    type: 'PARTNER' as string,
    status: 'ACTIVE' as string,
    assigned_merchants: [] as string[],
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        email: item.email || '',
        password: '',
        type: item.type || 'PARTNER',
        status: item.status || 'ACTIVE',
        assigned_merchants: item.assigned_merchants?.map((m: string | { _id: string }) => typeof m === 'string' ? m : m._id) || [],
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        type: 'PARTNER',
        status: 'ACTIVE',
        assigned_merchants: [],
      });
    }
    setError('');
  }, [item, open]);

  const handleMerchantToggle = (merchantId: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_merchants: prev.assigned_merchants.includes(merchantId)
        ? prev.assigned_merchants.filter(id => id !== merchantId)
        : [...prev.assigned_merchants, merchantId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        type: formData.type,
      };

      if (formData.type === 'CLIENT') {
        payload.assigned_merchants = formData.assigned_merchants;
      }

      if (!isEdit) {
        payload.partner_id = partnerId;
        payload.email = formData.email;
        payload.password = formData.password;
      } else {
        payload.status = formData.status;
      }

      if (isEdit) {
        await partnerUsersApi.update(item._id, payload as unknown as UpdatePartnerUserRequest);
      } else {
        await partnerUsersApi.create(payload as unknown as CreatePartnerUserRequest);
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t(isEdit ? 'dialogs.partnerUser.updateError' : 'dialogs.partnerUser.createError'));
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
              <UserPlus className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              {isEdit ? t('dialogs.partnerUser.editTitle') : t('dialogs.partnerUser.createTitle')}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {isEdit ? t('dialogs.partnerUser.editDescription') : t('dialogs.partnerUser.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="pu-name" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('dialogs.partnerUser.name')} {t('dialogs.common.required')}
            </Label>
            <Input
              id="pu-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('dialogs.partnerUser.placeholderName')}
              required
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pu-email" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('dialogs.partnerUser.email')} {t('dialogs.common.required')}
            </Label>
            <Input
              id="pu-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('dialogs.partnerUser.placeholderEmail')}
              required={!isEdit}
              disabled={isEdit}
              className={`${inputClass} disabled:opacity-60`}
            />
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="pu-password" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('dialogs.partnerUser.password')} {t('dialogs.common.required')}
              </Label>
              <div className="relative">
                <Input
                  id="pu-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t('dialogs.partnerUser.placeholderPassword')}
                  required
                  minLength={8}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('dialogs.partnerUser.type')} {t('dialogs.common.required')}
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg">
                <SelectValue placeholder={t('dialogs.partnerUser.selectType')} />
              </SelectTrigger>
              <SelectContent>
                {PartnerUserTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 pl-0.5">
              {formData.type === 'PARTNER' ? t('dialogs.partnerUser.typePartnerHint') : t('dialogs.partnerUser.typeClientHint')}
            </p>
          </div>

          {formData.type === 'CLIENT' && partnerMerchants.length > 0 && (
            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('dialogs.partnerUser.assignedMerchants')}
              </Label>
              <div className="flex flex-wrap gap-1.5 p-3 bg-zinc-50/80 dark:bg-zinc-800/30 border border-zinc-200/80 dark:border-zinc-700/50 rounded-lg min-h-[44px]">
                {partnerMerchants.map((m: Merchant) => {
                  const isSelected = formData.assigned_merchants.includes(m._id);
                  return (
                    <Badge
                      key={m._id}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all duration-150 select-none ${
                        isSelected
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25 shadow-sm shadow-amber-500/10'
                          : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-600 hover:text-amber-600 dark:hover:text-amber-400'
                      }`}
                      onClick={() => handleMerchantToggle(m._id)}
                    >
                      {m.profile?.fantasy_name || m._id}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {formData.type === 'CLIENT' && partnerMerchants.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 pl-0.5">{t('dialogs.partnerUser.noMerchants')}</p>
          )}

          {isEdit && (
            <div className="space-y-1.5">
              <Label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('dialogs.partnerUser.status')}
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg">
                  <SelectValue placeholder={t('dialogs.common.selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  {PartnerUserStatuses.map(status => (
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
