'use client';

import { useState, useCallback } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { LanguageSelector, type LanguageCode } from '@/components/LanguageSelector';
import { ResultPanel } from '@/components/ResultPanel';
import { StudyTools } from '@/components/StudyTools';

type Status = 'idle' | 'submitting' | 'done' | 'error';

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<LanguageCode>('hi-IN');
  const [status, setStatus] = useState<Status>('idle');
  const [resultText, setResultText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileSelect = useCallback(
    (f: File | null, url: string) => {
      if (!f) {
        // Reset
        setFile(null);
        setPreviewUrl(null);
        setStatus('idle');
        setResultText('');
        setErrorMessage('');
        return;
      }
      setFile(f);
      setPreviewUrl(url);
      setStatus('idle');
      setResultText('');
      setErrorMessage('');
    },
    []
  );

  const handleSubmit = async () => {
    if (!file) return;

    setStatus('submitting');
    setErrorMessage('');
    setResultText('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type — browser sets it with the multipart boundary
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setErrorMessage(json.error ?? 'An unexpected error occurred.');
        setStatus('error');
        return;
      }

      setResultText(json.text);
      setStatus('done');
    } catch {
      setErrorMessage(
        'Network error. Please check your internet connection and try again.'
      );
      setStatus('error');
    }
  };

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setResultText('');
    setErrorMessage('');
  };

  const isProcessing = status === 'submitting';

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Handwritten Notes OCR
          </h1>
          <p className="mt-2 text-base text-gray-500">
            Upload a photo of handwritten notes in any Indian language and get
            editable digital text
          </p>
        </div>

        {/* Main card */}
        <div className="rounded-2xl bg-white/80 p-5 shadow-lg ring-1 ring-gray-900/5 backdrop-blur-sm sm:p-7 space-y-5">
          {/* Language selector */}
          <LanguageSelector
            value={language}
            onChange={setLanguage}
            disabled={isProcessing}
          />

          {/* Upload zone */}
          <UploadZone
            onFileSelect={handleFileSelect}
            disabled={isProcessing}
            preview={previewUrl}
          />

          {/* Submit button */}
          {file && status !== 'done' && (
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold
                         text-white shadow-md transition-all
                         hover:bg-indigo-700 hover:shadow-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                         disabled:cursor-not-allowed disabled:opacity-60
                         active:scale-[0.99]"
            >
              {isProcessing ? (
                <span className="inline-flex items-center gap-2">
                  {/* Spinner */}
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing... this may take 15-60 seconds
                </span>
              ) : (
                'Extract Text'
              )}
            </button>
          )}

          {/* Processing status info */}
          {isProcessing && (
            <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700 ring-1 ring-indigo-100">
              <p className="font-medium">Your image is being processed</p>
              <p className="mt-1 text-indigo-600/80">
                Sarvam Vision is analyzing the handwritten text. This typically
                takes 15&ndash;45 seconds depending on image complexity.
              </p>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm ring-1 ring-red-100">
              <p className="font-medium text-red-800">Error</p>
              <p className="mt-1 text-red-700">{errorMessage}</p>
              <button
                onClick={() => {
                  setStatus('idle');
                  setErrorMessage('');
                }}
                className="mt-2 text-sm font-medium text-red-600 underline
                           decoration-red-300 underline-offset-2 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          )}

          {/* Result */}
          {status === 'done' && resultText && (
            <>
              <hr className="border-gray-100" />
              <ResultPanel text={resultText} onChange={setResultText} />

              {/* Study Tools */}
              <hr className="border-gray-100" />
              <StudyTools text={resultText} language={language} />

              <button
                onClick={handleReset}
                className="text-sm text-gray-400 underline decoration-gray-300
                           underline-offset-2 transition-colors hover:text-gray-600
                           hover:decoration-gray-500"
              >
                Start over with a new image
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Powered by{' '}
          <a
            href="https://www.sarvam.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-gray-300 underline-offset-2 hover:text-gray-600"
          >
            Sarvam AI
          </a>{' '}
          Vision
        </p>
      </div>
    </main>
  );
}
