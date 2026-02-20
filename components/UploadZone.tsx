'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';

interface Props {
  onFileSelect: (file: File | null, previewUrl: string) => void;
  disabled?: boolean;
  preview?: string | null;
}

const ACCEPTED_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'image/bmp': ['.bmp'],
  'image/tiff': ['.tif', '.tiff'],
  'application/pdf': ['.pdf'],
};

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export function UploadZone({ onFileSelect, disabled, preview }: Props) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const code = rejection.errors[0]?.code;
        if (code === 'file-too-large') {
          setError('File is too large. Maximum size is 10 MB.');
        } else if (code === 'file-invalid-type') {
          setError('Unsupported file type. Use PNG, JPG, PDF, TIFF, BMP, or WebP.');
        } else {
          setError('Could not accept this file. Please try another.');
        }
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      onFileSelect(file, url);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: MAX_SIZE,
    disabled,
    multiple: false,
  });

  const handleRemove = () => {
    setError(null);
    onFileSelect(null, '');
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        {...getRootProps()}
        className={`
          relative flex min-h-52 cursor-pointer flex-col items-center justify-center
          rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200
          ${isDragActive
            ? 'border-indigo-500 bg-indigo-50 scale-[1.01]'
            : 'border-gray-300 bg-gray-50/50 hover:border-indigo-400 hover:bg-indigo-50/30'
          }
          ${disabled ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        {/* Hidden input — capture="environment" enables rear camera on mobile */}
        <input {...getInputProps({ capture: 'environment' } as Record<string, string>)} />

        {preview ? (
          <img
            src={preview}
            alt="Selected document preview"
            className="max-h-64 max-w-full rounded-lg object-contain shadow-sm"
          />
        ) : (
          <>
            {/* Upload icon */}
            <svg
              className="mb-3 h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-base font-medium text-gray-700">
              {isDragActive
                ? 'Drop your image here...'
                : 'Drag & drop or click to upload'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              PNG, JPG, PDF, TIFF, BMP, WebP &mdash; up to 10 MB
            </p>
            <p className="mt-1 text-xs text-gray-400">
              On mobile, tap to use your camera
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm font-medium text-red-600">{error}</p>
      )}

      {preview && !disabled && (
        <button
          type="button"
          onClick={handleRemove}
          className="self-start text-sm text-gray-500 underline decoration-gray-300
                     underline-offset-2 transition-colors hover:text-gray-700
                     hover:decoration-gray-500"
        >
          Remove and upload a different image
        </button>
      )}
    </div>
  );
}
