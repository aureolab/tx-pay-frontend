import { Link } from 'react-router-dom';
import { Building2, Users, ArrowRight, Home } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function NotFound() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-zinc-100 to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />

      {/* Decorative grid pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid-pattern"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M32 0H0V32"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        {/* 404 Number */}
        <div className="relative mb-6">
          <h1
            className="text-[12rem] sm:text-[16rem] font-black leading-none tracking-tighter select-none"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 25%, #8b5cf6 50%, #f59e0b 75%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            404
          </h1>
          {/* Subtle shadow/glow effect */}
          <div
            className="absolute inset-0 text-[12rem] sm:text-[16rem] font-black leading-none tracking-tighter select-none blur-2xl opacity-20 dark:opacity-10 -z-10"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 25%, #8b5cf6 50%, #f59e0b 75%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            aria-hidden="true"
          >
            404
          </div>
        </div>

        {/* Messages */}
        <h2 className="text-2xl sm:text-3xl font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
          Página no encontrada
        </h2>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-12">
          Page not found
        </p>

        {/* Portal Cards */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          {/* Admin Portal Card */}
          <Link
            to="/administration"
            className="group relative overflow-hidden rounded-2xl p-6 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Card hover gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/10 dark:group-hover:from-blue-500/10 dark:group-hover:to-indigo-500/15 transition-all duration-300" />

            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-1 flex items-center gap-2">
                Admin Portal
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Portal de administración
              </p>
            </div>
          </Link>

          {/* Partner Portal Card */}
          <Link
            to="/partners"
            className="group relative overflow-hidden rounded-2xl p-6 bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Card hover gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/5 group-hover:to-orange-500/10 dark:group-hover:from-amber-500/10 dark:group-hover:to-orange-500/15 transition-all duration-300" />

            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/25 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-1 flex items-center gap-2">
                Partner Portal
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Portal de socios
              </p>
            </div>
          </Link>
        </div>

        {/* Footer hint */}
        <p className="mt-12 text-sm text-zinc-400 dark:text-zinc-500 flex items-center justify-center gap-2">
          <Home className="w-4 h-4" />
          <span>TX Pay</span>
        </p>
      </div>
    </div>
  );
}
