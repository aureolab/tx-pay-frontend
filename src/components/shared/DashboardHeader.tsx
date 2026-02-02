import type { LucideIcon } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

interface DashboardHeaderProps {
  portalName: string;
  icon: LucideIcon;
  gradientClass: string;
  shadowClass: string;
  userName: string;
  userEmail: string;
  onLogout: () => void;
  logoutLabel: string;
  rightSlot?: React.ReactNode;
}

export function DashboardHeader({
  portalName,
  icon: Icon,
  gradientClass,
  shadowClass,
  userName,
  userEmail,
  onLogout,
  logoutLabel,
  rightSlot,
}: DashboardHeaderProps) {
  return (
    <header className="relative z-10 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg ${shadowClass}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-zinc-900 dark:text-white">TX Pay</span>
              <span className="hidden sm:inline text-lg text-zinc-400 dark:text-zinc-500 ml-1">{portalName}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-zinc-900 dark:text-white">{userName}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{userEmail}</span>
            </div>
            {rightSlot}
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="gap-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{logoutLabel}</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
