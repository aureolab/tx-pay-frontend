import { useState, useEffect } from 'react';
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
import { AlertCircle, UserPlus } from 'lucide-react';
import { PartnerUserTypes, PartnerUserStatuses } from '@/lib/constants';

interface PartnerUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  item?: any;
  partnerId: string;
  partnerMerchants?: any[];
}

export function PartnerUserDialog({ open, onOpenChange, onSuccess, item, partnerId, partnerMerchants = [] }: PartnerUserDialogProps) {
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
        assigned_merchants: item.assigned_merchants?.map((m: any) => typeof m === 'string' ? m : m._id) || [],
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
      const payload: any = {
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
        await partnerUsersApi.update(item._id, payload);
      } else {
        await partnerUsersApi.create(payload);
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            {isEdit ? 'Edit User' : 'Create User'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update partner user information.' : 'Add a new user to this partner.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="pu-name">Name *</Label>
            <Input
              id="pu-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="User Name"
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pu-email">Email *</Label>
            <Input
              id="pu-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@partner.com"
              required={!isEdit}
              disabled={isEdit}
              className="h-11"
            />
          </div>
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="pu-password">Password *</Label>
              <Input
                id="pu-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                className="h-11"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label>Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {PartnerUserTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-zinc-500">
              {formData.type === 'PARTNER' ? 'Full access to all partner merchants' : 'Access only to assigned merchants'}
            </p>
          </div>
          {formData.type === 'CLIENT' && partnerMerchants.length > 0 && (
            <div className="space-y-2">
              <Label>Assigned Merchants</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg min-h-[44px]">
                {partnerMerchants.map((m: any) => (
                  <Badge
                    key={m._id}
                    variant={formData.assigned_merchants.includes(m._id) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all ${
                      formData.assigned_merchants.includes(m._id)
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                    onClick={() => handleMerchantToggle(m._id)}
                  >
                    {m.profile?.fantasy_name || m._id}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {formData.type === 'CLIENT' && partnerMerchants.length === 0 && (
            <p className="text-sm text-zinc-500">No merchants available for assignment</p>
          )}
          {isEdit && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {PartnerUserStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (isEdit ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
