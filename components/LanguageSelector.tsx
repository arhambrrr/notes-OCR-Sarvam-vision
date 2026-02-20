'use client';

const LANGUAGES = [
  { code: 'hi-IN', label: 'Hindi', native: 'हिन्दी' },
  { code: 'mr-IN', label: 'Marathi', native: 'मराठी' },
  { code: 'kn-IN', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ta-IN', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te-IN', label: 'Telugu', native: 'తెలుగు' },
  { code: 'bn-IN', label: 'Bengali', native: 'বাংলা' },
  { code: 'gu-IN', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ml-IN', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa-IN', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'ur-IN', label: 'Urdu', native: 'اردو' },
  { code: 'en-IN', label: 'English', native: 'English' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

interface Props {
  value: LanguageCode;
  onChange: (lang: LanguageCode) => void;
  disabled?: boolean;
}

export function LanguageSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="language-select"
        className="text-sm font-medium text-gray-700"
      >
        Document Language
      </label>
      <select
        id="language-select"
        value={value}
        onChange={(e) => onChange(e.target.value as LanguageCode)}
        disabled={disabled}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm
                   shadow-sm transition-colors
                   focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200
                   disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label} ({lang.native})
          </option>
        ))}
      </select>
    </div>
  );
}
