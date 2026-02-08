import { useState } from 'react';
import { partnerPaymentLinksApi } from '../../api/partnerClient';
import { Button } from '@/components/ui/button';
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
import { Link2, Copy, Check, Download, ExternalLink, QrCode } from 'lucide-react';
import type { PaymentLink } from '@/types/payment-link.types';
import { formatCurrency } from '@/types/payment-link.types';
import { downloadBlob } from '@/lib/downloadFile';

interface PartnerPaymentLinkDetailDialogProps {
  item: PaymentLink | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerPaymentLinkDetailDialog({
  item,
  open,
  onOpenChange,
}: PartnerPaymentLinkDetailDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadQr = async (format: 'png' | 'svg' | 'pdf') => {
    if (!item) return;
    setDownloading(format);
    try {
      let response;
      if (format === 'png') {
        response = await partnerPaymentLinksApi.downloadQrPng(item._id);
      } else if (format === 'svg') {
        response = await partnerPaymentLinksApi.downloadQrSvg(item._id);
      } else {
        response = await partnerPaymentLinksApi.downloadQrPdf(item._id);
      }
      downloadBlob(response.data, `${item.slug}-qr.${format}`);
    } catch (err) {
      console.error('Failed to download QR:', err);
    } finally {
      setDownloading(null);
    }
  };

  if (!item) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: 'Activo', variant: 'default' as const, className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'INACTIVE':
        return { label: 'Inactivo', variant: 'secondary' as const, className: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400' };
      case 'EXPIRED':
        return { label: 'Expirado', variant: 'destructive' as const, className: 'bg-red-500/10 text-red-600 dark:text-red-400' };
      case 'EXHAUSTED':
        return { label: 'Agotado', variant: 'outline' as const, className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' };
      default:
        return { label: status, variant: 'outline' as const, className: '' };
    }
  };

  const statusConfig = getStatusConfig(item.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-amber-900/5 dark:shadow-amber-900/20 p-0 gap-0 overflow-hidden">
        {/* Decorative top accent - amber for partners */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
              <Link2 className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              Detalle de Link de Pago
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {item.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 pb-6 pt-4 grid gap-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Nombre</Label>
                <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.name}</p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Estado</Label>
                <div className="mt-1">
                  <Badge variant={statusConfig.variant} className={statusConfig.className}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Slug</Label>
                <p className="font-mono text-sm text-zinc-900 dark:text-white mt-0.5">{item.slug}</p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Moneda</Label>
                <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.currency}</p>
              </div>
            </div>

            {item.description && (
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Descripcion</Label>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{item.description}</p>
              </div>
            )}

            {/* Configuration */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Configuracion</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Modo de Link</Label>
                  <Badge variant="outline" className="mt-1 bg-amber-500/5 text-amber-700 dark:text-amber-300 border-amber-500/20">
                    {item.link_mode === 'SINGLE_USE' ? 'Uso Unico' : 'Reutilizable'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Modo de Monto</Label>
                  <Badge variant="outline" className="mt-1 bg-orange-500/5 text-orange-700 dark:text-orange-300 border-orange-500/20">
                    {item.amount_mode === 'FIXED' ? 'Fijo' : 'Variable'}
                  </Badge>
                </div>
              </div>

              {/* Amount Info */}
              <div className="mt-4">
                {item.amount_mode === 'FIXED' && item.fixed_amount && (
                  <div>
                    <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Monto Fijo</Label>
                    <p className="font-bold text-xl text-zinc-900 dark:text-white mt-0.5">
                      {formatCurrency(item.fixed_amount, item.currency)}
                    </p>
                  </div>
                )}
                {item.amount_mode === 'VARIABLE' && item.amount_limits && (
                  <div>
                    <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Limites de Monto</Label>
                    <p className="font-medium text-zinc-900 dark:text-white mt-0.5">
                      {formatCurrency(item.amount_limits.min_amount ?? 0, item.currency)} - {formatCurrency(item.amount_limits.max_amount ?? 0, item.currency)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* URLs */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">URLs</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Link Directo</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg break-all flex-1">
                      {item.checkout_url}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(item.checkout_url || '', 'checkout')}
                      className="shrink-0 h-8 w-8 p-0"
                    >
                      {copiedField === 'checkout' ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(item.checkout_url, '_blank')}
                      className="shrink-0 h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Link QR</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg break-all flex-1">
                      {item.qr_url}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(item.qr_url || '', 'qr')}
                      className="shrink-0 h-8 w-8 p-0"
                    >
                      {copiedField === 'qr' ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(item.qr_url, '_blank')}
                      className="shrink-0 h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Download */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Descargar Codigo QR</Label>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadQr('png')}
                  disabled={downloading !== null}
                  className="flex items-center gap-2"
                >
                  {downloading === 'png' ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadQr('svg')}
                  disabled={downloading !== null}
                  className="flex items-center gap-2"
                >
                  {downloading === 'svg' ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  SVG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadQr('pdf')}
                  disabled={downloading !== null}
                  className="flex items-center gap-2"
                >
                  {downloading === 'pdf' ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  PDF Imprimible
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Estadisticas</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div className="bg-zinc-50/80 dark:bg-zinc-800/30 p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {item.stats.usage_count}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Usos</p>
                </div>
                <div className="bg-zinc-50/80 dark:bg-zinc-800/30 p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-zinc-900 dark:text-white">
                    {formatCurrency(item.stats.total_collected, item.currency)}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Recaudado</p>
                </div>
                <div className="bg-zinc-50/80 dark:bg-zinc-800/30 p-3 rounded-lg text-center">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {item.stats.last_used_at
                      ? new Date(item.stats.last_used_at).toLocaleDateString()
                      : '-'}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Ultimo Uso</p>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Creado</Label>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Actualizado</Label>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">
                  {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
