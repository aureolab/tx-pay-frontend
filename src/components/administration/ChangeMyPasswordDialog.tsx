import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api/client';
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
import { AlertCircle, KeyRound, Check, X, Info } from 'lucide-react';

interface ChangeMyPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

const validatePassword = (password: string): PasswordValidation => ({
  minLength: password.length >= 12,
  hasUppercase: /[A-Z]/.test(password),
  hasLowercase: /[a-z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecial: /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password),
});

const isPasswordValid = (validation: PasswordValidation): boolean =>
  Object.values(validation).every(Boolean);

export function ChangeMyPasswordDialog({ open, onOpenChange, onSuccess }: ChangeMyPasswordDialogProps) {
  const { t } = useTranslation('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validation, setValidation] = useState<PasswordValidation>(validatePassword(''));

  useEffect(() => {
    if (open) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
      setValidation(validatePassword(''));
    }
  }, [open]);

  useEffect(() => {
    setValidation(validatePassword(newPassword));
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid(validation)) {
      setError(t('dialogs.changeMyPassword.requirementsError'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('dialogs.changePassword.mismatchError'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.changeMyPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || t('dialogs.changeMyPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg focus:border-blue-500 focus:ring-blue-500/20 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 transition-colors placeholder:text-zinc-400";

  const ValidationItem = ({ valid, label }: { valid: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {valid ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <X className="w-3.5 h-3.5 text-zinc-400" />
      )}
      <span className={valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}>
        {label}
      </span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-blue-900/5 dark:shadow-blue-900/20 p-0 gap-0 overflow-hidden">
        {/* Decorative top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <KeyRound className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              {t('dialogs.changeMyPassword.title')}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {t('dialogs.changeMyPassword.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/80 dark:bg-emerald-950/30">
              <Check className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-sm text-emerald-700 dark:text-emerald-300">
                {t('dialogs.changeMyPassword.success')}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="current-password" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('dialogs.changeMyPassword.currentPassword')} {t('dialogs.common.required')}
            </Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={success}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('dialogs.changeMyPassword.newPassword')} {t('dialogs.common.required')}
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={success}
              className={inputClass}
            />
          </div>

          {/* Password requirements */}
          {newPassword && (
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700/50 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                <Info className="w-3.5 h-3.5" />
                {t('dialogs.changeMyPassword.requirements')}
              </div>
              <div className="grid grid-cols-2 gap-1">
                <ValidationItem valid={validation.minLength} label={t('dialogs.changeMyPassword.reqMinLength')} />
                <ValidationItem valid={validation.hasUppercase} label={t('dialogs.changeMyPassword.reqUppercase')} />
                <ValidationItem valid={validation.hasLowercase} label={t('dialogs.changeMyPassword.reqLowercase')} />
                <ValidationItem valid={validation.hasNumber} label={t('dialogs.changeMyPassword.reqNumber')} />
                <ValidationItem valid={validation.hasSpecial} label={t('dialogs.changeMyPassword.reqSpecial')} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('dialogs.changeMyPassword.confirmPassword')} {t('dialogs.common.required')}
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={success}
              className={inputClass}
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{t('dialogs.changePassword.mismatchError')}</p>
            )}
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
              disabled={loading || success || !isPasswordValid(validation) || newPassword !== confirmPassword}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 min-w-[120px] disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('dialogs.common.saving')}</span>
                </div>
              ) : success ? (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{t('dialogs.changeMyPassword.success')}</span>
                </div>
              ) : (
                t('dialogs.changeMyPassword.submit')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
