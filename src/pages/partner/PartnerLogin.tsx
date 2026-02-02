import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePartnerAuth } from '../../context/PartnerAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/theme-toggle';
import { AlertCircle, Building2, ArrowRight, Sparkles } from 'lucide-react';

export default function PartnerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const { login } = usePartnerAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/partner');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-400/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-gradient-to-tr from-yellow-400/15 to-amber-500/15 dark:from-yellow-500/5 dark:to-amber-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-gradient-to-tl from-orange-300/20 to-yellow-400/20 dark:from-orange-500/10 dark:to-yellow-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24">
          <div className="max-w-lg">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
                TX Pay
              </span>
            </div>

            <h1 className="text-5xl xl:text-6xl font-bold tracking-tight text-zinc-900 dark:text-white mb-6 leading-[1.1]">
              Portal de{' '}
              <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500 dark:from-amber-400 dark:via-orange-400 dark:to-yellow-400 bg-clip-text text-transparent">
                Partners
              </span>
            </h1>

            <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed mb-12">
              Gestiona tus comercios, monitorea transacciones y accede a reportes en tiempo real desde un solo lugar.
            </p>

            <div className="space-y-4">
              {[
                'Visualización de transacciones en tiempo real',
                'Gestión centralizada de comercios',
                'Reportes y analíticas avanzadas',
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300"
                  style={{
                    animation: 'fadeInUp 0.5s ease-out forwards',
                    animationDelay: `${i * 0.1 + 0.3}s`,
                    opacity: 0
                  }}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Mobile branding */}
            <div className="lg:hidden text-center mb-10">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold tracking-tight text-zinc-800 dark:text-zinc-100">
                  TX Pay
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Portal de Partners
              </h1>
            </div>

            {/* Login card */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl shadow-zinc-900/10 dark:shadow-black/30 p-8 sm:p-10">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-2">
                  Bienvenido
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Accede a tu panel de comercios
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className={`text-sm font-medium transition-colors duration-200 ${
                      focused === 'email'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    Correo electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    required
                    className="h-12 bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-amber-500 focus:ring-amber-500/20 dark:focus:border-amber-400 dark:focus:ring-amber-400/20 transition-all duration-200 placeholder:text-zinc-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className={`text-sm font-medium transition-colors duration-200 ${
                      focused === 'password'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    required
                    className="h-12 bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 rounded-xl focus:border-amber-500 focus:ring-amber-500/20 dark:focus:border-amber-400 dark:focus:ring-amber-400/20 transition-all duration-200 placeholder:text-zinc-400"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:via-orange-600 hover:to-amber-600 text-white font-medium rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300 group"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Iniciando sesión...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Iniciar sesión</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                  ¿Eres administrador?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                  >
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-500">
              © {new Date().getFullYear()} TX Pay. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Inline keyframes for animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
