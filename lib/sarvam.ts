import AdmZip from 'adm-zip';

// ─── Types ──────────────────────────────────────────────────────────────────

export type SarvamLanguage =
  | 'hi-IN' | 'mr-IN' | 'kn-IN' | 'ta-IN'
  | 'te-IN' | 'bn-IN' | 'gu-IN' | 'ml-IN'
  | 'pa-IN' | 'or-IN' | 'ur-IN' | 'en-IN';

interface CreateJobResponse {
  job_id: string;
  job_state: string;
}

interface UploadUrlEntry {
  file_url: string;
  file_metadata: unknown;
}

interface UploadFilesResponse {
  job_id: string;
  upload_urls: Record<string, UploadUrlEntry>;
}

interface JobStatusDetail {
  total_pages: number;
  pages_processed: number;
  pages_succeeded: number;
  pages_failed: number;
  state: string;
  page_errors: string[];
}

interface JobStatusResponse {
  job_id: string;
  job_state: 'Accepted' | 'Pending' | 'Running' | 'Completed' | 'PartiallyCompleted' | 'Failed';
  error_message: string | null;
  job_details: JobStatusDetail[];
}

interface DownloadUrlEntry {
  file_url: string;
  file_metadata: unknown;
}

interface DownloadFilesResponse {
  job_id: string;
  download_urls: Record<string, DownloadUrlEntry>;
}

interface OcrBlock {
  text: string;
  layout_tag: string;
  reading_order: number;
}

