import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, BookOpen, Users, Clock, QrCode, 
  BarChart2, Edit3, Trash2, Power, Search, Award, Code 
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function AdminDashboard({ 
  onEditTest, 
  onViewResults, 
  onShareTest, 
  onOpenCreateTest,
  onOpenImportCode,
  onViewAttempt
}) {
  const { t } = useApp();
  const [stats, setStats] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, testsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminTests(),
      ]);
      setStats(statsData);
      setTests(testsData);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (testId, e) => {
    e.stopPropagation();
    try {
      const updated = await api.toggleTest(testId);
      setTests(prev => prev.map(t => t.id === testId ? { ...t, is_active: updated.is_active } : t));
    } catch (err) {
      alert(err.message || t('common.error'));
    }
  };

  const handleDelete = async (testId, title, e) => {
    e.stopPropagation();
    if (!window.confirm(t('adminDashboard.delete_confirm', { title }))) {
      return;
    }
    try {
      await api.deleteTest(testId);
      setTests(prev => prev.filter(t => t.id !== testId));
      loadData();
    } catch (err) {
      alert(err.message || t('common.error'));
    }
  };

  const filteredTests = tests.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.access_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#131936]/20 dark:border-[#24356e] border-t-[#131936] dark:border-t-[#526cd1] rounded-full animate-spin mb-3" />
        <p className="text-slate-500 dark:text-slate-300 text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Action Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5">
        <button
          onClick={onOpenImportCode}
          className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-[#131936] hover:bg-slate-50 dark:hover:bg-[#1b254a] text-[#131936] dark:text-[#8fa7ff] font-medium text-sm rounded-xl border border-slate-200 dark:border-[#243365] shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Code className="w-4 h-4" />
          <span>{t('adminDashboard.import_code_btn')}</span>
        </button>

        <button
          onClick={onOpenCreateTest}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#131936] hover:bg-[#1e2a54] dark:bg-[#25366f] dark:hover:bg-[#2f438a] text-white font-medium text-sm rounded-xl border border-[#131936] dark:border-[#3c55a6] shadow-sm shadow-[#131936]/20 dark:shadow-lg dark:shadow-black/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('adminDashboard.create_new_test')}</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#131936] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#243365] shadow-xs dark:shadow-xl flex items-center gap-3 sm:gap-4 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#131936]/10 dark:bg-[#0c1023] border border-[#131936]/20 dark:border-[#233162] text-[#131936] dark:text-[#8fa7ff] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('adminDashboard.stat_total_tests')}
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.totalTests}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#131936] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#243365] shadow-xs dark:shadow-xl flex items-center gap-3 sm:gap-4 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-700/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
              <Power className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('adminDashboard.stat_active_tests')}
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.activeTests}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#131936] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#243365] shadow-xs dark:shadow-xl flex items-center gap-3 sm:gap-4 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#131936]/10 dark:bg-[#0c1023] border border-[#131936]/20 dark:border-[#233162] text-[#131936] dark:text-[#8fa7ff] flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('adminDashboard.stat_total_attempts')}
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.totalAttempts}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#131936] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#243365] shadow-xs dark:shadow-xl flex items-center gap-3 sm:gap-4 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 dark:bg-[#0c1023] border border-amber-100 dark:border-[#233162] text-amber-600 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('adminDashboard.stat_average_score')}
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.averageScore}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Tests Section */}
      <div className="bg-white dark:bg-[#131936] rounded-2xl border border-slate-200 dark:border-[#243365] shadow-sm dark:shadow-2xl overflow-hidden transition-colors">
        {/* Table header & Search */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1f2b56] bg-slate-50 dark:bg-[#0e142c] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#131936] dark:text-[#8fa7ff]" />
            <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
              {t('adminDashboard.tests_list_title')} ({tests.length})
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('adminDashboard.search_placeholder')}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#131936]/25 dark:focus:ring-[#3c55a6]/40 focus:border-[#131936] dark:focus:border-[#4d6ecf] placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Tests list */}
        {filteredTests.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('adminDashboard.no_tests_found')}</p>
            <p className="text-xs text-slate-500 mt-1">{t('adminDashboard.no_tests_hint')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#1b254a]">
            {filteredTests.map((test) => (
              <div 
                key={test.id}
                className="p-4 sm:p-5 hover:bg-slate-50/80 dark:hover:bg-[#182348] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Test details */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      test.is_active 
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60' 
                        : 'bg-slate-100 dark:bg-[#0c1023] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#243365]'
                    }`}>
                      {test.is_active ? t('adminDashboard.status_active') : t('adminDashboard.status_stopped')}
                    </span>

                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0c1023] text-[#131936] dark:text-[#8fa7ff] border border-slate-200 dark:border-[#243365]">
                      {t('adminDashboard.code_prefix')} {test.access_code}
                    </span>

                    {test.time_limit_minutes > 0 ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{test.time_limit_minutes} {t('common.minutes')}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400">{t('adminDashboard.no_time_limit')}</span>
                    )}

                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      • {t('adminDashboard.passing_score_prefix')} {test.passing_score}%
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base truncate">
                    {test.title}
                  </h3>

                  {test.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {test.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span>{t('adminDashboard.questions_count')} <strong className="text-slate-800 dark:text-slate-200">{test.questions_count}</strong></span>
                    <span>{t('adminDashboard.attempts_count')} <strong className="text-slate-800 dark:text-slate-200">{test.attempts_count}</strong></span>
                    {test.avg_score !== null && (
                      <span>{t('adminDashboard.avg_score')} <strong className="text-[#131936] dark:text-[#8fa7ff]">{test.avg_score}%</strong></span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-[#1b254a]">
                  {/* Share button */}
                  <button
                    onClick={() => onShareTest(test)}
                    title={t('adminDashboard.btn_share')}
                    className="p-2 text-[#131936] dark:text-[#8fa7ff] hover:bg-[#131936]/10 dark:hover:bg-[#1a2652] rounded-xl border border-slate-200 dark:border-[#28386e] transition-colors flex items-center gap-1.5 text-xs font-medium"
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('adminDashboard.btn_share')}</span>
                  </button>

                  {/* Results button */}
                  <button
                    onClick={() => onViewResults(test.id)}
                    title={t('adminDashboard.btn_results')}
                    className="p-2 text-slate-700 dark:text-indigo-300 hover:bg-slate-100 dark:hover:bg-[#1a2652] rounded-xl border border-slate-200 dark:border-[#28386e] transition-colors flex items-center gap-1.5 text-xs font-medium"
                  >
                    <BarChart2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('adminDashboard.btn_results')} ({test.attempts_count})</span>
                  </button>

                  {/* Edit button */}
                  <button
                    onClick={() => onEditTest(test.id)}
                    title={t('adminDashboard.btn_edit')}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2652] hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-200 dark:border-[#28386e] transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Toggle status */}
                  <button
                    onClick={(e) => handleToggle(test.id, e)}
                    title={test.is_active ? t('adminDashboard.btn_stop') : t('adminDashboard.btn_start')}
                    className={`p-2 rounded-xl border transition-colors ${
                      test.is_active
                        ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-slate-200 dark:border-[#28386e]'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1a2652] border-slate-200 dark:border-[#28386e]'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(test.id, test.title, e)}
                    title={t('adminDashboard.btn_delete')}
                    className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-slate-200 dark:border-[#28386e] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
