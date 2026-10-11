import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ShareModal from './components/ShareModal';
import CreateTestModal from './components/CreateTestModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import StudentReviewModal from './components/StudentReviewModal';
import ImportCodeModal from './components/ImportCodeModal';

import Home from './pages/Home';
import TakeTest from './pages/TakeTest';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminTestEditor from './pages/AdminTestEditor';
import AdminTestResults from './pages/AdminTestResults';

import { api } from './services/api';
import { useApp } from './context/AppContext';

export default function App() {
  const { t } = useApp();
  const [currentView, setCurrentView] = useState('home');
  const [activeTestCode, setActiveTestCode] = useState('');
  const [activeTestId, setActiveTestId] = useState(null);

  // Admin state
  const [admin, setAdmin] = useState(null);

  // Modals state
  const [shareModalTest, setShareModalTest] = useState(null);
  const [createTestModalOpen, setCreateTestModalOpen] = useState(false);
  const [importCodeModalOpen, setImportCodeModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [reviewAttemptData, setReviewAttemptData] = useState(null);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // URL routing sync
  useEffect(() => {
    const handleUrl = () => {
      const path = window.location.pathname;
      if (path.startsWith('/test/')) {
        const code = path.replace('/test/', '').trim();
        if (code) {
          setActiveTestCode(code);
          setCurrentView('take-test');
          return;
        }
      }
      if (path === '/admin') {
        const storedAdmin = api.getCurrentAdmin();
        if (storedAdmin) {
          setAdmin(storedAdmin);
          setCurrentView('admin-dashboard');
        } else {
          setCurrentView('admin-login');
        }
        return;
      }
    };

    handleUrl();
    window.addEventListener('popstate', handleUrl);
    return () => window.removeEventListener('popstate', handleUrl);
  }, []);

  // Check admin session on mount
  useEffect(() => {
    async function verify() {
      const user = await api.verifyAuth();
      if (user) {
        setAdmin(user);
      }
    }
    verify();
  }, []);

  // Navigation handlers with URL updates
  const navigateTo = (view, extra = {}) => {
    setCurrentView(view);
    if (view === 'home') {
      window.history.pushState({}, '', '/');
    } else if (view === 'take-test' && extra.code) {
      setActiveTestCode(extra.code);
      window.history.pushState({}, '', `/test/${extra.code}`);
    } else if (view === 'admin-dashboard') {
      window.history.pushState({}, '', '/admin');
    }
  };

  const handleStartTestByCode = (code) => {
    navigateTo('take-test', { code });
  };

  const handleLoginSuccess = (adminUser) => {
    setAdmin(adminUser);
    showToast(`Xush kelibsiz, ${adminUser.username}!`);
    navigateTo('admin-dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setAdmin(null);
    showToast('Tizimdan chiqildi');
    navigateTo('home');
  };

  const handleOpenEditTest = (testId) => {
    setActiveTestId(testId);
    setCurrentView('admin-editor');
  };

  const handleOpenResults = (testId) => {
    setActiveTestId(testId);
    setCurrentView('admin-results');
  };

  const handleViewAttemptDetails = async (attemptId) => {
    try {
      const data = await api.getAttemptDetails(attemptId);
      setReviewAttemptData(data);
    } catch (err) {
      alert(err.message || 'Xatolik');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c1023] flex flex-col font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => navigateTo(view)}
        admin={admin}
        onLogout={handleLogout}
        onOpenNewTestModal={() => setCreateTestModalOpen(true)}
        onChangePasswordModal={() => setChangePasswordModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentView === 'home' && (
          <Home
            onStartTestByCode={handleStartTestByCode}
            onGoAdminLogin={() => navigateTo(admin ? 'admin-dashboard' : 'admin-login')}
          />
        )}

        {currentView === 'take-test' && (
          <TakeTest
            testCode={activeTestCode}
            onGoHome={() => navigateTo('home')}
          />
        )}

        {currentView === 'admin-login' && (
          <AdminLogin
            onLoginSuccess={handleLoginSuccess}
            onGoHome={() => navigateTo('home')}
          />
        )}

        {currentView === 'admin-dashboard' && (
          <AdminDashboard
            onEditTest={handleOpenEditTest}
            onViewResults={handleOpenResults}
            onShareTest={(test) => setShareModalTest(test)}
            onOpenCreateTest={() => setCreateTestModalOpen(true)}
            onOpenImportCode={() => setImportCodeModalOpen(true)}
            onViewAttempt={handleViewAttemptDetails}
          />
        )}

        {currentView === 'admin-editor' && (
          <AdminTestEditor
            testId={activeTestId}
            onBack={() => navigateTo('admin-dashboard')}
            onShare={(test) => setShareModalTest(test)}
          />
        )}

        {currentView === 'admin-results' && (
          <AdminTestResults
            testId={activeTestId}
            onBack={() => navigateTo('admin-dashboard')}
            onViewAttempt={handleViewAttemptDetails}
          />
        )}
      </main>

      {/* Global Modals */}
      {shareModalTest && (
        <ShareModal
          test={shareModalTest}
          onClose={() => setShareModalTest(null)}
        />
      )}

      {createTestModalOpen && (
        <CreateTestModal
          onClose={() => setCreateTestModalOpen(false)}
          onOpenImportCode={() => setImportCodeModalOpen(true)}
          onCreated={(newTest) => {
            showToast('Test muvaffaqiyatli yaratildi!');
            handleOpenEditTest(newTest.id);
          }}
        />
      )}

      {importCodeModalOpen && (
        <ImportCodeModal
          mode="create"
          onClose={() => setImportCodeModalOpen(false)}
          onSuccess={(result) => {
            const test = result?.test || result;
            const count = test?.questions_count || result?.questions_count || result?.questionsCount || '';
            showToast(t('modals.import_code_success_created', { count }));
            if (test && test.id) {
              handleOpenEditTest(test.id);
            }
          }}
        />
      )}

      {changePasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setChangePasswordModalOpen(false)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}

      {reviewAttemptData && (
        <StudentReviewModal
          attemptData={reviewAttemptData}
          onClose={() => setReviewAttemptData(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 bg-white dark:bg-[#131936] border border-slate-200 dark:border-[#2e3e73] text-slate-900 dark:text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 max-w-[90vw]">
          <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 flex-shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-[#1a2347] bg-white dark:bg-[#090d1c] py-4 sm:py-5 text-center text-xs text-slate-500 dark:text-slate-400 mt-auto transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <span>&copy; {new Date().getFullYear()} {t('footer.copyright')}</span>
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => navigateTo(admin ? 'admin-dashboard' : 'admin-login')} 
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              {t('footer.teacher_link')}
            </button>
            <span>•</span>
            <button 
              onClick={() => handleStartTestByCode('demo-test')} 
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              {t('footer.demo_link')}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
