import { useTranslation } from 'react-i18next';
import type { AdminUser } from '@/types/admin.types';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Users } from 'lucide-react';
import { getStatusConfig } from '@/lib/constants';

export function AdminDetailDialog({ item, open, onOpenChange }: { item: AdminUser | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation('admin');
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-blue-900/5 dark:shadow-blue-900/20 p-0 gap-0 overflow-hidden">
        {/* Decorative top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Users className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              {t('dialogs.adminDetail.title')}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {t('dialogs.adminDetail.description', { name: item.full_name || item.email })}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4 grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.adminDetail.fullName')}</Label>
              <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.full_name || '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.adminDetail.email')}</Label>
              <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.email}</p>
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.adminDetail.status')}</Label>
              <div className="mt-1">
                <Badge variant={getStatusConfig(item.active ? 'ACTIVE' : 'INACTIVE').variant} className={getStatusConfig(item.active ? 'ACTIVE' : 'INACTIVE').className}>
                  {item.active ? t('dialogs.adminDetail.active') : t('dialogs.adminDetail.inactive')}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.adminDetail.roles')}</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.roles?.length > 0 ? item.roles.map((role: string) => (
                  <Badge key={role} variant="outline" className="text-xs bg-blue-500/5 text-blue-700 dark:text-blue-300 border-blue-500/20">{role}</Badge>
                )) : <span className="text-zinc-500 text-sm">{t('dialogs.adminDetail.noRoles')}</span>}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.adminDetail.userId')}</Label>
            <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg mt-1 text-zinc-700 dark:text-zinc-300">{item._id}</p>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.common.createdAt')}</Label>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.common.updatedAt')}</Label>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
