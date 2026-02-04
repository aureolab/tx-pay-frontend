import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LogOut, KeyRound, Sun, Moon, Languages, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';

interface DashboardHeaderProps {
  portalName: string;
  icon: LucideIcon;
  gradientClass: string;
  shadowClass: string;
  userName: string;
  userEmail: string;
  onLogout: () => void;
  logoutLabel: string;
  onChangePassword?: () => void;
  changePasswordLabel?: string;
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
  onChangePassword,
  changePasswordLabel,
}: DashboardHeaderProps) {
  const { t, i18n } = useTranslation(['common']);
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const currentLang = i18n.language?.startsWith('es') ? 'es' : 'en';

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="relative z-10 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Portal Name */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg ${shadowClass}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-zinc-900 dark:text-white">TX Pay</span>
              <span className="hidden sm:inline text-lg text-zinc-400 dark:text-zinc-500 ml-1">{portalName}</span>
            </div>
          </div>

          {/* Profile Dropdown */}
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 h-10 px-2 sm:px-3 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-xs font-medium`}>
                  {getInitials(userName)}
                </div>
                {/* Name - hidden on mobile */}
                <span className="hidden sm:block text-sm font-medium text-zinc-700 dark:text-zinc-300 max-w-[120px] truncate">
                  {userName || userEmail}
                </span>
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              {/* User Info Header */}
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3 py-1">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-sm font-medium shrink-0`}>
                    {getInitials(userName)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {userName || t('common:user')}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {userEmail}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />

              {/* Change Password */}
              {onChangePassword && (
                <DropdownMenuItem
                  onClick={() => {
                    setOpen(false);
                    onChangePassword();
                  }}
                  className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800"
                >
                  <KeyRound className="w-4 h-4 mr-3 text-zinc-500" />
                  <span>{changePasswordLabel || t('common:changePassword')}</span>
                </DropdownMenuItem>
              )}

              {/* Language Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800">
                  <Languages className="w-4 h-4 mr-3 text-zinc-500" />
                  <span>{t('common:language')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <DropdownMenuRadioGroup value={currentLang} onValueChange={handleLanguageChange}>
                    <DropdownMenuRadioItem value="es" className="cursor-pointer">
                      Espa\u00f1ol
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="en" className="cursor-pointer">
                      English
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Theme Toggle */}
              <DropdownMenuItem
                onClick={handleThemeToggle}
                className="cursor-pointer focus:bg-zinc-100 dark:focus:bg-zinc-800"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 mr-3 text-zinc-500" />
                ) : (
                  <Moon className="w-4 h-4 mr-3 text-zinc-500" />
                )}
                <span>{theme === 'dark' ? t('common:lightMode') : t('common:darkMode')}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-zinc-200 dark:bg-zinc-800" />

              {/* Logout */}
              <DropdownMenuItem
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-600 dark:focus:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-3" />
                <span>{logoutLabel}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
