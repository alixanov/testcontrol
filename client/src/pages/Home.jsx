import React, { useState } from 'react';
import { ArrowRight, Sparkles, CheckCircle2, Clock, Zap, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Home({ onStartTestByCode, onGoAdminLogin }) {
  const { t } = useApp();
  const [code, setCode] = useState('');

  const handleStart = (e) => {
    e.preventDefault();
    if (code.trim()) {
      onStartTestByCode(code.trim().toLowerCase());
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 md:py-14 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Dense 2-column layout on PC / tablet landscape, compact stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
        
        {/* Left column: Hero presentation & dense feature pills */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-center lg:text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131936]/10 dark:bg-[#131936] border border-[#131936]/20 dark:border-[#2b3e7a] text-[#131936] dark:text-[#8fa7ff] text-xs font-semibold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('home.badge')}</span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight sm:leading-[1.15]">
            {t('home.hero_title')}
            <span className="text-[#131936] dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#8fa7ff] dark:via-[#b6c7ff] dark:to-white">
              {t('home.hero_title_highlight')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            {t('home.hero_desc')}
          </p>

          {/* Tight professional feature indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1 sm:pt-3 text-left">
            <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#131936] border border-slate-200 dark:border-[#243365] shadow-xs flex items-center sm:flex-col sm:items-start gap-2.5 transition-all hover:border-slate-300 dark:hover:border-[#384e96]">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white">{t('home.feat_instant_title')}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {t('home.feat_instant_desc')}
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#131936] border border-slate-200 dark:border-[#243365] shadow-xs flex items-center sm:flex-col sm:items-start gap-2.5 transition-all hover:border-slate-300 dark:hover:border-[#384e96]">
              <div className="w-8 h-8 rounded-lg bg-[#131936]/10 dark:bg-[#25366f]/40 text-[#131936] dark:text-[#8fa7ff] flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white">{t('home.feat_timer_title')}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {t('home.feat_timer_desc')}
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-[#131936] border border-slate-200 dark:border-[#243365] shadow-xs flex items-center sm:flex-col sm:items-start gap-2.5 transition-all hover:border-slate-300 dark:hover:border-[#384e96]">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white">{t('home.feat_responsive_title')}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {t('home.feat_responsive_desc')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Enter code card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
          <div className="bg-white dark:bg-[#131936] rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/60 border border-slate-200 dark:border-[#243365] p-5 sm:p-7 transition-colors duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-[#1e2a52]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#131936] dark:text-[#8fa7ff] bg-[#131936]/10 dark:bg-[#0c1023] px-2 py-0.5 rounded border border-[#131936]/20 dark:border-[#26376e]">
                  {t('home.student_entry_badge')}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {t('home.enter_code_title')}
                </h2>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#131936]/10 dark:bg-[#25366f] text-[#131936] dark:text-[#8fa7ff] flex items-center justify-center border border-[#131936]/20 dark:border-[#3c55a6]">
                <Zap className="w-4 h-4" />
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              {t('home.enter_code_desc')}
            </p>

            <form onSubmit={handleStart} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {t('home.code_label')}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t('home.code_placeholder')}
                  autoComplete="off"
                  className="w-full h-12 px-4 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#26376e] rounded-xl text-center text-base sm:text-lg font-mono font-bold tracking-wider uppercase text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f152d] focus:outline-none focus:ring-2 focus:ring-[#131936]/25 dark:focus:ring-[#3b55a8]/50 focus:border-[#131936] dark:focus:border-[#4d6ecf] transition-all placeholder:font-sans placeholder:font-normal placeholder:text-xs sm:placeholder:text-sm placeholder:tracking-normal placeholder:normal-case placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={!code.trim()}
                className="w-full h-12 px-4 bg-[#131936] hover:bg-[#1e2a54] dark:bg-[#25366f] dark:hover:bg-[#2f438a] disabled:opacity-40 text-white font-semibold text-sm sm:text-base rounded-xl border border-[#131936] dark:border-[#3c55a6] shadow-md shadow-[#131936]/20 dark:shadow-lg dark:shadow-black/40 flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-[0.99]"
              >
                <span>{t('home.enter_test_btn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Test Link */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1e2a52] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">{t('home.demo_label')}</span>
              <button
                type="button"
                onClick={() => onStartTestByCode('demo-test')}
                className="font-bold text-[#131936] dark:text-[#8fa7ff] hover:text-[#25366f] dark:hover:text-[#b3c4ff] underline underline-offset-2 transition-colors flex items-center gap-1"
              >
                <span>{t('home.demo_btn')}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Teacher login link */}
            {onGoAdminLogin && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-[#1a2446] text-center">
                <button
                  type="button"
                  onClick={onGoAdminLogin}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#131936] dark:text-[#8fa7ff]" />
                  <span>{t('home.teacher_link')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
