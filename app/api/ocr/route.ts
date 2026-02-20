import { NextRequest, NextResponse } from 'next/server';
import { processImage } from '@/lib/sarvam';
import type { SarvamLanguage } from '@/lib/sarvam';

// Allow up to 2 minutes for the async Sarvam pipeline
export const maxDuration = 120;

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'application/pdf',
]);

const VALID_LANGUAGES = new Set<string>([
  'hi-IN', 'mr-IN', 'kn-IN', 'ta-IN', 'te-IN', 'bn-IN',
  'gu-IN', 'ml-IN', 'pa-IN', 'or-IN', 'ur-IN', 'en-IN',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const language = (formData.get('language') as string) ?? 'hi-IN';

    // ─── Validation ─────────────────────────────────────────────────

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please upload an image.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10 MB.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Please use PNG, JPG, PDF, TIFF, BMP, or WebP.` },
        { status: 400 }
      );
    }

    if (!VALID_LANGUAGES.has(language)) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}.` },
        { status: 400 }
      );
    }

    // ─── Process ────────────────────────────────────────────────────

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name || `upload.${file.type.split('/')[1] || 'png'}`;

    const text = await processImage(
      buffer,
      fileName,
      file.type,
      language as SarvamLanguage
    );

    return NextResponse.json({ text });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    // Map internal error codes to user-friendly messages
    if (message === 'NO_TEXT_DETECTED') {
      return NextResponse.json(
        { error: 'No handwritten text could be detected. Please try a clearer image with better lighting and contrast.' },
        { status: 422 }
      );
    }

    if (message.includes('timed out')) {
      return NextResponse.json(
        { error: 'Processing took too long. Please try again with a smaller or clearer image.' },
        { status: 504 }
      );
    }

    if (message.includes('job failed') || message.includes('Sarvam job failed')) {
      return NextResponse.json(
        { error: 'The OCR service could not process this image. Please try a different image.' },
        { status: 500 }
      );
    }

    if (message.includes('SARVAM_API_KEY')) {
      return NextResponse.json(
        { error: 'Server configuration error: API key not set. Please contact the administrator.' },
        { status: 500 }
      );
    }

    console.error('[OCR API Error]', message);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
