import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, Info } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function AdminLogin({ onLoginSuccess, onGoHome }) {
  const { t } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(username, password);
      onLoginSuccess(data.admin);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-[#131936] rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/60 border border-slate-200 dark:border-[#243365] p-5 sm:p-7 transition-colors duration-200 my-auto">
        <div className="text-center mb-5">
          <div className="w-11 h-11 rounded-xl bg-[#131936]/10 dark:bg-[#0c1023] border border-[#131936]/20 dark:border-[#26376e] text-[#131936] dark:text-[#8fa7ff] flex items-center justify-center mx-auto mb-2.5 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('adminLogin.title')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('adminLogin.subtitle')}
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="mb-5 p-3 bg-[#131936]/5 dark:bg-[#0e142c] border border-[#131936]/15 dark:border-[#28386e] rounded-xl flex items-start gap-2.5 text-xs text-slate-800 dark:text-indigo-200">
          <Info className="w-4 h-4 text-[#131936] dark:text-[#8fa7ff] flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-slate-900 dark:text-white">{t('adminLogin.demo_info_title')}</span>
            <div className="font-mono mt-0.5 text-slate-700 dark:text-slate-300 truncate">
              login: <strong className="text-[#131936] dark:text-[#8fa7ff]">admin</strong> &nbsp;|&nbsp; parol: <strong className="text-[#131936] dark:text-[#8fa7ff]">admin123</strong>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('adminLogin.login_label')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('adminLogin.username_placeholder')}
                className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-slate-900 dark:text-white text-sm focus:bg-white dark:focus:bg-[#0f152d] focus:outline-none focus:ring-2 focus:ring-[#131936]/25 dark:focus:ring-[#3c55a6]/40 focus:border-[#131936] dark:focus:border-[#4d6ecf] placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('adminLogin.password_label')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('adminLogin.password_placeholder')}
                className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-slate-900 dark:text-white text-sm focus:bg-white dark:focus:bg-[#0f152d] focus:outline-none focus:ring-2 focus:ring-[#131936]/25 dark:focus:ring-[#3c55a6]/40 focus:border-[#131936] dark:focus:border-[#4d6ecf] placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 px-4 bg-[#131936] hover:bg-[#1e2a54] dark:bg-[#25366f] dark:hover:bg-[#2f438a] disabled:opacity-40 text-white font-semibold text-sm rounded-xl border border-[#131936] dark:border-[#3c55a6] shadow-sm shadow-[#131936]/20 dark:shadow-md flex items-center justify-center gap-2 transition-all mt-1"
          >
            <span>{loading ? t('adminLogin.loading_btn') : t('adminLogin.login_btn')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-[#1f2b56] text-center">
          <button
            onClick={onGoHome}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            {t('adminLogin.back_to_test')}
          </button>
        </div>
      </div>
    </div>
  );
}
