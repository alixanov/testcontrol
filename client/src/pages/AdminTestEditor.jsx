import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Save, Plus, Trash2, GripVertical, CheckCircle2, 
  Settings, HelpCircle, AlertCircle, Clock, ShieldCheck, ChevronUp, ChevronDown, Code 
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import ImportCodeModal from '../components/ImportCodeModal';

export default function AdminTestEditor({ testId, onBack, onShare }) {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'settings'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Test settings state
  const [settings, setSettings] = useState({
    title: '',
    description: '',
    access_code: '',
    time_limit_minutes: 0,
    passing_score: 60,
    shuffle_questions: 0,
    shuffle_options: 0,
    show_results: 1,
    is_active: 1,
  });

  // Questions state
  const [questions, setQuestions] = useState([]);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const handleQuestionsImported = async (result) => {
    try {
      const data = await api.getAdminTest(testId);
      setQuestions(data.questions || []);
      setSuccessMsg(t('modals.import_code_success_imported', { 
        count: result.importedCount || result.questionsCount || (data.questions ? data.questions.length : '') 
      }));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!testId) {
      setLoading(false);
      return;
    }
    async function loadTest() {
      setLoading(true);
      setError('');
      try {
        const data = await api.getAdminTest(testId);
        setSettings(data.test);
        setQuestions(data.questions || []);
      } catch (err) {
        setError(err.message || t('common.error'));
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [testId]);

  // Question manipulation helpers
  const addQuestion = (type = 'single') => {
    const newQ = {
      id: Date.now(),
      question_text: '',
      question_type: type,
      points: 1,
      explanation: '',
      options: type === 'text' 
        ? [{ id: Date.now() + 1, option_text: '', is_correct: true }]
        : [
            { id: Date.now() + 1, option_text: 'Variant 1', is_correct: true },
            { id: Date.now() + 2, option_text: 'Variant 2', is_correct: false },
          ],
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const moveQuestion = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setQuestions(updated);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addOption = (questionIndex) => {
    const updated = [...questions];
    const q = updated[questionIndex];
    q.options = [
      ...q.options,
      {
        id: Date.now(),
        option_text: `Variant ${q.options.length + 1}`,
        is_correct: false,
      },
    ];
    setQuestions(updated);
  };

  const removeOption = (questionIndex, optIndex) => {
    const updated = [...questions];
    updated[questionIndex].options = updated[questionIndex].options.filter((_, i) => i !== optIndex);
    setQuestions(updated);
  };

  const updateOptionText = (questionIndex, optIndex, text) => {
    const updated = [...questions];
    updated[questionIndex].options[optIndex].option_text = text;
    setQuestions(updated);
  };

  const toggleOptionCorrect = (questionIndex, optIndex) => {
    const updated = [...questions];
    const q = updated[questionIndex];
    if (q.question_type === 'single') {
      q.options.forEach((opt, idx) => {
        opt.is_correct = idx === optIndex;
      });
    } else {
      q.options[optIndex].is_correct = !q.options[optIndex].is_correct;
    }
    setQuestions(updated);
  };

  // Save changes
  const handleSaveAll = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.updateTest(testId, settings);
      await api.saveQuestions(testId, questions);
      setSuccessMsg(t('adminEditor.saved_success'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-800 dark:text-slate-100">
        <div className="w-10 h-10 border-4 border-[#131936]/20 dark:border-[#24356e] border-t-[#131936] dark:border-t-[#526cd1] rounded-full animate-spin mb-3" />
        <p className="text-slate-500 dark:text-slate-300 text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1f2b56]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 border border-slate-300 dark:border-[#243365] bg-white dark:bg-[#0c1023] hover:bg-slate-100 dark:hover:bg-[#182348] rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('adminEditor.test_editor_title')} #{testId}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate max-w-lg">
              {settings.title || 'Test'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onShare(settings)}
            className="px-3.5 py-2 border border-slate-300 dark:border-[#28386e] text-[#131936] dark:text-[#8fa7ff] hover:bg-[#131936]/10 dark:hover:bg-[#182348] text-xs sm:text-sm font-medium rounded-xl transition-colors"
          >
            {t('adminDashboard.btn_share')}
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2 bg-[#131936] hover:bg-[#1e2a54] dark:bg-[#25366f] dark:hover:bg-[#2f438a] disabled:opacity-40 text-white text-xs sm:text-sm font-semibold rounded-xl border border-[#131936] dark:border-[#3c55a6] shadow-sm shadow-[#131936]/20 dark:shadow-md dark:shadow-black/40 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('adminEditor.saving_btn') : t('adminEditor.save_all_btn')}</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-[#1f2b56] gap-4">
        <button
          onClick={() => setActiveTab('questions')}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'questions'
              ? 'border-[#131936] dark:border-[#526cd1] text-[#131936] dark:text-[#8fa7ff]'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{t('adminEditor.tab_questions')} ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-[#131936] dark:border-[#526cd1] text-[#131936] dark:text-[#8fa7ff]'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{t('adminEditor.tab_settings')}</span>
        </button>
      </div>

      {/* TAB 1: QUESTIONS BUILDER */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Add Question Toolbar */}
          <div className="p-3 sm:p-4 bg-white dark:bg-[#131936] border border-slate-200 dark:border-[#243365] rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shadow-xs dark:shadow-xl transition-colors">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 hidden sm:inline">
              {t('adminEditor.add_q_single')}:
            </span>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => addQuestion('single')}
                className="px-2.5 sm:px-3 py-2 sm:py-1.5 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#28386e] hover:bg-slate-100 dark:hover:bg-[#182348] text-slate-800 dark:text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#131936] dark:text-[#8fa7ff]" />
                <span className="truncate">{t('adminEditor.add_q_single')}</span>
              </button>
              <button
                type="button"
                onClick={() => addQuestion('multiple')}
                className="px-2.5 sm:px-3 py-2 sm:py-1.5 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#28386e] hover:bg-slate-100 dark:hover:bg-[#182348] text-slate-800 dark:text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#131936] dark:text-[#8fa7ff]" />
                <span className="truncate">{t('adminEditor.add_q_multi')}</span>
              </button>
              <button
                type="button"
                onClick={() => addQuestion('text')}
                className="px-2.5 sm:px-3 py-2 sm:py-1.5 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#28386e] hover:bg-slate-100 dark:hover:bg-[#182348] text-slate-800 dark:text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#131936] dark:text-[#8fa7ff]" />
                <span className="truncate">{t('adminEditor.add_q_text')}</span>
              </button>
              <button
                type="button"
                onClick={() => setImportModalOpen(true)}
                className="px-2.5 sm:px-3 py-2 sm:py-1.5 bg-[#131936] hover:bg-[#1e2a54] dark:bg-[#25366f] dark:hover:bg-[#2f438a] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" />
                <span className="truncate">{t('adminEditor.import_code_questions_btn')}</span>
              </button>
            </div>
          </div>

          {/* Question Cards List */}
          {questions.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#131936] rounded-2xl border border-slate-200 dark:border-[#243365] text-slate-500 dark:text-slate-400 transition-colors">
              <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-40 text-[#131936] dark:text-[#8fa7ff]" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('adminEditor.no_questions')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('adminEditor.no_questions_hint')}</p>
            </div>
          ) : (
            questions.map((q, qIdx) => (
              <div
                key={q.id || qIdx}
                className="bg-white dark:bg-[#131936] rounded-2xl border border-slate-200 dark:border-[#243365] p-5 sm:p-6 space-y-4 shadow-xs dark:shadow-xl transition-colors"
              >
                {/* Question Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#1f2b56]">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#131936]/10 dark:bg-[#0c1023] border border-[#131936]/20 dark:border-[#26376e] text-[#131936] dark:text-[#8fa7ff] text-xs font-bold flex items-center justify-center">
                      {qIdx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0c1023] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#243365]">
                      {q.question_type === 'single' ? t('adminEditor.q_type_single') :
                       q.question_type === 'multiple' ? t('adminEditor.q_type_multi') : t('adminEditor.q_type_text')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Points control */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <span>{t('adminEditor.points_label')}</span>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={q.points || 1}
                        onChange={(e) => updateQuestion(qIdx, 'points', Number(e.target.value))}
                        className="w-14 px-2 py-1 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-md text-center text-xs font-bold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="h-4 w-px bg-slate-200 dark:bg-[#1f2b56] mx-1"></div>

                    {/* Move Up/Down */}
                    <button
                      onClick={() => moveQuestion(qIdx, -1)}
                      disabled={qIdx === 0}
                      title={t('adminEditor.move_up')}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveQuestion(qIdx, 1)}
                      disabled={qIdx === questions.length - 1}
                      title={t('adminEditor.move_down')}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {/* Delete Question */}
                    <button
                      onClick={() => removeQuestion(qIdx)}
                      title={t('adminEditor.delete_q_btn')}
                      className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <textarea
                    rows={2}
                    value={q.question_text}
                    onChange={(e) => updateQuestion(qIdx, 'question_text', e.target.value)}
                    placeholder={t('adminEditor.q_text_placeholder')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f152d] focus:outline-none focus:ring-2 focus:ring-[#131936]/25 dark:focus:ring-[#3c55a6]/40 focus:border-[#131936] dark:focus:border-[#4d6ecf]"
                  />
                </div>

                {/* Question Options */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {q.question_type === 'text' 
                        ? 'To\'g\'ri javob matni:' 
                        : 'Javob variantlari (to\'g\'risini belgilang):'}
                    </label>
                    {q.question_type !== 'text' && (
                      <button
                        type="button"
                        onClick={() => addOption(qIdx)}
                        className="text-xs text-[#131936] dark:text-[#8fa7ff] hover:underline font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t('adminEditor.add_option_btn')}</span>
                      </button>
                    )}
                  </div>

                  {q.question_type === 'text' ? (
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={opt.id || optIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt.option_text}
                            onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                            placeholder={t('adminEditor.correct_answer_text_placeholder')}
                            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f152d]"
                          />
                          {q.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIdx, optIdx)}
                              className="p-2 text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(qIdx)}
                        className="text-xs text-[#131936] dark:text-[#8fa7ff] font-medium hover:underline inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Yana bir to'g'ri yozilish variantini qo'shish</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={opt.id || optIdx} className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleOptionCorrect(qIdx, optIdx)}
                            className={`w-6 h-6 rounded-${q.question_type === 'single' ? 'full' : 'md'} border flex items-center justify-center flex-shrink-0 transition-colors ${
                              opt.is_correct 
                                ? 'bg-emerald-600 border-emerald-500 text-white' 
                                : 'border-slate-300 dark:border-[#243365] bg-slate-50 dark:bg-[#0c1023] text-transparent hover:border-slate-400'
                            }`}
                            title="To'g'ri deb belgilash"
                          >
                            {opt.is_correct && <span className="text-xs font-bold leading-none">✓</span>}
                          </button>

                          <input
                            type="text"
                            value={opt.option_text}
                            onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                            placeholder={t('adminEditor.option_placeholder')}
                            className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${
                              opt.is_correct 
                                ? 'border-emerald-400 dark:border-emerald-600/70 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-medium' 
                                : 'border-slate-300 dark:border-[#243365] bg-white dark:bg-[#0c1023] text-slate-900 dark:text-white'
                            }`}
                          />

                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(qIdx, optIdx)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Explanation */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {t('adminEditor.explanation_placeholder')}
                  </label>
                  <input
                    type="text"
                    value={q.explanation || ''}
                    onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                    placeholder={t('adminEditor.explanation_placeholder')}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-lg text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-[#131936] rounded-2xl border border-slate-200 dark:border-[#243365] p-6 sm:p-8 space-y-6 shadow-xs dark:shadow-xl transition-colors">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                {t('adminEditor.field_title')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f152d] focus:border-indigo-600 dark:focus:border-[#4d6ecf]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                {t('adminEditor.field_desc')}
              </label>
              <textarea
                rows={3}
                value={settings.description || ''}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f152d] focus:border-indigo-600 dark:focus:border-[#4d6ecf]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {t('adminEditor.field_code')}
                </label>
                <input
                  type="text"
                  value={settings.access_code}
                  onChange={(e) => setSettings({ ...settings, access_code: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl font-mono text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f152d]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {t('adminEditor.field_time')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.time_limit_minutes}
                  onChange={(e) => setSettings({ ...settings, time_limit_minutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f152d]"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">{t('adminEditor.field_time_hint')}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {t('adminEditor.field_score')}
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.passing_score}
                  onChange={(e) => setSettings({ ...settings, passing_score: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#0f152d]"
                />
              </div>
            </div>

            {/* Checkbox toggles */}
            <div className="pt-4 space-y-3 border-t border-slate-200 dark:border-[#1f2b56]">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settings.is_active)}
                  onChange={(e) => setSettings({ ...settings, is_active: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 rounded text-[#131936] focus:ring-[#131936]"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{t('adminEditor.switch_active')}</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settings.show_results)}
                  onChange={(e) => setSettings({ ...settings, show_results: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 rounded text-[#131936] focus:ring-[#131936]"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{t('adminEditor.switch_show_results')}</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settings.shuffle_questions)}
                  onChange={(e) => setSettings({ ...settings, shuffle_questions: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 rounded text-[#131936] focus:ring-[#131936]"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{t('adminEditor.switch_shuffle_q')}</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settings.shuffle_options)}
                  onChange={(e) => setSettings({ ...settings, shuffle_options: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 rounded text-[#131936] focus:ring-[#131936]"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{t('adminEditor.switch_shuffle_opt')}</span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Import Code Modal */}
      {importModalOpen && (
        <ImportCodeModal
          mode="editor"
          testId={testId}
          onClose={() => setImportModalOpen(false)}
          onSuccess={handleQuestionsImported}
        />
      )}
    </div>
  );
}
