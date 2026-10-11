import React, { useState } from 'react';
import { 
  X, Code, Play, CheckCircle2, AlertCircle, 
  HelpCircle, Sparkles, ChevronDown, ChevronUp, Check
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const SAMPLE_QUIZ_CODE = `function createComputerGraphicsQuiz() {
  // 1. Yangi Google Form yaratish va uni Test (Quiz) rejimiga o'tkazish
  var form = FormApp.create("Kompyuter grafikasi bo'yicha 50 ta test");
  form.setDescription("Kompyuter grafikasi asoslari fanidan yakuniy test savollari");
  form.setIsQuiz(true); // To'g'ri javoblarni avtomatik tekshirish uchun

  // 2. Savollar ro'yxati (savol, variantlar, to'g'ri javob indeksi: 0=A, 1=B, 2=C, 3=D)
  var questions = [
    {
      q: "1. Rastrli grafikaning eng kichik elementi nima deb ataladi?",
      options: ["Vektor", "Piksel", "Nuqta", "Segment"],
      correct: 1 // B
    },
    {
      q: "2. Vektorli grafika qaysi matematik tushunchaga asoslangan?",
      options: ["Piksellar to'plamiga", "Formula va geometrik ob'ektlarga", "Rastrli matritsaga", "Rangli nuqtalarga"],
      correct: 1 // B
    },
    {
      q: "3. RGB rang modeli asosan qayerda qo'llaniladi?",
      options: ["Matbaada", "Monitor va ekranlarda", "Rasm chizishda", "Lazerli printerlarda"],
      correct: 1 // B
    },
    {
      q: "4. CMYK rang modelidagi 'K' harfi qaysi rangni bildiradi?",
      options: ["Ko'k", "Qora (Key color)", "Qizil", "Kulrang"],
      correct: 1 // B
    },
    {
      q: "5. Vektorli tasvirlarni tahrirlash uchun eng mashhur dastur qaysi?",
      options: ["Adobe Photoshop", "Adobe Illustrator", "Paint", "MS Word"],
      correct: 1 // B
    }
  ];

  for (var i = 0; i < questions.length; i++) {
    var item = form.addMultipleChoiceItem();
    item.setTitle(questions[i].q);
    var choices = [];
    for (var j = 0; j < questions[i].options.length; j++) {
      choices.push(item.createChoice(questions[i].options[j], j === questions[i].correct));
    }
    item.setChoices(choices);
    item.setPoints(1);
  }
}`;

export default function ImportCodeModal({ 
  mode = 'create', // 'create' | 'editor'
  testId = null,
  onClose, 
  onSuccess 
}) {
  const { t } = useApp();
  const [code, setCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Parsed result
  const [parsed, setParsed] = useState(null);
  
  // Metadata fields for create mode
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [timeLimit, setTimeLimit] = useState(15);
  const [passingScore, setPassingScore] = useState(60);

  // Settings for editor mode
  const [replaceExisting, setReplaceExisting] = useState(false);

  // Preview collapse state
  const [showPreviewQuestions, setShowPreviewQuestions] = useState(true);

  const handleLoadSample = () => {
    setCode(SAMPLE_QUIZ_CODE);
    setError('');
  };

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError(t('modals.import_code_error_no_questions'));
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const res = await api.parseQuizCode(code);
      if (!res.questions || res.questions.length === 0) {
        throw new Error(t('modals.import_code_error_no_questions'));
      }
      setParsed(res);
      setTitle(res.title || 'Yangi test');
      setDescription(res.description || '');
    } catch (err) {
      setError(err.message || t('common.error'));
      setParsed(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parsed || parsed.questions.length === 0) {
      setError(t('modals.import_code_error_no_questions'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (mode === 'create') {
        const payload = {
          code,
          title: title.trim() || parsed.title || 'Yangi test',
          description: description.trim() || parsed.description || '',
          access_code: accessCode.trim() || undefined,
          time_limit_minutes: Number(timeLimit) || 0,
          passing_score: Number(passingScore) || 60,
          questions: parsed.questions,
        };
        const res = await api.importTestFromCode(payload);
        const testObj = res?.test || res;
        if (onSuccess) onSuccess(testObj);
        onClose();
      } else {
        // Mode editor (appending or replacing questions)
        const payload = {
          code,
          questions: parsed.questions,
          replace: replaceExisting,
        };
        const result = await api.importQuestionsFromCode(testId, payload);
        if (onSuccess) onSuccess(result);
        onClose();
      }
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#131936] rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-[#243365] overflow-hidden text-slate-800 dark:text-white transition-colors my-auto max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-[#243365] flex items-center justify-between bg-slate-50 dark:bg-[#0e142c] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#131936] text-white dark:bg-[#25366f] dark:text-[#8fa7ff] flex items-center justify-center shadow-xs flex-shrink-0">
              <Code className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                {mode === 'create' ? t('modals.import_code_title') : t('modals.import_code_editor_title')}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {t('modals.import_code_desc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#25366f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Bar for Code Input */}
          <div className="flex items-center justify-between gap-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              JavaScript / Google Apps Script kodi
            </label>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs font-medium text-[#131936] dark:text-[#8fa7ff] hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('modals.import_code_sample_btn')}</span>
            </button>
          </div>

          {/* Monospace Code Editor */}
          <div className="relative">
            <textarea
              rows={8}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (parsed) setParsed(null);
              }}
              placeholder={t('modals.import_code_placeholder')}
              className="w-full px-3.5 py-3 font-mono text-xs leading-relaxed bg-slate-900 text-slate-100 border border-slate-700 dark:border-[#243365] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#131936] dark:focus:ring-[#526cd1]"
              spellCheck="false"
            />
          </div>

          {/* Parse / Analyze Button */}
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !code.trim()}
              className="px-4 py-2 bg-[#131936] hover:bg-[#1e2a54] dark:bg-[#25366f] dark:hover:bg-[#2f438a] disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isAnalyzing ? t('modals.import_code_analyzing') : t('modals.import_code_analyze_btn')}</span>
            </button>
          </div>

          {/* PARSED PREVIEW SECTION */}
          {parsed && (
            <div className="mt-4 p-4 rounded-xl border border-emerald-200 dark:border-[#2e407d] bg-emerald-50/50 dark:bg-[#0c1023] space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('modals.import_code_preview_title')}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  {t('modals.import_code_questions_count')} {parsed.questions.length}
                </span>
              </div>

              {/* Editable Test Metadata (if create mode) */}
              {mode === 'create' ? (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-[#1d2952]">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t('modals.import_code_detected_title')}
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#131936] border border-slate-300 dark:border-[#243365] rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#131936] dark:focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {t('modals.import_code_detected_desc')}
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Qisqacha tavsif..."
                      className="w-full px-3 py-2 bg-white dark:bg-[#131936] border border-slate-300 dark:border-[#243365] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#131936] dark:focus:border-brand-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t('modals.import_code_time_label')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#131936] border border-slate-300 dark:border-[#243365] rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t('modals.import_code_score_label')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={passingScore}
                        onChange={(e) => setPassingScore(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#131936] border border-slate-300 dark:border-[#243365] rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {t('modals.import_code_code_label')}
                      </label>
                      <input
                        type="text"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        placeholder="masalan: comp-graph-50"
                        className="w-full px-3 py-1.5 bg-white dark:bg-[#131936] border border-slate-300 dark:border-[#243365] rounded-xl text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Editor Mode Replace / Append selector */
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#1d2952]">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Import usuli:
                  </label>
                  <div className="flex gap-4 text-xs font-medium">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importMode"
                        checked={!replaceExisting}
                        onChange={() => setReplaceExisting(false)}
                        className="text-[#131936] focus:ring-[#131936]"
                      />
                      <span>{t('modals.import_code_mode_append')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-rose-600 dark:text-rose-400">
                      <input
                        type="radio"
                        name="importMode"
                        checked={replaceExisting}
                        onChange={() => setReplaceExisting(true)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>{t('modals.import_code_mode_replace')}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Questions Preview List */}
              <div className="pt-2 border-t border-slate-200 dark:border-[#1d2952]">
                <button
                  type="button"
                  onClick={() => setShowPreviewQuestions(!showPreviewQuestions)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <span>Savollar ko'rinishi ({parsed.questions.length} ta)</span>
                  {showPreviewQuestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showPreviewQuestions && (
                  <div className="mt-2 max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-[#1d2952]">
                    {parsed.questions.map((q, idx) => (
                      <div key={idx} className="pt-2 first:pt-0 text-xs">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {q.question_text || `Savol #${idx + 1}`}
                        </div>
                        <div className="mt-1 space-y-1 pl-2">
                          {q.options?.map((opt, oIdx) => (
                            <div 
                              key={oIdx} 
                              className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${
                                opt.is_correct 
                                  ? 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium' 
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <span className="w-4 text-slate-400 text-[10px]">
                                {String.fromCharCode(65 + oIdx)}.
                              </span>
                              <span>{opt.option_text}</span>
                              {opt.is_correct && (
                                <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                                  <Check className="w-3 h-3" />
                                  {t('modals.import_code_option_correct')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-[#243365] bg-slate-50 dark:bg-[#0e142c] flex items-center justify-end gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-[#28386e] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1f2b56] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {t('common.cancel')}
          </button>

          {parsed && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !parsed || parsed.questions.length === 0}
              className="px-5 py-2 bg-[#131936] hover:bg-[#1e2a54] dark:bg-[#25366f] dark:hover:bg-[#2f438a] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {mode === 'create'
                  ? t('modals.import_code_submit_create', { count: parsed.questions.length })
                  : t('modals.import_code_submit_append', { count: parsed.questions.length })
                }
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
