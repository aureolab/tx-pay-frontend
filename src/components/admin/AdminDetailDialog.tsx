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

export function AdminDetailDialog({ item, open, onOpenChange }: { item: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            Admin User Details
          </DialogTitle>
          <DialogDescription>
            Information for {item.full_name || item.email}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Full Name</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{item.full_name || '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Email</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{item.email}</p>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Status</Label>
              <div className="mt-1">
                <Badge variant={getStatusConfig(item.active ? 'ACTIVE' : 'INACTIVE').variant} className={getStatusConfig(item.active ? 'ACTIVE' : 'INACTIVE').className}>
                  {item.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Roles</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.roles?.length > 0 ? item.roles.map((role: string) => (
                  <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                )) : <span className="text-zinc-500">No roles</span>}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">User ID</Label>
            <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg mt-1">{item._id}</p>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Created At</Label>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Updated At</Label>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
