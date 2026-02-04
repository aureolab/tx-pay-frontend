import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { KeyRound, Download, Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export interface CredentialsData {
  email: string;
  password: string;
  login_url: string;
  name: string;
  message?: string;
}

interface CredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credentials: CredentialsData | null;
}

export function CredentialsDialog({ open, onOpenChange, credentials }: CredentialsDialogProps) {
  const { t } = useTranslation('admin');
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!credentials) return null;

  const handleCopy = async (text: string, type: 'email' | 'password') => {
    await navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const handleDownload = () => {
    const content = `TX Pay - Credenciales de Acceso
================================
Nombre: ${credentials.name}
Email: ${credentials.email}
Contraseña: ${credentials.password}
URL de Login: ${credentials.login_url}
================================
IMPORTANTE: Guarde estas credenciales en un lugar seguro.
Esta información no se mostrará nuevamente.
Generado: ${new Date().toLocaleString()}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credenciales_${credentials.email.replace('@', '_').replace('.', '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inputClass = "h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg px-3 font-mono text-sm";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-emerald-900/5 dark:shadow-emerald-900/20 p-0 gap-0 overflow-hidden">
        {/* Decorative top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600" />

        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <KeyRound className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              {t('dialogs.credentials.title')}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {t('dialogs.credentials.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4 space-y-4">
          {/* Warning message */}
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              {t('dialogs.credentials.warning')}
            </p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('dialogs.credentials.name')}
            </label>
            <div className={`${inputClass} flex items-center`}>
              {credentials.name}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('dialogs.credentials.email')}
            </label>
            <div className="flex gap-2">
              <div className={`${inputClass} flex-1 flex items-center`}>
                {credentials.email}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleCopy(credentials.email, 'email')}
                className="h-10 w-10 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {copiedEmail ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-zinc-500" />
                )}
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('dialogs.credentials.password')}
            </label>
            <div className="flex gap-2">
              <div className={`${inputClass} flex-1 flex items-center`}>
                {credentials.password}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleCopy(credentials.password, 'password')}
                className="h-10 w-10 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {copiedPassword ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-zinc-500" />
                )}
              </Button>
            </div>
          </div>

          {/* Login URL */}
          <div className="space-y-1.5">
            <label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
              {t('dialogs.credentials.loginUrl')}
            </label>
            <div className="flex gap-2">
              <div className={`${inputClass} flex-1 flex items-center text-xs overflow-hidden`}>
                <span className="truncate">{credentials.login_url}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => window.open(credentials.login_url, '_blank')}
                className="h-10 w-10 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <ExternalLink className="w-4 h-4 text-zinc-500" />
              </Button>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 -mx-6 px-6 -mb-1">
            <Button
              type="button"
              onClick={handleDownload}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('dialogs.credentials.download')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              {t('dialogs.credentials.close')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
