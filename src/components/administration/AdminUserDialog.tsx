import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminUsersApi } from '../../api/client';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Shield, Users, Info } from 'lucide-react';
import { AdminRoles } from '@/lib/constants';
import { CredentialsDialog, type CredentialsData } from './CredentialsDialog';

interface AdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  item?: any;
}

export function AdminUserDialog({ open, onOpenChange, onSuccess, item }: AdminDialogProps) {
  const { t } = useTranslation('admin');
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<CredentialsData | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    roles: [] as string[],
    active: true,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        email: item.email || '',
        password: '',
        full_name: item.full_name || '',
        roles: item.roles || [],
        active: item.active ?? true,
      });
    } else {
      setFormData({ email: '', password: '', full_name: '', roles: [], active: true });
    }
    setError('');
  }, [item, open]);

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        full_name: formData.full_name,
        roles: formData.roles,
        active: formData.active,
      };

      if (!isEdit) {
        payload.email = formData.email;
        // Only include password if provided (otherwise backend generates one)
        if (formData.password) {
          payload.password = formData.password;
        }
      }

      if (isEdit) {
        await adminUsersApi.update(item._id, payload);
        onOpenChange(false);
        onSuccess();
      } else {
        const response = await adminUsersApi.create(payload);
        // Check if response contains credentials (auto-generated password)
        if (response.data?.password) {
          setCredentials(response.data);
          setShowCredentials(true);
        }
        onOpenChange(false);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t(isEdit ? 'dialogs.adminUser.updateError' : 'dialogs.adminUser.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-blue-900/5 dark:shadow-blue-900/20 p-0 gap-0 overflow-hidden">
        {/* Decorative top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Users className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              {isEdit ? t('dialogs.adminUser.editTitle') : t('dialogs.adminUser.createTitle')}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {isEdit ? t('dialogs.adminUser.editDescription') : t('dialogs.adminUser.createDescription')}
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
            <Label htmlFor="admin-name" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('dialogs.adminUser.fullName')} {t('dialogs.common.required')}
            </Label>
            <Input
              id="admin-name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder={t('dialogs.adminUser.placeholderName')}
              required
              className="h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg focus:border-blue-500 focus:ring-blue-500/20 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 transition-colors placeholder:text-zinc-400"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-email" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('dialogs.adminUser.email')} {t('dialogs.common.required')}
            </Label>
            <Input
              id="admin-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('dialogs.adminUser.placeholderEmail')}
              required={!isEdit}
              disabled={isEdit}
              className="h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg focus:border-blue-500 focus:ring-blue-500/20 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 transition-colors placeholder:text-zinc-400 disabled:opacity-60"
            />
          </div>

          {/* Password field - only shown in create mode */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="admin-password" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('dialogs.adminUser.password')}{' '}
                <span className="font-normal text-zinc-400 dark:text-zinc-500">({t('dialogs.adminUser.passwordOptional')})</span>
              </Label>
              <Input
                id="admin-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                minLength={12}
                className="h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg focus:border-blue-500 focus:ring-blue-500/20 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 transition-colors placeholder:text-zinc-400"
              />
              <div className="flex items-start gap-2 mt-1.5 p-2 rounded bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-700/30">
                <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t('dialogs.adminUser.passwordAutoHint')}
                </p>
              </div>
            </div>
          )}

          {/* Roles section */}
          <div className="space-y-2">
            <Label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              {t('dialogs.adminUser.roles')}
            </Label>
            <div className="flex flex-wrap gap-1.5 p-3 bg-zinc-50/80 dark:bg-zinc-800/30 border border-zinc-200/80 dark:border-zinc-700/50 rounded-lg">
              {AdminRoles.map(role => {
                const isSelected = formData.roles.includes(role);
                return (
                  <Badge
                    key={role}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all duration-150 select-none ${
                      isSelected
                        ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/25 shadow-sm shadow-blue-500/10'
                        : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                    onClick={() => handleRoleToggle(role)}
                  >
                    {role}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Active toggle */}
          <label htmlFor="admin-active" className="flex items-center gap-3 py-2 px-3 -mx-1 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group">
            <div className="relative">
              <input
                type="checkbox"
                id="admin-active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="peer sr-only"
              />
              <div className="w-9 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 peer-checked:bg-blue-500 dark:peer-checked:bg-blue-500 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
            </div>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
              {t('dialogs.adminUser.active')}
            </span>
          </label>

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

    {/* Credentials Dialog - shown when password is auto-generated */}
    <CredentialsDialog
      open={showCredentials}
      onOpenChange={setShowCredentials}
      credentials={credentials}
    />
  </>
  );
}
