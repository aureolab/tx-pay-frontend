import { useState, useEffect } from 'react';
import { partnersApi } from '../../api/client';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Handshake } from 'lucide-react';
import { PartnerStatuses } from '@/lib/constants';

interface PartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  item?: any;
}

export function PartnerDialog({ open, onOpenChange, onSuccess, item }: PartnerDialogProps) {
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fantasy_name: '',
    business_name: '',
    tax_id: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    status: 'ACTIVE' as string,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        fantasy_name: item.fantasy_name || '',
        business_name: item.business_name || '',
        tax_id: item.tax_id || '',
        contact_name: item.contact_name || '',
        contact_email: item.contact_email || '',
        contact_phone: item.contact_phone || '',
        status: item.status || 'ACTIVE',
      });
    } else {
      setFormData({
        fantasy_name: '',
        business_name: '',
        tax_id: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        status: 'ACTIVE',
      });
    }
    setError('');
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        fantasy_name: formData.fantasy_name,
        business_name: formData.business_name,
        tax_id: formData.tax_id,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
      };

      if (isEdit) {
        payload.status = formData.status;
        await partnersApi.update(item._id, payload);
      } else {
        await partnersApi.create(payload);
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} partner`);
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
              <Handshake className="w-4 h-4 text-white" />
            </div>
            {isEdit ? 'Edit Partner' : 'Create Partner'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update partner information.' : 'Add a new partner to the system.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partner-fantasy">Fantasy Name *</Label>
              <Input
                id="partner-fantasy"
                value={formData.fantasy_name}
                onChange={(e) => setFormData({ ...formData, fantasy_name: e.target.value })}
                placeholder="Partner Name"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-business">Business Name *</Label>
              <Input
                id="partner-business"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="Partner SpA"
                required
                className="h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="partner-tax">Tax ID (RUT) *</Label>
            <Input
              id="partner-tax"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              placeholder="12.345.678-9"
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partner-contact-name">Contact Name *</Label>
            <Input
              id="partner-contact-name"
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              placeholder="John Doe"
              required
              className="h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partner-email">Contact Email *</Label>
              <Input
                id="partner-email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contact@partner.com"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-phone">Contact Phone</Label>
              <Input
                id="partner-phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+56 9 1234 5678"
                className="h-11"
              />
            </div>
          </div>
          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="partner-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {PartnerStatuses.map(status => (
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
