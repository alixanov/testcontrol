import React, { useState } from 'react';
import { X, KeyRound } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function ChangePasswordModal({ onClose, onSuccess }) {
  const { t } = useApp();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Yangi parol va tasdiqlash mos kelmadi');
      return;
    }

    if (newPassword.length < 5) {
      setError('Parol kamida 5 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      onSuccess('Parol muvaffaqiyatli o\'zgartirildi!');
      onClose();
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#131936] rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#243365] overflow-hidden text-slate-800 dark:text-white transition-colors">
        <div className="p-5 border-b border-slate-100 dark:border-[#243365] flex items-center justify-between bg-slate-50 dark:bg-[#0e142c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#131936]/10 dark:bg-[#25366f] text-[#131936] dark:text-[#8fa7ff] flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">{t('modals.password_title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#25366f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('modals.old_password_label')}
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#131936] dark:focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('modals.new_password_label')}
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 5 ta belgi"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#131936] dark:focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('modals.confirm_password_label')}
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#131936] dark:focus:border-brand-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-[#243365] bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2349] dark:hover:bg-[#25366f] text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#131936] hover:bg-[#1e2a54] dark:bg-[#25366f] dark:hover:bg-[#2f438a] disabled:opacity-50 text-white text-sm font-medium rounded-lg border border-[#131936] dark:border-[#3c55a6] transition-colors shadow-sm"
            >
              {loading ? t('common.loading') : t('modals.password_submit_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
