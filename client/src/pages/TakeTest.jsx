import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Clock, AlertCircle, CheckCircle, XCircle, ChevronLeft, ChevronRight, 
  Send, User, Award, HelpCircle, ArrowLeft, RefreshCw, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export default function TakeTest({ testCode, onGoHome }) {
  const { t } = useApp();

  // Test loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testData, setTestData] = useState(null);

  // Student registration phase
  const [studentName, setStudentName] = useState('');
  const [studentGroup, setStudentGroup] = useState('');
  const [isStarted, setIsStarted] = useState(false);

  // Active testing state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: value }
  const [confirmedQuestions, setConfirmedQuestions] = useState({}); // { [questionId]: boolean }
  const [timeLeft, setTimeLeft] = useState(null); // in seconds
  const [startedAt, setStartedAt] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Results phase
  const [result, setResult] = useState(null);

  // Load test data
  useEffect(() => {
    async function fetchTest() {
      setLoading(true);
      setError('');
      try {
        const data = await api.getPublicTest(testCode);
        setTestData(data);
        if (data.test.time_limit_minutes > 0) {
          setTimeLeft(data.test.time_limit_minutes * 60);
        }
      } catch (err) {
        setError(err.message || t('takeTest.test_not_found'));
      } finally {
        setLoading(false);
      }
    }
    fetchTest();
  }, [testCode]);

  // Timer countdown
  useEffect(() => {
    if (!isStarted || result || timeLeft === null) return;

    if (timeLeft <= 0) {
      handleSubmitTest(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, timeLeft, result]);

  // Prevent accidental tab close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isStarted && !result) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isStarted, result]);

  // Start test
  const handleStart = (e) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    setIsStarted(true);
    setStartedAt(new Date().toISOString());
  };

  // Submit test
  const handleSubmitTest = async (isAutoSubmit = false) => {
    if (isSubmitting || result) return;
    setIsSubmitting(true);
    setConfirmSubmitOpen(false);

    try {
      const submissionData = {
        student_name: studentName.trim(),
        student_group: studentGroup.trim(),
        started_at: startedAt || new Date().toISOString(),
        answers: Object.entries(answers).map(([questionId, ansVal]) => {
          if (Array.isArray(ansVal)) {
            return {
              question_id: Number(questionId),
              selected_option_ids: ansVal,
            };
          } else if (typeof ansVal === 'number') {
            return {
              question_id: Number(questionId),
              selected_option_ids: [ansVal],
            };
          } else {
            return {
              question_id: Number(questionId),
              text_answer: String(ansVal || ''),
            };
          }
        }),
      };

      const res = await api.submitTest(testCode, submissionData);
      setResult(res);

      if (res.passed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      alert(err.message || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Answer selections
  const handleSelectOption = (questionId, optionId, type) => {
    if (type === 'single') {
      setAnswers(prev => ({
        ...prev,
        [questionId]: optionId,
      }));
      setConfirmedQuestions(prev => ({
        ...prev,
        [questionId]: true,
      }));
    } else if (type === 'multiple') {
      setAnswers(prev => {
        const current = prev[questionId] || [];
        const exists = current.includes(optionId);
        const updated = exists ? current.filter(id => id !== optionId) : [...current, optionId];
        return {
          ...prev,
          [questionId]: updated,
        };
      });
    }
  };

  const handleConfirmQuestion = (questionId) => {
    setConfirmedQuestions(prev => ({
      ...prev,
      [questionId]: true,
    }));
  };

  const handleTextAnswer = (questionId, text) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (question) => {
    const isConfirmed = Boolean(confirmedQuestions[question.id]);
    if (!isConfirmed) return null;

    const userAns = answers[question.id];
    if (question.question_type === 'single') {
      const correctOpt = question.options.find(o => o.is_correct);
      return userAns === correctOpt?.id;
    } else if (question.question_type === 'multiple') {
      const selectedIds = userAns || [];
      const correctIds = question.options.filter(o => o.is_correct).map(o => o.id);
      if (selectedIds.length !== correctIds.length) return false;
      return selectedIds.every(id => correctIds.includes(id));
    } else if (question.question_type === 'text') {
      const cleanUser = String(userAns || '').trim().toLowerCase();
      return question.options.some(o => o.option_text.trim().toLowerCase() === cleanUser);
    }
    return null;
  };

  // 1. Loading state
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-800 dark:text-slate-100">
        <div className="w-12 h-12 border-4 border-indigo-200 dark:border-[#24356e] border-t-indigo-600 dark:border-t-[#526cd1] rounded-full animate-spin mb-4" />
        <p className="text-slate-500 dark:text-slate-300 text-sm font-medium">{t('takeTest.loading_test')}</p>
      </div>
    );
  }

  // 2. Error state
  if (error || !testData) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-[#131936] rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-[#26376e] text-center text-slate-800 dark:text-slate-100">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('takeTest.test_not_found')}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-300 mb-6">{error || t('takeTest.test_not_found')}</p>
        <button
          onClick={onGoHome}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#25366f] dark:hover:bg-[#30458e] text-white text-sm font-medium rounded-xl inline-flex items-center gap-2 transition-colors border border-indigo-500 dark:border-[#3b55a8]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('takeTest.back_home')}</span>
        </button>
      </div>
    );
  }

  const { test, questions } = testData;
  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter(q => {
    const a = answers[q.id];
    if (Array.isArray(a)) return a.length > 0;
    return a !== undefined && a !== '';
  }).length;

  // 3. Results Screen
  if (result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <div className="bg-white dark:bg-[#131936] rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-[#243365] overflow-hidden mb-8">
          {/* Result Header Banner */}
          <div className={`p-6 sm:p-8 text-center text-white ${
            result.passed 
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-800 dark:to-teal-800' 
              : 'bg-gradient-to-r from-rose-600 to-pink-700 dark:from-rose-900 dark:to-pink-900'
          }`}>
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 shadow-inner">
              {result.passed ? <CheckCircle className="w-9 h-9" /> : <XCircle className="w-9 h-9" />}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {result.passed ? t('takeTest.results_passed') : t('takeTest.results_failed')}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {result.studentName} {result.studentGroup ? `(${result.studentGroup})` : ''}
            </p>
          </div>

          {/* Results Score Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-50 dark:bg-[#0e142c] border-b border-slate-200 dark:border-[#1f2b56] text-center">
            <div className="bg-white dark:bg-[#131936] p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-[#233162] shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('takeTest.results_score')}</div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                {result.score} <span className="text-xs sm:text-sm font-normal text-slate-400">/ {result.maxScore}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#131936] p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-[#233162] shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('takeTest.results_percentage')}</div>
              <div className={`text-xl sm:text-2xl font-black mt-1 ${result.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {result.percentage}%
              </div>
            </div>

            <div className="bg-white dark:bg-[#131936] p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-[#233162] shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('takeTest.results_passing_score')}</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {result.passingScore}%
              </div>
            </div>

            <div className="bg-white dark:bg-[#131936] p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-[#233162] shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('takeTest.results_time_spent')}</div>
              <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mt-1.5">
                {Math.floor(result.durationSeconds / 60)}{t('common.minutes')} {result.durationSeconds % 60}{t('common.seconds')}
              </div>
            </div>
          </div>

          {/* Detailed Question Review */}
          {result.showResults && result.review && (
            <div className="p-5 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#1f2b56]">
                <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-[#8fa7ff]" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">{t('takeTest.review_title')}</h3>
              </div>

              <div className="space-y-4">
                {result.review.map((item, idx) => (
                  <div
                    key={item.question_id}
                    className={`p-4 sm:p-5 rounded-xl border transition-colors ${
                      item.is_correct 
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40' 
                        : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5 ${
                          item.is_correct ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
                            {item.question_text}
                          </h4>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        item.is_correct 
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300' 
                          : 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300'
                      }`}>
                        {item.points_awarded} / {item.max_points} {t('common.points')}
                      </span>
                    </div>

                    {/* Options Breakdown */}
                    <div className="mt-3 pl-8 space-y-2">
                      {item.question_type === 'text' ? (
                        <div className="text-xs space-y-1">
                          <div className="p-2.5 rounded-lg bg-white dark:bg-[#0c1023] border border-slate-200 dark:border-[#243365]">
                            <span className="text-slate-500 dark:text-slate-400">Javob: </span>
                            <span className={`font-mono font-medium ${item.is_correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {item.student_answer || '<bo\'sh>'}
                            </span>
                          </div>
                          {!item.is_correct && (
                            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300">
                              <span className="font-semibold">To'g'ri javob: </span>
                              <span className="font-mono">{item.correct_answer}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        item.options?.map((opt) => {
                          const isSelected = (item.selected_options || []).includes(opt.id);
                          const isCorrect = opt.is_correct;

                          let style = 'bg-white dark:bg-[#0c1023] border-slate-200 dark:border-[#243365] text-slate-700 dark:text-slate-300';
                          if (isSelected && isCorrect) {
                            style = 'bg-emerald-100/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/70 text-emerald-900 dark:text-emerald-200 font-medium';
                          } else if (isSelected && !isCorrect) {
                            style = 'bg-rose-100/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/70 text-rose-900 dark:text-rose-200 font-medium';
                          } else if (!isSelected && isCorrect) {
                            style = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300';
                          }

                          return (
                            <div
                              key={opt.id}
                              className={`p-2.5 rounded-lg border text-xs sm:text-sm flex items-center justify-between gap-3 ${style}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{isSelected ? '●' : '○'}</span>
                                <span>{opt.option_text}</span>
                              </div>
                              {isSelected && isCorrect && <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">✓ {t('takeTest.instant_correct')}</span>}
                              {isSelected && !isCorrect && <span className="text-xs text-rose-700 dark:text-rose-400 font-bold">✗ {t('takeTest.instant_wrong')}</span>}
                              {!isSelected && isCorrect && <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{t('takeTest.instant_correct_answer')}</span>}
                            </div>
                          );
                        })
                      )}

                      {item.explanation && (
                        <div className="mt-2 p-2.5 rounded-lg bg-indigo-50 dark:bg-[#182348] border border-indigo-200 dark:border-[#293d7c] text-xs text-indigo-900 dark:text-indigo-200">
                          <span className="font-bold">{t('takeTest.explanation_label')} </span>
                          <span>{item.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="p-4 sm:p-6 bg-slate-50 dark:bg-[#0e142c] border-t border-slate-200 dark:border-[#1f2b56] flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={onGoHome}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#25366f] dark:hover:bg-[#30458e] text-white font-medium text-xs sm:text-sm rounded-xl transition-colors border border-indigo-500 dark:border-[#3b55a8]"
            >
              {t('takeTest.back_home')}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 border border-slate-300 dark:border-[#2b3c75] hover:bg-slate-100 dark:hover:bg-[#182348] text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t('takeTest.retry_btn')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Pre-test Registration Card
  if (!isStarted) {
    return (
      <div className="max-w-lg mx-auto my-6 sm:my-12 px-4 text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <div className="bg-white dark:bg-[#131936] rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-[#243365] overflow-hidden">
          <div className="p-6 sm:p-8 bg-gradient-to-br from-indigo-50 via-slate-50 to-white dark:from-[#131936] dark:via-[#1a2550] dark:to-[#263770] border-b border-slate-200 dark:border-[#233162] text-slate-900 dark:text-white">
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-[#131936] border border-indigo-200 dark:border-[#2d4080] font-semibold uppercase tracking-wider inline-block mb-3 text-indigo-700 dark:text-[#8fa7ff]">
              {t('takeTest.online_test_badge')}
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight leading-snug">
              {test.title}
            </h1>
            {test.description && (
              <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 leading-relaxed">
                {test.description}
              </p>
            )}
          </div>

          {/* Test parameters info */}
          <div className="grid grid-cols-3 gap-2 p-3 sm:p-4 bg-slate-50 dark:bg-[#0e142c] border-b border-slate-200 dark:border-[#1f2b56] text-center text-slate-600 dark:text-slate-300">
            <div className="p-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">{t('takeTest.questions_count_label')}</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{test.question_count}</span>
            </div>
            <div className="p-2 border-x border-slate-200 dark:border-[#1f2b56]">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">{t('takeTest.time_label')}</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {test.time_limit_minutes > 0 ? `${test.time_limit_minutes} ${t('common.minutes')}` : t('takeTest.no_time_limit')}
              </span>
            </div>
            <div className="p-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">{t('takeTest.passing_score_label')}</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{test.passing_score}%</span>
            </div>
          </div>

          {/* Registration form */}
          <form onSubmit={handleStart} className="p-6 sm:p-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t('takeTest.your_name')} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={t('takeTest.your_name_placeholder')}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-slate-900 dark:text-white text-sm focus:bg-white dark:focus:bg-[#0f152d] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-[#3c55a6]/40 focus:border-indigo-600 dark:focus:border-[#4d6ecf] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t('takeTest.group_label')}
              </label>
              <input
                type="text"
                value={studentGroup}
                onChange={(e) => setStudentGroup(e.target.value)}
                placeholder={t('takeTest.group_placeholder')}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#0c1023] border border-slate-300 dark:border-[#243365] rounded-xl text-slate-900 dark:text-white text-sm focus:bg-white dark:focus:bg-[#0f152d] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-[#3c55a6]/40 focus:border-indigo-600 dark:focus:border-[#4d6ecf] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!studentName.trim()}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#25366f] dark:hover:bg-[#2f438a] disabled:opacity-40 text-white font-semibold text-sm rounded-xl border border-indigo-500 dark:border-[#3c55a6] shadow-md dark:shadow-lg dark:shadow-black/40 transition-all hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>{t('takeTest.start_test_btn')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 5. Active Testing Phase
  const isTimeCritical = timeLeft !== null && timeLeft <= 60;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Test Header Bar */}
      <div className="bg-white dark:bg-[#131936] rounded-2xl shadow-md dark:shadow-xl border border-slate-200 dark:border-[#243365] p-4 mb-6 sticky top-16 sm:top-20 z-20 backdrop-blur-md transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg truncate max-w-sm sm:max-w-md">
              {test.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{studentName} {studentGroup && `(${studentGroup})`}</span>
              <span>•</span>
              <span>{t('takeTest.answered_stat')} <strong className="text-slate-900 dark:text-white">{answeredCount}</strong> {t('takeTest.out_of')} {questions.length}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            {timeLeft !== null && (
              <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono font-bold text-sm border transition-all ${
                isTimeCritical 
                  ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-500 text-rose-600 dark:text-rose-300 animate-pulse' 
                  : 'bg-slate-100 dark:bg-[#0c1023] border-slate-200 dark:border-[#243365] text-slate-800 dark:text-slate-200'
              }`}>
                <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}

            {/* Finish Test Button */}
            <button
              onClick={() => setConfirmSubmitOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl border border-emerald-500 shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t('takeTest.finish_btn')}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-[#0c1023] h-1.5 rounded-full mt-3 overflow-hidden border border-slate-200 dark:border-[#1f2b56]/40">
          <div 
            className="bg-indigo-600 dark:bg-[#526cd1] h-full transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Questions Navigator Grid */}
      <div className="bg-white dark:bg-[#131936] rounded-2xl p-4 shadow-sm dark:shadow-xl border border-slate-200 dark:border-[#243365] mb-6 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {t('takeTest.q_navigator_title')}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
            {t('takeTest.q_navigator_hint')}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const status = getQuestionStatus(q);
            const hasAns = answers[q.id] !== undefined && (
              Array.isArray(answers[q.id]) ? answers[q.id].length > 0 : answers[q.id] !== ''
            );

            let btnStyle = 'bg-slate-100 dark:bg-[#0e142c] border-slate-200 dark:border-[#223060] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#172147]';
            if (status === true) {
              btnStyle = 'bg-emerald-600 border-emerald-500 text-white font-bold shadow-xs';
            } else if (status === false) {
              btnStyle = 'bg-rose-600 border-rose-500 text-white font-bold shadow-xs';
            } else if (isCurrent) {
              btnStyle = 'bg-indigo-600 dark:bg-[#25366f] border-indigo-500 dark:border-[#3c55a6] text-white font-bold';
            } else if (hasAns) {
              btnStyle = 'bg-indigo-100 dark:bg-[#182348] border-indigo-200 dark:border-[#2e4082] text-indigo-900 dark:text-slate-200 font-semibold';
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 rounded-xl border text-xs flex items-center justify-center transition-all ${btnStyle} ${isCurrent ? 'ring-2 ring-indigo-500 dark:ring-[#526cd1] ring-offset-2 ring-offset-white dark:ring-offset-[#131936]' : ''}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Question Card */}
      {currentQuestion && (
        <div className="bg-white dark:bg-[#131936] rounded-2xl shadow-md dark:shadow-2xl border border-slate-200 dark:border-[#243365] overflow-hidden transition-colors">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#0c1023] text-indigo-700 dark:text-[#8fa7ff] text-xs font-bold border border-slate-200 dark:border-[#26376e]">
                {currentIndex + 1} / {questions.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {currentQuestion.points} {t('common.points')}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug mb-6">
              {currentQuestion.question_text}
            </h3>

            {/* Answer Options */}
            <div className="space-y-4">
              {currentQuestion.question_type === 'single' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('takeTest.single_choice')}:</p>
                  {currentQuestion.options.map((opt) => {
                    const isSelected = answers[currentQuestion.id] === opt.id;
                    const isConfirmed = Boolean(confirmedQuestions[currentQuestion.id]);

                    let cardStyle = 'bg-slate-50 dark:bg-[#0e142c] hover:bg-slate-100 dark:hover:bg-[#151e3f] border-slate-200 dark:border-[#243365] text-slate-800 dark:text-slate-200 cursor-pointer';
                    let radioStyle = 'border-slate-400 dark:border-slate-500 bg-white dark:bg-[#0c1023] text-transparent';
                    let badge = null;

                    if (isConfirmed) {
                      if (opt.is_correct) {
                        cardStyle = 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100 font-medium shadow-xs';
                        radioStyle = 'border-emerald-500 bg-emerald-600 text-white';
                        badge = (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-600 ml-auto flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{t('takeTest.instant_correct')}</span>
                          </span>
                        );
                      } else if (isSelected && !opt.is_correct) {
                        cardStyle = 'bg-rose-50 dark:bg-rose-950/70 border-rose-400 dark:border-rose-500 text-rose-950 dark:text-rose-100 font-medium shadow-xs';
                        radioStyle = 'border-rose-500 bg-rose-600 text-white';
                        badge = (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-600 ml-auto flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>{t('takeTest.instant_wrong')}</span>
                          </span>
                        );
                      } else {
                        cardStyle = 'bg-slate-50/50 dark:bg-[#0a0f21]/60 border-slate-200 dark:border-[#1a254c] text-slate-400 dark:text-slate-500 opacity-60 cursor-default';
                      }
                    } else if (isSelected) {
                      cardStyle = 'bg-indigo-50 dark:bg-[#182348] border-indigo-400 dark:border-[#4162bf] text-indigo-950 dark:text-white font-medium shadow-xs';
                      radioStyle = 'border-indigo-600 dark:border-[#526cd1] bg-indigo-600 dark:bg-[#526cd1] text-white';
                    }

                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          if (!isConfirmed) {
                            handleSelectOption(currentQuestion.id, opt.id, 'single');
                          }
                        }}
                        className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border transition-all ${cardStyle}`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${radioStyle}`}>
                          {isConfirmed && opt.is_correct && <span className="text-xs font-bold leading-none">✓</span>}
                          {isConfirmed && isSelected && !opt.is_correct && <span className="text-xs font-bold leading-none">✗</span>}
                          {!isConfirmed && isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm select-none">{opt.option_text}</span>
                        {badge}
                      </div>
                    );
                  })}

                  {/* Immediate feedback banner for single choice */}
                  {confirmedQuestions[currentQuestion.id] && (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 mt-4 animate-in fade-in ${
                      getQuestionStatus(currentQuestion) === true
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100'
                        : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-600 text-rose-900 dark:text-rose-100'
                    }`}>
                      {getQuestionStatus(currentQuestion) === true ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-bold text-sm">
                          {getQuestionStatus(currentQuestion) === true ? (
                            <span>To'g'ri! (+{currentQuestion.points} {t('common.points')})</span>
                          ) : (
                            <span>Noto'g'ri! To'g'ri javob: <strong className="text-emerald-700 dark:text-emerald-300">{currentQuestion.options.find(o => o.is_correct)?.option_text}</strong></span>
                          )}
                        </div>
                        {currentQuestion.explanation && (
                          <div className="text-xs mt-2 opacity-95 leading-relaxed bg-white/80 dark:bg-[#0c1023]/80 p-2.5 rounded-lg border border-slate-200 dark:border-[#233162]">
                            <strong className="text-indigo-600 dark:text-indigo-300">{t('takeTest.explanation_label')} </strong>{currentQuestion.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.question_type === 'multiple' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('takeTest.multi_choice')}:</p>
                  {currentQuestion.options.map((opt) => {
                    const selectedList = answers[currentQuestion.id] || [];
                    const isSelected = selectedList.includes(opt.id);
                    const isConfirmed = Boolean(confirmedQuestions[currentQuestion.id]);

                    let cardStyle = 'bg-slate-50 dark:bg-[#0e142c] hover:bg-slate-100 dark:hover:bg-[#151e3f] border-slate-200 dark:border-[#243365] text-slate-800 dark:text-slate-200 cursor-pointer';
                    let boxStyle = 'border-slate-400 dark:border-slate-500 bg-white dark:bg-[#0c1023] text-transparent';
                    let badge = null;

                    if (isConfirmed) {
                      if (opt.is_correct && isSelected) {
                        cardStyle = 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100 font-medium shadow-xs';
                        boxStyle = 'border-emerald-500 bg-emerald-600 text-white';
                        badge = (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-600 ml-auto">
                            ✓ To'g'ri tanlandi
                          </span>
                        );
                      } else if (!opt.is_correct && isSelected) {
                        cardStyle = 'bg-rose-50 dark:bg-rose-950/70 border-rose-400 dark:border-rose-500 text-rose-950 dark:text-rose-100 font-medium shadow-xs';
                        boxStyle = 'border-rose-500 bg-rose-600 text-white';
                        badge = (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-600 ml-auto">
                            ✗ Noto'g'ri variant
                          </span>
                        );
                      } else if (opt.is_correct && !isSelected) {
                        cardStyle = 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600/70 text-emerald-800 dark:text-emerald-200 font-medium';
                        boxStyle = 'border-emerald-500 bg-white dark:bg-[#0c1023] text-emerald-600 dark:text-emerald-400';
                        badge = (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-600 ml-auto">
                            ✓ Tanlanishi kerak edi
                          </span>
                        );
                      } else {
                        cardStyle = 'bg-slate-50/50 dark:bg-[#0a0f21]/60 border-slate-200 dark:border-[#1a254c] text-slate-400 dark:text-slate-500 opacity-60 cursor-default';
                      }
                    } else if (isSelected) {
                      cardStyle = 'bg-indigo-50 dark:bg-[#182348] border-indigo-400 dark:border-[#4162bf] text-indigo-950 dark:text-white font-medium shadow-xs';
                      boxStyle = 'border-indigo-600 dark:border-[#526cd1] bg-indigo-600 dark:bg-[#526cd1] text-white';
                    }

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(currentQuestion.id, opt.id, 'multiple')}
                        className={`flex items-center gap-3.5 p-3.5 sm:p-4 rounded-xl border transition-all ${cardStyle}`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${boxStyle}`}>
                          {(isSelected || (isConfirmed && opt.is_correct)) && <span className="text-xs font-bold leading-none">✓</span>}
                        </div>
                        <span className="text-sm select-none">{opt.option_text}</span>
                        {badge}
                      </div>
                    );
                  })}

                  {!confirmedQuestions[currentQuestion.id] ? (
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={!(answers[currentQuestion.id] && answers[currentQuestion.id].length > 0)}
                        onClick={() => handleConfirmQuestion(currentQuestion.id)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#25366f] dark:hover:bg-[#2f438a] disabled:opacity-40 text-white text-xs font-semibold rounded-xl border border-indigo-500 dark:border-[#3c55a6] shadow-xs transition-all"
                      >
                        Javobni tekshirish
                      </button>
                    </div>
                  ) : (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 mt-4 animate-in fade-in ${
                      getQuestionStatus(currentQuestion) === true
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100'
                        : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-600 text-rose-900 dark:text-rose-100'
                    }`}>
                      {getQuestionStatus(currentQuestion) === true ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-bold text-sm">
                          {getQuestionStatus(currentQuestion) === true ? (
                            <span>Barcha variantlar to'g'ri! (+{currentQuestion.points} {t('common.points')})</span>
                          ) : (
                            <span>Barcha to'g'ri variantlar belgilanmadi</span>
                          )}
                        </div>
                        {currentQuestion.explanation && (
                          <div className="text-xs mt-2 opacity-95 leading-relaxed bg-white/80 dark:bg-[#0c1023]/80 p-2.5 rounded-lg border border-slate-200 dark:border-[#233162]">
                            <strong className="text-indigo-600 dark:text-indigo-300">{t('takeTest.explanation_label')} </strong>{currentQuestion.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.question_type === 'text' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('takeTest.text_input')}:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled={Boolean(confirmedQuestions[currentQuestion.id])}
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !confirmedQuestions[currentQuestion.id] && answers[currentQuestion.id]?.trim()) {
                          handleConfirmQuestion(currentQuestion.id);
                        }
                      }}
                      placeholder={t('takeTest.write_answer_placeholder')}
                      className={`flex-1 px-4 py-3 border rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none transition-all ${
                        confirmedQuestions[currentQuestion.id]
                          ? getQuestionStatus(currentQuestion) === true
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-500 font-semibold text-emerald-950 dark:text-emerald-100'
                            : 'bg-rose-50 dark:bg-rose-950/70 border-rose-400 dark:border-rose-500 font-semibold text-rose-950 dark:text-rose-100'
                          : 'bg-slate-50 dark:bg-[#0c1023] border-slate-300 dark:border-[#243365] focus:bg-white dark:focus:bg-[#0f152d] focus:ring-2 focus:ring-indigo-500/30 dark:focus:ring-[#3c55a6]/40 focus:border-indigo-600 dark:focus:border-[#4d6ecf]'
                      }`}
                    />
                    {!confirmedQuestions[currentQuestion.id] && (
                      <button
                        type="button"
                        disabled={!answers[currentQuestion.id]?.trim()}
                        onClick={() => handleConfirmQuestion(currentQuestion.id)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#25366f] dark:hover:bg-[#2f438a] disabled:opacity-40 text-white text-xs font-semibold rounded-xl border border-indigo-500 dark:border-[#3c55a6] shadow-xs transition-all"
                      >
                        Tekshirish
                      </button>
                    )}
                  </div>

                  {confirmedQuestions[currentQuestion.id] && (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 mt-4 animate-in fade-in ${
                      getQuestionStatus(currentQuestion) === true
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100'
                        : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-600 text-rose-900 dark:text-rose-100'
                    }`}>
                      {getQuestionStatus(currentQuestion) === true ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-bold text-sm">
                          {getQuestionStatus(currentQuestion) === true ? (
                            <span>To'g'ri! (+{currentQuestion.points} {t('common.points')})</span>
                          ) : (
                            <span>Noto'g'ri! To'g'ri javob: <strong className="text-emerald-700 dark:text-emerald-300">{currentQuestion.options.map(o => o.option_text).join(' / ')}</strong></span>
                          )}
                        </div>
                        {currentQuestion.explanation && (
                          <div className="text-xs mt-2 opacity-95 leading-relaxed bg-white/80 dark:bg-[#0c1023]/80 p-2.5 rounded-lg border border-slate-200 dark:border-[#233162]">
                            <strong className="text-indigo-600 dark:text-indigo-300">{t('takeTest.explanation_label')} </strong>{currentQuestion.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons footer */}
          <div className="p-4 sm:p-6 bg-slate-50 dark:bg-[#0e142c] border-t border-slate-200 dark:border-[#1f2b56] flex items-center justify-between transition-colors">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 border border-slate-300 dark:border-[#243365] hover:bg-slate-100 dark:hover:bg-[#182348] disabled:opacity-30 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t('takeTest.prev_q')}</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-[#25366f] dark:hover:bg-[#2f438a] text-white text-sm font-semibold rounded-xl border border-indigo-500 dark:border-[#3c55a6] flex items-center gap-1.5 shadow-xs transition-all"
              >
                <span>{t('takeTest.next_q')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setConfirmSubmitOpen(true)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl border border-emerald-500 flex items-center gap-1.5 shadow-md transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{t('takeTest.finish_btn')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirm Submit Dialog */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#131936] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-[#243365] text-slate-800 dark:text-slate-100 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">
              {t('takeTest.confirm_finish_title')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 text-center mb-4">
              {t('takeTest.confirm_finish_desc', { unanswered: questions.length - answeredCount })}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-[#243365] hover:bg-slate-100 dark:hover:bg-[#182348] text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors"
              >
                {t('takeTest.confirm_no')}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmitTest(false)}
                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl border border-emerald-500 shadow-md transition-all"
              >
                {isSubmitting ? t('common.loading') : t('takeTest.confirm_yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
