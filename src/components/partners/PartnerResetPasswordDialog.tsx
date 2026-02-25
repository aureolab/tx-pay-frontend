import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { partnerPortalUsersApi } from '../../api/partnerClient';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { getErrorMessage } from '@/types/api-error.types';
import { PartnerCredentialsDialog, type CredentialsData } from './PartnerCredentialsDialog';

interface PartnerResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  userName: string;
  userEmail: string;
}

export function PartnerResetPasswordDialog({
  open,
  onOpenChange,
  onSuccess,
  userId,
  userName,
  userEmail,
}: PartnerResetPasswordDialogProps) {
  const { t } = useTranslation('partner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<CredentialsData | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await partnerPortalUsersApi.resetPassword(userId);
      setCredentials(response.data);
      setShowCredentials(true);
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t('dialogs.resetPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-amber-900/5 dark:shadow-amber-900/20 p-0 gap-0 overflow-hidden">
          {/* Decorative top accent */}
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

          <DialogHeader className="px-6 pt-5 pb-0">
            <DialogTitle className="flex items-center gap-3 text-lg">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
                <RefreshCw className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-zinc-900 dark:text-zinc-50">
                {t('dialogs.resetPassword.title')}
              </span>
            </DialogTitle>
            <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
              {t('dialogs.resetPassword.description', { name: userName })}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 pt-4 space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Warning */}
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-2">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {t('dialogs.resetPassword.warningTitle')}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {t('dialogs.resetPassword.warningMessage', { email: userEmail })}
                  </p>
                </div>
              </div>
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
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 min-w-[120px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('dialogs.resetPassword.resetting')}</span>
                  </div>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('dialogs.resetPassword.submit')}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <PartnerCredentialsDialog
        open={showCredentials}
        onOpenChange={setShowCredentials}
        credentials={credentials}
      />
    </>
  );
}