interface OcrPageResult {
  blocks: OcrBlock[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SARVAM_BASE = 'https://api.sarvam.ai/doc-digitization/job/v1';

function getApiKey(): string {
  const key = process.env.SARVAM_API_KEY;
  if (!key || key === 'your_key_here') {
    throw new Error('SARVAM_API_KEY is not configured. Please set it in .env.local');
  }
  return key;
}

function sarvamHeaders(): HeadersInit {
  return {
    'api-subscription-key': getApiKey(),
    'Content-Type': 'application/json',
  };
}

// ─── Step 1: Create Job ─────────────────────────────────────────────────────

export async function createJob(language: SarvamLanguage): Promise<string> {
  const res = await fetch(SARVAM_BASE, {
    method: 'POST',
    headers: sarvamHeaders(),
    body: JSON.stringify({
      job_parameters: {
        language,
        output_format: 'md',
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`createJob failed (${res.status}): ${body}`);
  }

  const data: CreateJobResponse = await res.json();
  return data.job_id;
}

// ─── Step 2: Get Presigned Upload URL ───────────────────────────────────────

export async function getUploadUrl(
  jobId: string,
  fileName: string
): Promise<string> {
  const res = await fetch(`${SARVAM_BASE}/upload-files`, {
    method: 'POST',
    headers: sarvamHeaders(),
    body: JSON.stringify({
      job_id: jobId,
      files: [fileName],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`getUploadUrl failed (${res.status}): ${body}`);
  }

  const data: UploadFilesResponse = await res.json();
  // The upload_urls is keyed by filename
  const entry = data.upload_urls[fileName];
  if (!entry?.file_url) {
    throw new Error('No upload URL returned from Sarvam');
  }
  return entry.file_url;
}

// ─── Step 3: Upload File to Presigned URL ───────────────────────────────────

export async function uploadFile(
  presignedUrl: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<void> {
  // CRITICAL: Do NOT send api-subscription-key here.
  // Azure presigned URLs reject requests with extra auth headers.
  const res = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
      'x-ms-blob-type': 'BlockBlob', // Required by Azure Blob Storage
    },
    body: new Uint8Array(fileBuffer),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`uploadFile failed (${res.status}): ${body}`);
  }
}

// ─── Step 4: Start the Job ──────────────────────────────────────────────────

export async function startJob(jobId: string): Promise<void> {
  const res = await fetch(`${SARVAM_BASE}/${jobId}/start`, {
    method: 'POST',
    headers: {
      'api-subscription-key': getApiKey(),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`startJob failed (${res.status}): ${body}`);
  }
}

// ─── Step 5: Poll Until Completion ──────────────────────────────────────────

export async function pollStatus(
  jobId: string,
  intervalMs = 2000,
  maxWaitMs = 90000
): Promise<void> {
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${SARVAM_BASE}/${jobId}/status`, {
      method: 'GET',
      headers: {
        'api-subscription-key': getApiKey(),
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`pollStatus failed (${res.status}): ${body}`);
    }

    const data: JobStatusResponse = await res.json();

    if (data.job_state === 'Completed' || data.job_state === 'PartiallyCompleted') {
      return;
    }

    if (data.job_state === 'Failed') {
      throw new Error(
        `Sarvam job failed: ${data.error_message ?? 'unknown error'}`
      );
    }

    // 'Accepted', 'Pending', or 'Running' — wait and retry
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('OCR job timed out after 90 seconds');
}

// ─── Step 6: Download Results & Extract Text ────────────────────────────────

export async function downloadAndExtractText(jobId: string): Promise<string> {
  // Step A: Get the presigned download URL
  const res = await fetch(`${SARVAM_BASE}/${jobId}/download-files`, {
    method: 'POST',
    headers: {
      'api-subscription-key': getApiKey(),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`downloadFiles failed (${res.status}): ${body}`);
  }

  const data: DownloadFilesResponse = await res.json();

  // Get the first download URL (result ZIP)
  const downloadEntries = Object.values(data.download_urls);
  if (downloadEntries.length === 0 || !downloadEntries[0].file_url) {
    throw new Error('No download URL returned from Sarvam');
  }
  const zipUrl = downloadEntries[0].file_url;

  // Step B: Download the ZIP binary
  const zipRes = await fetch(zipUrl);
  if (!zipRes.ok) {
    throw new Error(`ZIP download failed (${zipRes.status})`);
  }
  const zipBuffer = Buffer.from(await zipRes.arrayBuffer());

  // Step C: Extract text from the ZIP
  // Output format is 'md', so ZIP contains markdown and/or JSON files
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  const textParts: string[] = [];

  // Sort entries by name to maintain page order
  const sortedEntries = [...entries]
    .filter((e) => !e.isDirectory)
    .sort((a, b) => a.entryName.localeCompare(b.entryName));

  for (const entry of sortedEntries) {
    try {
      const content = entry.getData().toString('utf-8').trim();
      if (!content) continue;

      if (entry.entryName.endsWith('.json')) {
        // Parse JSON blocks if present
        const parsed: OcrPageResult = JSON.parse(content);
        if (parsed.blocks && Array.isArray(parsed.blocks)) {
          const sorted = [...parsed.blocks].sort(
            (a, b) => a.reading_order - b.reading_order
          );
          const pageText = sorted
            .map((block) => block.text.trim())
            .filter(Boolean)
            .join('\n\n');
          if (pageText) textParts.push(pageText);
        }
      } else if (
        entry.entryName.endsWith('.md') ||
        entry.entryName.endsWith('.txt') ||
        entry.entryName.endsWith('.html')
      ) {
        // Markdown / text / HTML output — use content directly
        textParts.push(content);
      }
    } catch {
      console.warn(`Skipping entry: ${entry.entryName}`);
    }
  }

  if (textParts.length === 0) {
    throw new Error('NO_TEXT_DETECTED');
  }

  // Join pages with double newline
  return textParts.join('\n\n');
}

// ─── Helper: Wrap image in ZIP ──────────────────────────────────────────────

function wrapImageInZip(fileBuffer: Buffer, fileName: string): Buffer {
  const zip = new AdmZip();
  zip.addFile(fileName, fileBuffer);
  return zip.toBuffer();
}

// ─── Full Pipeline (convenience) ────────────────────────────────────────────

export async function processImage(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  language: SarvamLanguage
): Promise<string> {
  const jobId = await createJob(language);

  // Sarvam only accepts PDF or ZIP uploads.
  // For individual images (PNG, JPG, etc.), wrap them in a ZIP first.
  let uploadBuffer: Buffer;
  let uploadFileName: string;
  let uploadMimeType: string;

  if (mimeType === 'application/pdf') {
    // PDF can be uploaded directly
    uploadBuffer = fileBuffer;
    uploadFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    uploadMimeType = 'application/pdf';
  } else {
    // Wrap image in a ZIP
    uploadBuffer = wrapImageInZip(fileBuffer, fileName);
    uploadFileName = 'upload.zip';
    uploadMimeType = 'application/zip';
  }

  const uploadUrl = await getUploadUrl(jobId, uploadFileName);
  await uploadFile(uploadUrl, uploadBuffer, uploadMimeType);
  await startJob(jobId);
  await pollStatus(jobId);
  return downloadAndExtractText(jobId);
}

// ─── Chat Completions (sarvam-m) ────────────────────────────────────────────

export type StudyMode = 'summarize' | 'explain' | 'quiz' | 'translate';

const CHAT_BASE = 'https://api.sarvam.ai/v1/chat/completions';

const LANGUAGE_NAMES: Record<SarvamLanguage, string> = {
  'hi-IN': 'Hindi',
  'mr-IN': 'Marathi',
  'kn-IN': 'Kannada',
  'ta-IN': 'Tamil',
  'te-IN': 'Telugu',
  'bn-IN': 'Bengali',
  'gu-IN': 'Gujarati',
  'ml-IN': 'Malayalam',
  'pa-IN': 'Punjabi',
  'or-IN': 'Odia',
  'ur-IN': 'Urdu',
  'en-IN': 'English',
};

function getSystemPrompt(
  mode: StudyMode,
  language: SarvamLanguage,
  targetLanguage?: SarvamLanguage
): string {
  const lang = LANGUAGE_NAMES[language] || 'Hindi';
  const targetLang = targetLanguage ? LANGUAGE_NAMES[targetLanguage] || 'English' : 'English';

  switch (mode) {
    case 'summarize':
      return `You are an expert academic tutor. Summarize the following notes into clear, concise bullet points highlighting key concepts. Keep the summary in the same language as the notes (${lang}). Use simple language a student can quickly revise from. Do not add information that is not present in the notes.`;

    case 'explain':
      return `You are a patient, expert teacher. Explain the concepts in these notes in a clear, easy-to-understand way as if teaching a student. Use simple analogies and examples. Respond in the same language as the notes (${lang}). Break down complex ideas into digestible parts. Add helpful context where needed but stay focused on what the notes cover.`;

    case 'quiz':
      return `You are an exam preparation expert. Based on the following notes, generate 5-8 practice questions that test understanding of the key concepts. Include a mix of:
- Short answer questions
- True/False questions
- Fill in the blank questions
Provide the correct answers at the end. Write everything in the same language as the notes (${lang}).`;

    case 'translate':
      return `You are a professional translator specializing in Indian languages. Translate the following text into ${targetLang}. Maintain the original meaning, structure, and any technical terminology. Output only the translated text, nothing else. Do not add any commentary or notes.`;
  }
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function chatCompletion(
  messages: ChatMessage[],
  maxTokens = 4096,
  temperature = 0.3
): Promise<string> {
  const res = await fetch(CHAT_BASE, {
    method: 'POST',
    headers: sarvamHeaders(),
    body: JSON.stringify({
      model: 'sarvam-m',
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Chat completion failed (${res.status}): ${body}`);
  }

  const data: ChatCompletionResponse = await res.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('No response from Sarvam chat model');
  }

  return data.choices[0].message.content;
}

export async function studyAssist(
  text: string,
  mode: StudyMode,
  language: SarvamLanguage,
  targetLanguage?: SarvamLanguage
): Promise<string> {
  const systemPrompt = getSystemPrompt(mode, language, targetLanguage);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: text },
  ];

  return chatCompletion(messages);
}
