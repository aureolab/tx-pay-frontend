import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CreditCard } from 'lucide-react';
import { getStatusConfig, getPaymentMethodLabel } from '@/lib/constants';

export function TransactionDetailDialog({ item, open, onOpenChange }: { item: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!item) return null;
  const statusConfig = getStatusConfig(item.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            Transaction Details
          </DialogTitle>
          <DialogDescription>
            Transaction ID: {item._id}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-100px)] px-6 pb-6">
        <div className="grid gap-4 pt-4">
          {/* Status & Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Status</Label>
              <div className="mt-1">
                <Badge variant={statusConfig.variant} className={statusConfig.className}>{statusConfig.label}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Payment Method</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{getPaymentMethodLabel(item.payment_method) || '-'}</p>
            </div>
          </div>

          {/* Financials */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Financial Details</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Gross Amount</Label>
                <p className="font-semibold text-lg text-zinc-900 dark:text-white">
                  {item.financials?.currency} {
                    item.financials?.amount_gross?.$numberDecimal ||
                    item.financials?.amount_gross?.toLocaleString() ||
                    item.financials?.amount_gross
                  }
                </p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Net Amount</Label>
                <p className="font-medium text-zinc-900 dark:text-white">
                  {item.financials?.currency} {
                    item.financials?.amount_net?.$numberDecimal ||
                    item.financials?.amount_net?.toLocaleString() ||
                    item.financials?.amount_net || '-'
                  }
                </p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Currency</Label>
                <p className="font-medium text-zinc-900 dark:text-white">{item.financials?.currency || '-'}</p>
              </div>
            </div>
            {item.financials?.fee_snapshot && (
              <div className="mt-2 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg text-sm">
                <p><span className="text-zinc-500">Fee Fixed:</span> {item.financials.fee_snapshot.fixed?.$numberDecimal || item.financials.fee_snapshot.fixed || 0}</p>
                <p><span className="text-zinc-500">Fee Percentage:</span> {item.financials.fee_snapshot.percentage?.$numberDecimal || item.financials.fee_snapshot.percentage || 0}%</p>
              </div>
            )}
          </div>

          {/* IDs */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">References</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="min-w-0">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Merchant ID</Label>
                <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg break-all">{item.merchant_id || '-'}</p>
              </div>
              {item.terminal_id && (
                <div className="min-w-0">
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Terminal ID</Label>
                  <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg break-all">{item.terminal_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* User Context */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">User Context</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Is Guest</Label>
                <p className="font-medium text-zinc-900 dark:text-white">{item.user_context?.is_guest ? 'Yes' : 'No'}</p>
              </div>
              {item.user_context?.psp_user_id && (
                <div className="min-w-0">
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">PSP User ID</Label>
                  <p className="font-mono text-sm break-all">{item.user_context.psp_user_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Callback URL */}
          {item.callback_url && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Callback URL</Label>
              <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg break-all mt-1">{item.callback_url}</p>
            </div>
          )}

          {/* Gateway Result */}
          {item.gateway_result && Object.keys(item.gateway_result).length > 0 && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Gateway Result</Label>
              <ScrollArea className="mt-2 h-40 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <pre className="p-3 text-xs whitespace-pre-wrap break-all">
                  {JSON.stringify(item.gateway_result, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          )}

          {/* Expires At */}
          {item.expires_at && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Expires At</Label>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{new Date(item.expires_at).toLocaleString()}</p>
            </div>
          )}

          {/* Timestamps */}
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
