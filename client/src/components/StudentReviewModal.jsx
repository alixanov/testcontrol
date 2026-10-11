import React from 'react';
import { X, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function StudentReviewModal({ attemptData, onClose }) {
  const { t } = useApp();
  if (!attemptData) return null;
  const { attempt, answers } = attemptData;

  const formatSeconds = (sec) => {
    if (!sec && sec !== 0) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m} ${t('common.minutes')} ${s} ${t('common.seconds')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#131936] rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-[#243365] overflow-hidden my-8 max-h-[90vh] flex flex-col text-slate-800 dark:text-white transition-colors">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#243365] bg-slate-50 dark:bg-[#0e142c] flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                attempt.passed 
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40' 
                  : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-500/40'
              }`}>
                {attempt.passed ? t('adminResults.status_passed') : t('adminResults.status_failed')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">ID: #{attempt.id}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{attempt.student_name}</span>
              {attempt.student_group && (
                <span className="text-sm font-normal text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-[#25366f] px-2 py-0.5 rounded">
                  {attempt.student_group}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Test: {attempt.test_title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#25366f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100/70 dark:bg-[#0a0f20] border-b border-slate-200 dark:border-[#243365] flex-shrink-0 text-center">
          <div className="bg-white dark:bg-[#131936] p-2.5 rounded-lg border border-slate-200 dark:border-[#243365]">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('takeTest.results_score')}</div>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{attempt.score} / {attempt.max_score} {t('common.points')}</div>
          </div>
          <div className="bg-white dark:bg-[#131936] p-2.5 rounded-lg border border-slate-200 dark:border-[#243365]">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('takeTest.results_percentage')}</div>
            <div className={`text-base sm:text-lg font-bold ${attempt.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {attempt.percentage}%
            </div>
          </div>
          <div className="bg-white dark:bg-[#131936] p-2.5 rounded-lg border border-slate-200 dark:border-[#243365]">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('takeTest.results_time_spent')}</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{formatSeconds(attempt.duration_seconds)}</div>
          </div>
          <div className="bg-white dark:bg-[#131936] p-2.5 rounded-lg border border-slate-200 dark:border-[#243365]">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('adminResults.table_date')}</div>
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1 truncate">{attempt.completed_at}</div>
          </div>
        </div>

        {/* Question Details List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#131936] dark:text-[#8fa7ff]" />
            <span>{t('modals.review_breakdown')} ({answers.length})</span>
          </h4>

          {answers.map((ans, idx) => (
            <div
              key={ans.id}
              className={`rounded-xl border p-4 sm:p-5 transition-all ${
                ans.is_correct 
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40' 
                  : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40'
              }`}
            >
              {/* Question header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-2.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-white ${
                    ans.is_correct ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">{ans.question_text}</h5>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {
                        ans.question_type === 'single' ? t('takeTest.single_choice') :
                        ans.question_type === 'multiple' ? t('takeTest.multi_choice') : t('takeTest.text_input')
                      }
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    ans.is_correct 
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' 
                      : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                  }`}>
                    {ans.is_correct ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>{ans.points_awarded} / {ans.max_question_points} {t('common.points')}</span>
                  </span>
                </div>
              </div>

              {/* Answers options rendering */}
              <div className="space-y-2 mt-4 pl-8">
                {ans.question_type === 'text' ? (
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="p-3 rounded-lg bg-white dark:bg-[#0c1023] border border-slate-200 dark:border-[#243365]">
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{t('modals.review_student_ans')}</div>
                      <div className={`font-mono font-medium ${ans.is_correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {ans.text_answer || '<bo\'sh>'}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300">{t('modals.review_correct_ans')} </span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-200">
                        {ans.options.map(o => o.option_text).join(' / ')}
                      </span>
                    </div>
                  </div>
                ) : (
                  ans.options.map((opt) => {
                    const isSelected = (ans.selected_option_ids || []).includes(opt.id);
                    const isCorrect = opt.is_correct;

                    let rowStyle = 'bg-white dark:bg-[#0c1023] border-slate-200 dark:border-[#243365] text-slate-700 dark:text-slate-300';
                    let badge = null;

                    if (isSelected && isCorrect) {
                      rowStyle = 'bg-emerald-100/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/70 text-emerald-900 dark:text-emerald-200 font-medium';
                      badge = <span className="text-xs px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold ml-auto">✓ To'g'ri tanlangan</span>;
                    } else if (isSelected && !isCorrect) {
                      rowStyle = 'bg-rose-100/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/70 text-rose-900 dark:text-rose-200 font-medium';
                      badge = <span className="text-xs px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-500/30 text-rose-800 dark:text-rose-300 font-bold ml-auto">✗ Xato</span>;
                    } else if (!isSelected && isCorrect) {
                      rowStyle = 'bg-emerald-50/50 dark:bg-[#0c1023] border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300';
                      badge = <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium ml-auto">To'g'ri javob</span>;
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-xs sm:text-sm transition-all ${rowStyle}`}
                      >
                        <div className={`w-4 h-4 rounded-${ans.question_type === 'single' ? 'full' : 'sm'} border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-[#131936] dark:bg-[#25366f] border-[#131936] dark:border-[#3c55a6] text-white' : 'border-slate-300 dark:border-[#243365] bg-white dark:bg-[#0c1023]'
                        }`}>
                          {isSelected && <span className="text-[10px]">✓</span>}
                        </div>
                        <span className="flex-1">{opt.option_text}</span>
                        {badge}
                      </div>
                    );
                  })
                )}

                {/* Explanation if present */}
                {ans.explanation && (
                  <div className="mt-3 p-3 rounded-lg bg-[#131936]/5 dark:bg-[#131936]/40 border border-[#131936]/20 dark:border-[#2b3d7a] text-xs text-slate-800 dark:text-[#8fa7ff]">
                    <span className="font-bold">{t('modals.review_explanation')} </span>
                    <span>{ans.explanation}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#243365] bg-slate-50 dark:bg-[#0e142c] flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#131936] hover:bg-[#1e2a54] dark:bg-[#25366f] dark:hover:bg-[#31478e] text-white text-xs sm:text-sm font-medium rounded-lg border border-[#131936] dark:border-[#3c55a6] transition-colors shadow-sm"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
