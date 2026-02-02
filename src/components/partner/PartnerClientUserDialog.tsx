import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { partnerPortalUsersApi } from '../../api/partnerClient';
import type { PartnerClientUser, PartnerMerchant } from '../../types/partner.types';
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
import { AlertCircle, UserPlus } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  item?: PartnerClientUser | null;
  merchants: PartnerMerchant[];
}

export function PartnerClientUserDialog({ open, onOpenChange, onSuccess, item, merchants }: Props) {
  const { t } = useTranslation(['partner', 'common']);
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    status: 'ACTIVE' as string,
    assigned_merchants: [] as string[],
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        email: item.email || '',
        password: '',
        status: item.status || 'ACTIVE',
        assigned_merchants: item.assigned_merchants || [],
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
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
      if (isEdit) {
        await partnerPortalUsersApi.update(item._id, {
          name: formData.name,
          status: formData.status as 'ACTIVE' | 'INACTIVE',
          assigned_merchants: formData.assigned_merchants,
        });
      } else {
        await partnerPortalUsersApi.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          assigned_merchants: formData.assigned_merchants,
        });
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || t(isEdit ? 'partner:dialogs.editUser.updateError' : 'partner:dialogs.createUser.createError'));
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
              {isEdit ? t('partner:dialogs.editUser.title') : t('partner:dialogs.createUser.title')}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {isEdit
              ? t('partner:dialogs.editUser.description', { name: item.name })
              : t('partner:dialogs.createUser.description')}
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
            <Label htmlFor="pcu-name" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('partner:dialogs.createUser.name')} {t('partner:dialogs.common.required')}
            </Label>
            <Input
              id="pcu-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('partner:dialogs.createUser.placeholderName')}
              required
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pcu-email" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('partner:dialogs.createUser.email')} {t('partner:dialogs.common.required')}
            </Label>
            <Input
              id="pcu-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('partner:dialogs.createUser.placeholderEmail')}
              required={!isEdit}
              disabled={isEdit}
              className={`${inputClass} disabled:opacity-60`}
            />
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="pcu-password" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('partner:dialogs.createUser.password')} {t('partner:dialogs.common.required')}
              </Label>
              <Input
                id="pcu-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={t('partner:dialogs.createUser.placeholderPassword')}
                required
                minLength={8}
                className={inputClass}
              />
            </div>
          )}

          {/* Assigned Merchants */}
          <div className="space-y-2">
            <Label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('partner:dialogs.createUser.assignedMerchants')}
            </Label>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t('partner:dialogs.createUser.assignedMerchantsHint')}
            </p>
            {merchants.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-3 bg-zinc-50/80 dark:bg-zinc-800/30 border border-zinc-200/80 dark:border-zinc-700/50 rounded-lg min-h-[44px]">
                {merchants.map((m) => {
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
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t('partner:dialogs.common.none')}
              </p>
            )}
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div className="space-y-1.5">
              <Label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('partner:dialogs.editUser.status')}
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
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
              {t('partner:dialogs.common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 min-w-[90px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isEdit ? t('partner:dialogs.common.saving') : t('partner:dialogs.common.creating')}</span>
                </div>
              ) : (
                isEdit ? t('partner:dialogs.common.update') : t('partner:dialogs.common.create')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
