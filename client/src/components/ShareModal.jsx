import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, ExternalLink, QrCode } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ShareModal({ test, onClose }) {
  const { t } = useApp();
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  if (!test) return null;

  const testUrl = `${window.location.origin}/test/${test.access_code}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(testUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(test.access_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-[#131936] rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#243365] overflow-hidden transform transition-all text-slate-800 dark:text-white">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#243365] flex items-center justify-between bg-slate-50 dark:bg-[#0e142c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#131936]/10 dark:bg-[#25366f] text-[#131936] dark:text-[#8fa7ff] flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">{t('modals.share_title')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[260px]">{test.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#25366f] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#0c1023] rounded-xl border border-slate-200 dark:border-[#243365]">
            <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 dark:border-white">
              <QRCodeSVG
                value={testUrl}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
              {t('modals.share_qr_hint')}
            </p>
          </div>

          {/* Access Code Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('modals.share_code_label')}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 dark:bg-[#0c1023] border border-slate-200 dark:border-[#243365] rounded-lg px-3 py-2 font-mono font-bold text-slate-900 dark:text-white text-lg tracking-wider text-center">
                {test.access_code}
              </div>
              <button
                onClick={copyCode}
                className="px-3 py-2 border border-slate-300 dark:border-[#243365] bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2349] dark:hover:bg-[#25366f] text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {codeCopied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-500 dark:text-slate-300" />}
                <span>{codeCopied ? t('common.copied') : t('common.copy')}</span>
              </button>
            </div>
          </div>

          {/* Direct Link Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('modals.share_link_label')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={testUrl}
                className="flex-1 bg-slate-50 dark:bg-[#0c1023] border border-slate-200 dark:border-[#243365] rounded-lg px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 select-all focus:outline-none"
              />
              <button
                onClick={copyUrl}
                className="px-3.5 py-2 bg-[#131936] hover:bg-[#1e2a54] dark:bg-[#25366f] dark:hover:bg-[#2f438a] text-white text-sm font-medium rounded-lg flex items-center gap-1.5 shadow-sm border border-[#131936] dark:border-[#3c55a6] transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                <span>{copied ? t('common.copied') : t('common.copy')}</span>
              </button>
            </div>
          </div>

          {/* Open in new tab link */}
          <div className="pt-2 text-center">
            <a
              href={testUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#131936] dark:text-[#8fa7ff] hover:text-[#25366f] dark:hover:text-[#b3c4ff] font-medium hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{t('modals.share_open_tab')}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
