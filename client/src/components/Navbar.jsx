import React, { useState } from 'react';
import { 
  Award, ShieldCheck, LogOut, KeyRound, Home, 
  LayoutDashboard, Sun, Moon, Menu, X 
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar({ 
  currentView, 
  setCurrentView, 
  admin, 
  onLogout, 
  onOpenNewTestModal, 
  onChangePasswordModal 
}) {
  const { isDark, toggleTheme, lang, setLang, t } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (viewAction) => {
    setMobileMenuOpen(false);
    if (typeof viewAction === 'function') {
      viewAction();
    } else {
      setCurrentView(viewAction);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0e142c]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#1c2752] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div 
            onClick={() => handleNavClick('home')} 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none min-w-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#131936] via-[#1c2754] to-[#2e4288] border border-[#243365] flex items-center justify-center text-white shadow-md shadow-[#131936]/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 truncate">
                ControlTest
                <span className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full bg-[#131936]/10 dark:bg-[#131936] text-[#131936] dark:text-[#8fa7ff] font-semibold border border-[#131936]/20 dark:border-[#2b3d7a] hidden xs:inline-block">
                  Online
                </span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:block leading-none mt-0.5">
                {t('navbar.logo_subtitle')}
              </p>
            </div>
          </div>

          {/* DESKTOP CONTROLS (Hidden on mobile < md) */}
          <div className="hidden md:flex items-center gap-2">
            {admin ? (
              <>
                {/* Admin Navigation & Primary Action */}
                <button
                  onClick={() => setCurrentView('admin-dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    currentView === 'admin-dashboard' 
                      ? 'bg-[#131936] text-white shadow-xs dark:bg-[#25366f] dark:text-white font-semibold' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161f42]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t('navbar.tests')}</span>
                </button>

                <div className="h-5 w-px bg-slate-200 dark:bg-[#1f2c58] mx-1"></div>

                {/* Language Switcher (UZ / RU) */}
                <div className="flex items-center bg-slate-100 dark:bg-[#0c1023] p-0.5 rounded-lg border border-slate-200 dark:border-[#243365] text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setLang('uz')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      lang === 'uz'
                        ? 'bg-white dark:bg-[#25366f] text-[#131936] dark:text-white shadow-xs font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="O'zbekcha"
                  >
                    UZ
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('ru')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      lang === 'ru'
                        ? 'bg-white dark:bg-[#25366f] text-[#131936] dark:text-white shadow-xs font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="Русский"
                  >
                    RU
                  </button>
                </div>

                {/* Dark Mode Toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={isDark ? t('navbar.light_mode') : t('navbar.dark_mode')}
                  className="p-2 rounded-lg text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#182348] border border-slate-200 dark:border-[#243365] transition-colors"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <div className="h-5 w-px bg-slate-200 dark:bg-[#1f2c58] mx-1"></div>

                {/* Admin Session Controls */}
                <button
                  onClick={onChangePasswordModal}
                  title={t('navbar.change_password')}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161f42] rounded-lg transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                <button
                  onClick={onLogout}
                  title={t('navbar.logout')}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('navbar.logout')}</span>
                </button>
              </>
            ) : (
              <>
                {/* Guest Navigation Views */}
                <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-[#0c1023] p-1 rounded-xl border border-slate-200 dark:border-[#243365]">
                  <button
                    onClick={() => setCurrentView('home')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      currentView === 'home' 
                        ? 'bg-[#131936] text-white shadow-xs dark:bg-[#25366f] dark:text-white font-semibold' 
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#161f42]'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>{t('navbar.home')}</span>
                  </button>

                  <button
                    onClick={() => setCurrentView('admin-login')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      currentView === 'admin-login'
                        ? 'bg-[#131936] text-white shadow-xs dark:bg-[#25366f] dark:text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#161f42]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('navbar.login_teacher')}</span>
                  </button>
                </div>

                <div className="h-5 w-px bg-slate-200 dark:bg-[#1f2c58] mx-1"></div>

                {/* Language Switcher (UZ / RU) */}
                <div className="flex items-center bg-slate-100 dark:bg-[#0c1023] p-0.5 rounded-lg border border-slate-200 dark:border-[#243365] text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setLang('uz')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      lang === 'uz'
                        ? 'bg-white dark:bg-[#25366f] text-[#131936] dark:text-white shadow-xs font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="O'zbekcha"
                  >
                    UZ
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('ru')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      lang === 'ru'
                        ? 'bg-white dark:bg-[#25366f] text-[#131936] dark:text-white shadow-xs font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="Русский"
                  >
                    RU
                  </button>
                </div>

                {/* Dark Mode Toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  title={isDark ? t('navbar.light_mode') : t('navbar.dark_mode')}
                  className="p-2 rounded-lg text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#182348] border border-slate-200 dark:border-[#243365] transition-colors"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>

          {/* MOBILE CONTROLS (< md) */}
          <div className="flex md:hidden items-center gap-1.5">
            {/* Language Switcher (UZ / RU) */}
            <div className="flex items-center bg-slate-100 dark:bg-[#0c1023] p-0.5 rounded-lg border border-slate-200 dark:border-[#243365] text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setLang('uz')}
                className={`px-1.5 py-1 rounded transition-all ${
                  lang === 'uz'
                    ? 'bg-white dark:bg-[#25366f] text-[#131936] dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                UZ
              </button>
              <button
                type="button"
                onClick={() => setLang('ru')}
                className={`px-1.5 py-1 rounded transition-all ${
                  lang === 'ru'
                    ? 'bg-white dark:bg-[#25366f] text-[#131936] dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                RU
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-[#182348] border border-slate-200 dark:border-[#243365] transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#131936] text-slate-800 dark:text-white border border-slate-200 dark:border-[#243365] hover:bg-slate-200 dark:hover:bg-[#1b254a] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DROPDOWN DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-[#1c2752] bg-white dark:bg-[#0e142c] px-4 py-3 shadow-xl space-y-2 animate-in slide-in-from-top-2 duration-150">
          {admin ? (
            <div className="space-y-1.5">
              <button
                onClick={() => handleNavClick('admin-dashboard')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  currentView === 'admin-dashboard'
                    ? 'bg-slate-100 dark:bg-[#182348] text-[#131936] dark:text-[#8fa7ff] font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#131b38]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[#131936] dark:text-[#8fa7ff]" />
                <span>{t('navbar.tests')}</span>
              </button>

              <button
                onClick={() => handleNavClick(onChangePasswordModal)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#131b38] transition-colors"
              >
                <KeyRound className="w-4 h-4 text-slate-500" />
                <span>{t('navbar.change_password')}</span>
              </button>

              <div className="pt-1 border-t border-slate-100 dark:border-[#1a244a]">
                <button
                  onClick={() => handleNavClick(onLogout)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('navbar.logout')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <button
                onClick={() => handleNavClick('home')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  currentView === 'home'
                    ? 'bg-[#131936] text-white dark:bg-[#25366f] dark:text-white font-semibold shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#131b38]'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{t('navbar.home')}</span>
              </button>

              <button
                onClick={() => handleNavClick('admin-login')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  currentView === 'admin-login'
                    ? 'bg-[#131936] text-white dark:bg-[#25366f] dark:text-white font-semibold shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#131b38]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t('navbar.login_teacher')}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
