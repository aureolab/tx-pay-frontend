import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CreditCard,
  Zap,
  BarChart3,
  Headphones,
  ArrowRight,
  Send,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { contactApi } from '@/api/client';

export default function LandingPage() {
  const { t } = useTranslation('common');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await contactApi.send(contactForm);
      setSent(true);
      setContactForm({ name: '', email: '', company: '', message: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || t('landing.contact.error'));
    } finally {
      setSending(false);
    }
  };

  const features = [
    {
      icon: CreditCard,
      title: t('landing.features.payments.title'),
      description: t('landing.features.payments.description'),
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/25',
    },
    {
      icon: Zap,
      title: t('landing.features.integration.title'),
      description: t('landing.features.integration.description'),
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
    },
    {
      icon: BarChart3,
      title: t('landing.features.reports.title'),
      description: t('landing.features.reports.description'),
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
    },
    {
      icon: Headphones,
      title: t('landing.features.support.title'),
      description: t('landing.features.support.description'),
      gradient: 'from-purple-500 to-pink-600',
      shadow: 'shadow-purple-500/25',
    },
  ];

  const inputClass =
    'h-11 bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-amber-500 focus:ring-amber-500/20 dark:focus:border-amber-400 dark:focus:ring-amber-400/20 transition-all duration-200 placeholder:text-zinc-400';

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-zinc-100 to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />

      {/* Decorative grid pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '1s' }}
      />
      <div
        className="absolute top-3/4 left-1/2 w-64 h-64 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '2s' }}
      />

      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
                TX Pay
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6 leading-tight">
            {t('landing.title')}
          </h1>
          <p className="text-xl sm:text-2xl text-zinc-600 dark:text-zinc-400 mb-4 max-w-2xl mx-auto">
            {t('landing.subtitle')}
          </p>
          <p className="text-lg text-zinc-500 dark:text-zinc-500 mb-10 max-w-xl mx-auto">
            {t('landing.description')}
          </p>
          <Link
            to="/partners/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-2xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 group text-lg"
          >
            {t('landing.cta')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl p-6 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg ${feature.shadow} group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl shadow-zinc-900/10 dark:shadow-black/30 p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                {t('landing.contact.title')}
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">{t('landing.contact.subtitle')}</p>
            </div>

            {sent ? (
              <Alert className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/80 dark:bg-emerald-950/30">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-sm text-emerald-700 dark:text-emerald-300">
                  {t('landing.contact.success')}
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-5">
                {error && (
                  <Alert
                    variant="destructive"
                    className="border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                    {t('landing.contact.name')} *
                  </Label>
                  <Input
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder={t('landing.contact.namePlaceholder')}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                    {t('landing.contact.email')} *
                  </Label>
                  <Input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder={t('landing.contact.emailPlaceholder')}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                    {t('landing.contact.company')}
                  </Label>
                  <Input
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    placeholder={t('landing.contact.companyPlaceholder')}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                    {t('landing.contact.message')} *
                  </Label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder={t('landing.contact.messagePlaceholder')}
                    required
                    rows={4}
                    className="w-full px-3 py-2.5 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:focus:border-amber-400 dark:focus:ring-amber-400/20 transition-all duration-200 placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300"
                >
                  {sending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{t('landing.contact.sending')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      <span>{t('landing.contact.submit')}</span>
                    </div>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              {t('landing.footer.copyright')}
            </p>
            <Link
              to="/administration/login"
              className="text-xs text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
            >
              {t('landing.footer.admin')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
