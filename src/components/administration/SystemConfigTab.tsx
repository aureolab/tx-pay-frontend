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
import { AlertCircle, Check, Plus, Trash2, Settings, Shield, FileSpreadsheet, RotateCcw, DollarSign, Globe } from 'lucide-react';
import { getErrorMessage } from '@/types/api-error.types';
import { PaymentMethods } from '@/lib/constants';
import { VITA_WALLET_COUNTRIES } from '@/lib/vita-countries';

interface AcquirerDefault {
  provider: string;
  config: string | Record<string, unknown>;
}

interface PricingRuleDefault {
  method: string;
  fixed: number;
  percentage: number;
}

interface ExportColumn {
  key: string;
  label: string;
  path: string;
  type: string;
}

interface SystemConfig {
  iva_percentage: number;
  acquirer_defaults: AcquirerDefault[];
  pricing_rules_defaults: PricingRuleDefault[];
  export_columns: ExportColumn[];
}

const AVAILABLE_PROVIDERS = ['WEBPAY', 'VITA_WALLET'];

export function SystemConfigTab() {
  const { t } = useTranslation(['admin']);

  const [config, setConfig] = useState<SystemConfig>({
    iva_percentage: 19,
    acquirer_defaults: [],
    pricing_rules_defaults: [],
    export_columns: [],
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
        pricing_rules_defaults: (res.data.pricing_rules_defaults ?? []).map(r => ({
          method: r.method,
          fixed: typeof r.fixed === 'object' && r.fixed !== null && '$numberDecimal' in r.fixed ? parseFloat(r.fixed.$numberDecimal) : Number(r.fixed),
          percentage: typeof r.percentage === 'object' && r.percentage !== null && '$numberDecimal' in r.percentage ? parseFloat(r.percentage.$numberDecimal) : Number(r.percentage),
        })),
        export_columns: res.data.export_columns ?? [],
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t('admin:configuration.loadError'));
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
        pricing_rules_defaults: config.pricing_rules_defaults,
        export_columns: config.export_columns,
      });
      setSuccess(t('admin:configuration.saved'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON in acquirer configuration');
      } else {
        setError(getErrorMessage(err) || t('admin:configuration.error'));
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

  const addPricingDefault = () => {
    setConfig((prev) => ({
      ...prev,
      pricing_rules_defaults: [
        ...prev.pricing_rules_defaults,
        { method: '', fixed: 0, percentage: 0 },
      ],
    }));
  };

  const removePricingDefault = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      pricing_rules_defaults: prev.pricing_rules_defaults.filter((_, i) => i !== index),
    }));
  };

  const updatePricingDefault = (
    index: number,
    field: keyof PricingRuleDefault,
    value: string | number,
  ) => {
    setConfig((prev) => ({
      ...prev,
      pricing_rules_defaults: prev.pricing_rules_defaults.map((d, i) =>
        i === index ? { ...d, [field]: value } : d,
      ),
    }));
  };

  const usedMethods = config.pricing_rules_defaults.map((d) => d.method);

  const addExportColumn = () => {
    setConfig((prev) => ({
      ...prev,
      export_columns: [
        ...prev.export_columns,
        { key: '', label: '', path: '', type: 'string' },
      ],
    }));
  };

  const removeExportColumn = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      export_columns: prev.export_columns.filter((_, i) => i !== index),
    }));
  };

  const updateExportColumn = (
    index: number,
    field: keyof ExportColumn,
    value: string,
  ) => {
    setConfig((prev) => ({
      ...prev,
      export_columns: prev.export_columns.map((col, i) =>
        i === index ? { ...col, [field]: value } : col,
      ),
    }));
  };

  const restoreDefaultColumns = async () => {
    try {
      const res = await systemConfigApi.getDefaultExportColumns();
      setConfig((prev) => ({
        ...prev,
        export_columns: res.data,
      }));
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Error loading default columns');
    }
  };

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
        <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center shrink-0">
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
            className="gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t('admin:configuration.acquirers.add')}
          </Button>
        </div>

        <div className="p-4 sm:p-6">
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
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between sm:block">
                        <div className="flex-1">
                          <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            {t('admin:configuration.acquirers.provider')}
                          </Label>
                          <Select
                            value={acquirer.provider}
                            onValueChange={(value) =>
                              updateAcquirerDefault(index, 'provider', value)
                            }
                          >
                            <SelectTrigger className="mt-1 w-full sm:w-60">
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
                        {/* Delete button on mobile - inline with provider */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAcquirerDefault(index)}
                          className="sm:hidden h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 ml-2 mt-5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {t('admin:configuration.acquirers.config')}
                        </Label>
                        <textarea
                          className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 font-mono text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px] resize-y"
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

                      {/* Vita Wallet Countries Selector */}
                      {acquirer.provider === 'VITA_WALLET' && (
                        <div className="mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-700/40">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="w-4 h-4 text-blue-500" />
                            <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              {t('admin:configuration.acquirers.enabledCountries')}
                            </Label>
                          </div>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">
                            {t('admin:configuration.acquirers.enabledCountriesHint')}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {VITA_WALLET_COUNTRIES.map((country) => {
                              const configObj = typeof acquirer.config === 'string'
                                ? (() => { try { return JSON.parse(acquirer.config); } catch { return {}; } })()
                                : acquirer.config || {};
                              const enabledCountries: string[] = configObj.enabled_countries || [];
                              const isChecked = enabledCountries.includes(country.code);

                              return (
                                <label
                                  key={country.code}
                                  className={`
                                    flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors
                                    ${isChecked
                                      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                                      : 'bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200/60 dark:border-zinc-700/40 hover:bg-zinc-100/50 dark:hover:bg-zinc-700/30'
                                    }
                                  `}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      const newEnabledCountries = checked
                                        ? [...enabledCountries, country.code]
                                        : enabledCountries.filter((c) => c !== country.code);
                                      const newConfig = { ...configObj, enabled_countries: newEnabledCountries };
                                      updateAcquirerDefault(index, 'config', JSON.stringify(newConfig, null, 2));
                                    }}
                                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                  />
                                  <img
                                    src={country.code === 'EU' ? 'https://flagcdn.com/20x15/eu.png' : `https://flagcdn.com/20x15/${country.code.toLowerCase()}.png`}
                                    alt={country.name}
                                    className="w-5 h-4 object-cover rounded-sm"
                                  />
                                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                                    {country.name}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                            {(() => {
                              const configObj = typeof acquirer.config === 'string'
                                ? (() => { try { return JSON.parse(acquirer.config); } catch { return {}; } })()
                                : acquirer.config || {};
                              const enabledCountries: string[] = configObj.enabled_countries || [];
                              return enabledCountries.length === 0
                                ? t('admin:configuration.acquirers.allCountries')
                                : `${enabledCountries.length} ${enabledCountries.length === 1 ? 'país' : 'países'} seleccionados`;
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Delete button on desktop */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeAcquirerDefault(index)}
                      className="hidden sm:flex h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 mt-5"
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

      {/* Pricing Rules Defaults */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
        <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">{t('admin:configuration.pricingDefaults.title')}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('admin:configuration.pricingDefaults.description')}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addPricingDefault}
            disabled={usedMethods.length >= PaymentMethods.length}
            className="gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t('admin:configuration.pricingDefaults.add')}
          </Button>
        </div>

        <div className="p-4 sm:p-6">
          {config.pricing_rules_defaults.length === 0 ? (
            <p className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm">
              {t('admin:configuration.pricingDefaults.noDefaults')}
            </p>
          ) : (
            <div className="space-y-3">
              {config.pricing_rules_defaults.map((rule, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-700/40 bg-zinc-50/50 dark:bg-zinc-800/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <div className="flex-1">
                      <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {t('admin:configuration.pricingDefaults.method')}
                      </Label>
                      <Select
                        value={rule.method}
                        onValueChange={(value) => updatePricingDefault(index, 'method', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={t('admin:configuration.pricingDefaults.selectMethod')} />
                        </SelectTrigger>
                        <SelectContent>
                          {PaymentMethods.filter(
                            (m) => !usedMethods.includes(m) || m === rule.method,
                          ).map((m) => (
                            <SelectItem key={m} value={m}>
                              <Badge variant="outline" className="text-xs">{m}</Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:contents">
                      <div className="sm:w-28">
                        <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {t('admin:configuration.pricingDefaults.fixed')}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={rule.fixed}
                          onChange={(e) => updatePricingDefault(index, 'fixed', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div className="sm:w-28">
                        <Label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {t('admin:configuration.pricingDefaults.percentage')}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={rule.percentage}
                          onChange={(e) => updatePricingDefault(index, 'percentage', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePricingDefault(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 self-end"
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

      {/* Export Columns */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
        <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">{t('admin:configuration.exportColumns.title')}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('admin:configuration.exportColumns.description')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={restoreDefaultColumns}
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin:configuration.exportColumns.restoreDefaults')}</span>
              <span className="sm:hidden">Reset</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addExportColumn}
              className="gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('admin:configuration.exportColumns.addColumn')}</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {config.export_columns.length === 0 ? (
            <p className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-sm">
              {t('admin:configuration.exportColumns.noColumns')}
            </p>
          ) : (
            <div className="space-y-3">
              {/* Desktop Header - Hidden on mobile */}
              <div className="hidden lg:grid grid-cols-[1fr_1fr_1fr_120px_40px] gap-2 px-2 pb-2 border-b border-zinc-200/50 dark:border-zinc-700/50">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('admin:configuration.exportColumns.key')}</span>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('admin:configuration.exportColumns.label')}</span>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('admin:configuration.exportColumns.path')}</span>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('admin:configuration.exportColumns.type')}</span>
                <span />
              </div>
              {config.export_columns.map((col, index) => (
                <div key={index}>
                  {/* Desktop Layout */}
                  <div className="hidden lg:grid grid-cols-[1fr_1fr_1fr_120px_40px] gap-2 items-center">
                    <Input
                      value={col.key}
                      onChange={(e) => updateExportColumn(index, 'key', e.target.value)}
                      placeholder="transaction_id"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={col.label}
                      onChange={(e) => updateExportColumn(index, 'label', e.target.value)}
                      placeholder="ID Transacción"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={col.path}
                      onChange={(e) => updateExportColumn(index, 'path', e.target.value)}
                      placeholder="_id"
                      className="h-8 text-sm font-mono"
                    />
                    <Select
                      value={col.type}
                      onValueChange={(value) => updateExportColumn(index, 'type', value)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">string</SelectItem>
                        <SelectItem value="decimal">decimal</SelectItem>
                        <SelectItem value="date">date</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeExportColumn(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {/* Mobile/Tablet Layout - Card style */}
                  <div className="lg:hidden p-3 rounded-lg border border-zinc-200/60 dark:border-zinc-700/40 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">#{index + 1}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeExportColumn(index)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-zinc-500 dark:text-zinc-400">{t('admin:configuration.exportColumns.key')}</Label>
                        <Input
                          value={col.key}
                          onChange={(e) => updateExportColumn(index, 'key', e.target.value)}
                          placeholder="transaction_id"
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-zinc-500 dark:text-zinc-400">{t('admin:configuration.exportColumns.label')}</Label>
                        <Input
                          value={col.label}
                          onChange={(e) => updateExportColumn(index, 'label', e.target.value)}
                          placeholder="ID Transacción"
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-zinc-500 dark:text-zinc-400">{t('admin:configuration.exportColumns.path')}</Label>
                        <Input
                          value={col.path}
                          onChange={(e) => updateExportColumn(index, 'path', e.target.value)}
                          placeholder="_id"
                          className="h-8 text-sm font-mono mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-zinc-500 dark:text-zinc-400">{t('admin:configuration.exportColumns.type')}</Label>
                        <Select
                          value={col.type}
                          onValueChange={(value) => updateExportColumn(index, 'type', value)}
                        >
                          <SelectTrigger className="h-8 text-sm mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">string</SelectItem>
                            <SelectItem value="decimal">decimal</SelectItem>
                            <SelectItem value="date">date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
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
