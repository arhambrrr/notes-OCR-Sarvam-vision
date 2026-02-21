import { NextRequest, NextResponse } from 'next/server';
import { studyAssist } from '@/lib/sarvam';
import type { SarvamLanguage, StudyMode } from '@/lib/sarvam';

export const maxDuration = 60;

const VALID_MODES = new Set<string>(['summarize', 'explain', 'quiz', 'translate']);

const VALID_LANGUAGES = new Set<string>([
  'hi-IN', 'mr-IN', 'kn-IN', 'ta-IN', 'te-IN', 'bn-IN',
  'gu-IN', 'ml-IN', 'pa-IN', 'or-IN', 'ur-IN', 'en-IN',
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, mode, language, targetLanguage } = body as {
      text?: string;
      mode?: string;
      language?: string;
      targetLanguage?: string;
    };

    // ─── Validation ─────────────────────────────────────────────────

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text provided.' },
        { status: 400 }
      );
    }

    if (!mode || !VALID_MODES.has(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Use: summarize, explain, quiz, translate' },
        { status: 400 }
      );
    }

    if (!language || !VALID_LANGUAGES.has(language)) {
      return NextResponse.json(
        { error: 'Invalid language code.' },
        { status: 400 }
      );
    }

    // Limit input text to ~6000 chars to stay within token limits
    const trimmedText = text.slice(0, 6000);

    // ─── Process ────────────────────────────────────────────────────

    const result = await studyAssist(
      trimmedText,
      mode as StudyMode,
      language as SarvamLanguage,
      targetLanguage as SarvamLanguage | undefined
    );

    return NextResponse.json({ result });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('SARVAM_API_KEY')) {
      return NextResponse.json(
        { error: 'Server configuration error: API key not set.' },
        { status: 500 }
      );
    }

    console.error('[Study API Error]', message);
    return NextResponse.json(
      { error: 'Failed to process your request. Please try again.' },
      { status: 500 }
    );
  }
}
