import React, { useState } from 'react';
import { X, PlusCircle, Code } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function CreateTestModal({ onClose, onCreated, onOpenImportCode }) {
  const { t } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [timeLimit, setTimeLimit] = useState(15);
  const [passingScore, setPassingScore] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError('');

    try {
      const newTest = await api.createTest({
        title: title.trim(),
        description: description.trim(),
        access_code: accessCode.trim() || undefined,
        time_limit_minutes: Number(timeLimit) || 0,
        passing_score: Number(passingScore) || 60,
        is_active: 1,
        show_results: 1,
      });

      onCreated(newTest);
      onClose();
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#131936] rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-[#243365] overflow-hidden text-slate-800 dark:text-white transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#243365] flex items-center justify-between bg-slate-50 dark:bg-[#0e142c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#131936]/10 dark:bg-[#25366f] text-[#131936] dark:text-[#8fa7ff] flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">{t('modals.create_title')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#25366f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('modals.create_title_label')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('modals.create_title_placeholder')}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#131936]/25 dark:focus:ring-brand-500/30 focus:border-[#131936] dark:focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('modals.create_desc_label')}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('modals.create_desc_placeholder')}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#131936]/25 dark:focus:ring-brand-500/30 focus:border-[#131936] dark:focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t('modals.create_time_label')}
              </label>
              <input
                type="number"
                min="0"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#131936] dark:focus:border-brand-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">{t('modals.create_time_hint')}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t('modals.create_score_label')}
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#131936] dark:focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('modals.create_code_label')}
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder={t('modals.create_code_placeholder')}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#131936] dark:focus:border-brand-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            {onOpenImportCode ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenImportCode();
                }}
                className="text-xs font-medium text-[#131936] dark:text-[#8fa7ff] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{t('adminDashboard.import_code_btn')}</span>
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 dark:border-[#243365] bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2349] dark:hover:bg-[#25366f] text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="px-5 py-2 bg-[#131936] hover:bg-[#1e2a54] dark:bg-[#25366f] dark:hover:bg-[#2f438a] disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md border border-[#131936] dark:border-[#3c55a6] transition-all cursor-pointer"
              >
                {loading ? t('common.loading') : t('modals.create_submit_btn')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
