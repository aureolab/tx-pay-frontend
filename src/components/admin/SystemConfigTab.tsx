import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { systemConfigApi } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Check, Plus, Trash2, Settings, Shield } from 'lucide-react';

interface AcquirerDefault {
  provider: string;
  config: any;
}

interface SystemConfig {
  iva_percentage: number;
  acquirer_defaults: AcquirerDefault[];
}

const AVAILABLE_PROVIDERS = ['WEBPAY', 'VITA_WALLET'];

export function SystemConfigTab() {
  const { t } = useTranslation(['admin']);

  const [config, setConfig] = useState<SystemConfig>({
    iva_percentage: 19,
    acquirer_defaults: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await systemConfigApi.get();
      setConfig({
        iva_percentage: res.data.iva_percentage ?? 19,
        acquirer_defaults: res.data.acquirer_defaults ?? [],
      });
    } catch (err: any) {
      setError(err.response?.data?.message || t('admin:configuration.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Parse JSON configs before sending
      const parsedDefaults = config.acquirer_defaults.map((d) => ({
        provider: d.provider,
        config: typeof d.config === 'string' ? JSON.parse(d.config) : d.config,
      }));
      await systemConfigApi.update({
        iva_percentage: config.iva_percentage,
        acquirer_defaults: parsedDefaults,
      });
      setSuccess(t('admin:configuration.saved'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON in acquirer configuration');
      } else {
        setError(err.response?.data?.message || t('admin:configuration.error'));
      }
    } finally {
      setSaving(false);
    }
  };

  const addAcquirerDefault = () => {
    setConfig((prev) => ({
      ...prev,
      acquirer_defaults: [
        ...prev.acquirer_defaults,
        { provider: '', config: '{}' },
      ],
    }));
  };

  const removeAcquirerDefault = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      acquirer_defaults: prev.acquirer_defaults.filter((_, i) => i !== index),
    }));
  };

  const updateAcquirerDefault = (
    index: number,
    field: 'provider' | 'config',
    value: string,
  ) => {
    setConfig((prev) => ({
      ...prev,
      acquirer_defaults: prev.acquirer_defaults.map((d, i) =>
        i === index ? { ...d, [field]: value } : d,
      ),
    }));
  };

  const usedProviders = config.acquirer_defaults.map((d) => d.provider);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/50">
          <Check className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-700 dark:text-emerald-300">{success}</AlertDescription>
        </Alert>
      )}

      {/* Tax Settings */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
        <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-white">{t('admin:configuration.tax.title')}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('admin:configuration.tax.ivaDescription')}</p>
          </div>
        </div>
        <div className="p-6">
          <div className="max-w-xs">
            <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t('admin:configuration.tax.ivaPercentage')}
            </Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={config.iva_percentage}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    iva_percentage: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-32"
              />
              <span className="text-lg font-medium text-zinc-500">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Acquirer Defaults */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
        <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">{t('admin:configuration.acquirers.title')}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('admin:configuration.acquirers.description')}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addAcquirerDefault}
            disabled={usedProviders.length >= AVAILABLE_PROVIDERS.length}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('admin:configuration.acquirers.add')}
          </Button>
        </div>

        <div className="p-6">
          {config.acquirer_defaults.length === 0 ? (
            <p className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm">
              {t('admin:configuration.acquirers.noDefaults')}
            </p>
          ) : (
            <div className="space-y-4">
              {config.acquirer_defaults.map((acquirer, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-700/40 bg-zinc-50/50 dark:bg-zinc-800/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {t('admin:configuration.acquirers.provider')}
                        </Label>
                        <Select
                          value={acquirer.provider}
                          onValueChange={(value) =>
                            updateAcquirerDefault(index, 'provider', value)
                          }
                        >
                          <SelectTrigger className="mt-1 w-60">
                            <SelectValue placeholder={t('admin:configuration.acquirers.selectProvider')} />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_PROVIDERS.filter(
                              (p) => !usedProviders.includes(p) || p === acquirer.provider,
                            ).map((p) => (
                              <SelectItem key={p} value={p}>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {p}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {t('admin:configuration.acquirers.config')}
                        </Label>
                        <textarea
                          className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 font-mono text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[80px] resize-y"
                          value={
                            typeof acquirer.config === 'string'
                              ? acquirer.config
                              : JSON.stringify(acquirer.config, null, 2)
                          }
                          onChange={(e) =>
                            updateAcquirerDefault(index, 'config', e.target.value)
                          }
                          rows={4}
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeAcquirerDefault(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 mt-5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 px-8"
        >
          {saving ? t('admin:configuration.saving') : t('admin:configuration.save')}
        </Button>
      </div>
    </div>
  );
}
