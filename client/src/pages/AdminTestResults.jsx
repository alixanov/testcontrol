import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Download, Search, Users, CheckCircle, XCircle, 
  Trash2, Eye, Award, Clock, Filter 
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function AdminTestResults({ testId, onBack, onViewAttempt }) {
  const { t } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  const loadResults = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getTestResults(testId, search, selectedGroup);
      setData(res);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [testId, selectedGroup]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadResults();
  };

  const handleDeleteAttempt = async (attemptId, studentName, e) => {
    e.stopPropagation();
    if (!window.confirm(t('adminResults.delete_confirm'))) return;
    try {
      await api.deleteAttempt(attemptId);
      loadResults();
    } catch (err) {
      alert(err.message || t('common.error'));
    }
  };

  const exportToCSV = () => {
    if (!data || !data.attempts || data.attempts.length === 0) {
      alert('Eksport qilish uchun ma\'lumotlar mavjud emas');
      return;
    }

    const headers = ['ID', 'F.I.O', 'Guruh/Sinf', 'Ball', 'Maks. ball', 'Foiz (%)', 'Holat', 'Sana', 'Davomiyligi (sek)'];
    const rows = data.attempts.map(a => [
      a.id,
      `"${(a.student_name || '').replace(/"/g, '""')}"`,
      `"${(a.student_group || '').replace(/"/g, '""')}"`,
      a.score,
      a.max_score,
      a.percentage,
      a.passed ? 'O\'tdi' : 'O\'tmadi',
      `"${a.completed_at}"`,
      a.duration_seconds || 0,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Natijalar_${data.test.access_code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-800 dark:text-slate-100">
        <div className="w-10 h-10 border-4 border-[#131936]/20 dark:border-[#24356e] border-t-[#131936] dark:border-t-[#526cd1] rounded-full animate-spin mb-3" />
        <p className="text-slate-500 dark:text-slate-300 text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-[#131936] rounded-2xl shadow-md border border-slate-200 dark:border-[#243365] text-center text-slate-800 dark:text-slate-100">
        <p className="text-rose-500 text-sm mb-4">{error || 'Xatolik'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#131936] hover:bg-[#1e2a54] dark:bg-[#25366f] dark:hover:bg-[#30458e] text-white rounded-xl text-sm border border-[#131936] dark:border-[#3b55a8]"
        >
          {t('adminResults.back_btn')}
        </button>
      </div>
    );
  }

  const { test, stats, questionStats, uniqueGroups, attempts } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1f2b56]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 border border-slate-300 dark:border-[#243365] bg-white dark:bg-[#0c1023] hover:bg-slate-100 dark:hover:bg-[#182348] rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('adminResults.header_title')}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate max-w-xl">
              {test.title}
            </h1>
          </div>
        </div>

        <button
          onClick={exportToCSV}
          disabled={attempts.length === 0}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold rounded-xl border border-emerald-500 shadow-sm flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>{t('adminResults.export_csv')}</span>
        </button>
      </div>

      {/* Summary KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#131936] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#243365] shadow-xs flex items-center gap-4 transition-colors">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#131936]/10 dark:bg-[#0c1023] border border-[#131936]/20 dark:border-[#233162] text-[#131936] dark:text-[#8fa7ff] flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
              {t('adminResults.stat_attempts')}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.totalAttempts}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131936] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#243365] shadow-xs flex items-center gap-4 transition-colors">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-700/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
              {t('adminResults.stat_passed')}
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.passedAttempts}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131936] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#243365] shadow-xs flex items-center gap-4 transition-colors">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-700/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
              {t('adminResults.stat_failed')}
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{stats.failedAttempts}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131936] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#243365] shadow-xs flex items-center gap-4 transition-colors">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 dark:bg-[#0c1023] border border-amber-100 dark:border-[#233162] text-amber-600 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
              {t('adminResults.stat_avg_score')}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.avgPercentage}%</div>
          </div>
        </div>
      </div>

      {/* Participants Table Section */}
      <div className="bg-white dark:bg-[#131936] rounded-2xl border border-slate-200 dark:border-[#243365] shadow-xs dark:shadow-xl overflow-hidden transition-colors">
        {/* Search & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#1f2b56] bg-slate-50 dark:bg-[#0e142c] flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('adminResults.search_student')}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#131936]/25 dark:focus:ring-[#3c55a6]/40 focus:border-[#131936] dark:focus:border-[#4d6ecf] placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </form>

          {uniqueGroups && uniqueGroups.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#131936] dark:focus:border-[#4d6ecf]"
              >
                <option value="">{t('adminResults.filter_group_all')}</option>
                {uniqueGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Table */}
        {attempts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('adminResults.no_attempts')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1f2b56] bg-slate-50/50 dark:bg-[#0c1023]/60 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-4">{t('adminResults.table_student')}</th>
                  <th className="py-3 px-4">{t('adminResults.table_group')}</th>
                  <th className="py-3 px-4">{t('adminResults.table_score')}</th>
                  <th className="py-3 px-4">{t('adminResults.table_percentage')}</th>
                  <th className="py-3 px-4">{t('adminResults.table_status')}</th>
                  <th className="py-3 px-4">{t('adminResults.table_date')}</th>
                  <th className="py-3 px-4">{t('adminResults.table_duration')}</th>
                  <th className="py-3 px-4 text-right">{t('adminResults.table_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#192348]">
                {attempts.map((att) => (
                  <tr 
                    key={att.id} 
                    className="hover:bg-slate-50 dark:hover:bg-[#151e3e] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {att.student_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {att.student_group || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {att.score} / {att.max_score}
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className={att.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {att.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        att.passed 
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60' 
                          : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-700/60'
                      }`}>
                        {att.passed ? t('adminResults.status_passed') : t('adminResults.status_failed')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {att.completed_at}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {Math.floor(att.duration_seconds / 60)} {t('common.minutes')} {att.duration_seconds % 60} {t('common.seconds')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewAttempt(att.id)}
                          title={t('adminResults.btn_view_attempt')}
                          className="p-1.5 text-[#131936] dark:text-[#8fa7ff] hover:bg-[#131936]/10 dark:hover:bg-[#1a2652] rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteAttempt(att.id, att.student_name, e)}
                          title={t('adminResults.btn_delete_attempt')}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
