'use client';

import { useState, useRef } from 'react';

interface Props {
  text: string;
  onChange: (text: string) => void;
}

export function ResultPanel({ text, onChange }: Props) {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      if (textareaRef.current) {
        textareaRef.current.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-text-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">
          Extracted Text
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={!text}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200
                       bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm
                       transition-all hover:bg-gray-50 active:scale-95
                       disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={!text}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200
                       bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm
                       transition-all hover:bg-gray-50 active:scale-95
                       disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download .txt
          </button>
        </div>
      </div>

      {/* Editable textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={14}
        className="w-full rounded-lg border border-gray-200 bg-white p-4 text-sm
                   leading-relaxed text-gray-800 shadow-inner transition-colors
                   focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100
                   resize-y"
        spellCheck={false}
        dir="auto"
        placeholder="Extracted text will appear here..."
      />

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <p>
          {charCount.toLocaleString()} characters &middot; {wordCount.toLocaleString()} words
        </p>
        <p>You can edit the text before copying or downloading</p>
      </div>
    </div>
  );
}
