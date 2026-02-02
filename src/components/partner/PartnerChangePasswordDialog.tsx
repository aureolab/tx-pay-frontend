import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { partnerPortalUsersApi } from '../../api/partnerClient';
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
import { AlertCircle, KeyRound } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  userName: string;
}

export function PartnerChangePasswordDialog({ open, onOpenChange, onSuccess, userId, userName }: Props) {
  const { t } = useTranslation(['partner', 'common']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (open) {
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('partner:dialogs.changePassword.mismatch'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('partner:dialogs.changePassword.placeholderPassword'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await partnerPortalUsersApi.changePassword(userId, { new_password: newPassword });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || t('partner:dialogs.changePassword.error'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg focus:border-amber-500 focus:ring-amber-500/20 dark:focus:border-amber-400 dark:focus:ring-amber-400/20 transition-colors placeholder:text-zinc-400";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-amber-900/5 dark:shadow-amber-900/20 p-0 gap-0 overflow-hidden">
        {/* Decorative top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
              <KeyRound className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              {t('partner:dialogs.changePassword.title')}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {t('partner:dialogs.changePassword.description', { name: userName })}
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
            <Label htmlFor="pcp-new-password" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('partner:dialogs.changePassword.newPassword')} {t('partner:dialogs.common.required')}
            </Label>
            <Input
              id="pcp-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('partner:dialogs.changePassword.placeholderPassword')}
              required
              minLength={8}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pcp-confirm-password" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('partner:dialogs.changePassword.confirmPassword')} {t('partner:dialogs.common.required')}
            </Label>
            <Input
              id="pcp-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('partner:dialogs.changePassword.placeholderConfirm')}
              required
              minLength={8}
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
                  <span>{t('partner:dialogs.common.saving')}</span>
                </div>
              ) : (
                t('partner:dialogs.common.update')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
