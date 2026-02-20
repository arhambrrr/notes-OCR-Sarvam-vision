'use client';

import { useState } from 'react';
import type { LanguageCode } from './LanguageSelector';

interface Props {
  text: string;
  language: LanguageCode;
}

type StudyMode = 'summarize' | 'explain' | 'quiz' | 'translate';

interface Tool {
  mode: StudyMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
}

const TOOLS: Tool[] = [
  {
    mode: 'summarize',
    label: 'Summarize',
    description: 'Key points & bullet summary',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.007v.008H3.75V6.75zm0 5.25h.007v.008H3.75V12zm0 5.25h.007v.008H3.75v-.008z" />
      </svg>
    ),
    color: 'border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100',
    activeColor: 'border-blue-400 bg-blue-100 text-blue-800 ring-2 ring-blue-300',
  },
  {
    mode: 'explain',
    label: 'Explain',
    description: 'Simple explanation of concepts',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
    color: 'border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100',
    activeColor: 'border-amber-400 bg-amber-100 text-amber-800 ring-2 ring-amber-300',
  },
  {
    mode: 'quiz',
    label: 'Quiz Me',
    description: 'Practice questions from notes',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
    color: 'border-green-200 bg-green-50/50 text-green-700 hover:bg-green-100',
    activeColor: 'border-green-400 bg-green-100 text-green-800 ring-2 ring-green-300',
  },
  {
    mode: 'translate',
    label: 'Translate',
    description: 'Translate to English',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
      </svg>
    ),
    color: 'border-purple-200 bg-purple-50/50 text-purple-700 hover:bg-purple-100',
    activeColor: 'border-purple-400 bg-purple-100 text-purple-800 ring-2 ring-purple-300',
  },
];

export function StudyTools({ text, language }: Props) {
  const [activeMode, setActiveMode] = useState<StudyMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleToolClick = async (mode: StudyMode) => {
    // If same tool is clicked again, toggle it off
    if (activeMode === mode && result) {
      setActiveMode(null);
      setResult('');
      setError('');
      return;
    }

    setActiveMode(mode);
    setLoading(true);
    setResult('');
    setError('');

    try {
      const res = await fetch('/api/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode, language }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error ?? 'Something went wrong.');
        return;
      }

      setResult(json.result);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div>
        <h2 className="text-base font-semibold text-gray-800">
          Study Tools
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Use AI to help you learn from your extracted notes
        </p>
      </div>

      {/* Tool buttons grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TOOLS.map((tool) => (
          <button
            key={tool.mode}
            onClick={() => handleToolClick(tool.mode)}
            disabled={loading}
            className={`
              flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center
              transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50
              ${activeMode === tool.mode ? tool.activeColor : tool.color}
            `}
          >
            {tool.icon}
            <span className="text-sm font-medium">{tool.label}</span>
            <span className="hidden text-xs opacity-70 sm:block">
              {tool.description}
            </span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <svg className="h-4 w-4 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>
            {activeMode === 'summarize' && 'Generating summary...'}
            {activeMode === 'explain' && 'Preparing explanation...'}
            {activeMode === 'quiz' && 'Creating practice questions...'}
            {activeMode === 'translate' && 'Translating to English...'}
          </span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium text-gray-600">
              {activeMode === 'summarize' && 'Summary'}
              {activeMode === 'explain' && 'Explanation'}
              {activeMode === 'quiz' && 'Practice Questions'}
              {activeMode === 'translate' && 'English Translation'}
            </h3>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-md border border-gray-200
                         bg-white px-2.5 py-1 text-xs font-medium text-gray-500
                         shadow-sm transition-all hover:bg-gray-50 active:scale-95"
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
          <div
            className="max-h-96 overflow-y-auto rounded-lg border border-gray-200
                       bg-white p-4 text-sm leading-relaxed text-gray-800
                       shadow-inner whitespace-pre-wrap"
            dir="auto"
          >
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
