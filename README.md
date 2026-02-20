# Handwritten Indian Language Notes OCR

Convert handwritten notes in Indian languages to editable digital text, with AI-powered study tools to help you learn.

Built with [Next.js 14](https://nextjs.org) + [Tailwind CSS](https://tailwindcss.com) + [Sarvam AI](https://www.sarvam.ai) Vision & sarvam-m.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Sarvam AI](https://img.shields.io/badge/Sarvam%20AI-Vision%20%2B%20sarvam--m-blue)
![License](https://img.shields.io/badge/License-ISC-green)

## Features

### OCR — Handwritten Notes to Text
- Upload or capture a photo of handwritten notes
- Supports **11 Indian languages**: Hindi, Marathi, Kannada, Tamil, Telugu, Bengali, Gujarati, Malayalam, Punjabi, Urdu, and English
- Drag-and-drop or click-to-upload (mobile camera supported)
- Accepts PNG, JPG, PDF, TIFF, BMP, and WebP
- Editable output with copy-to-clipboard and download-as-txt

### Study Tools — AI-Powered Learning
After text extraction, four AI study tools are available:

| Tool | What it does |
|------|-------------|
| **Summarize** | Bullet-point summary of key concepts for quick revision |
| **Explain** | Breaks down concepts with simple analogies, like a tutor |
| **Quiz Me** | Generates 5-8 practice questions with answers |
| **Translate** | Translates notes to English |

All tools respond in the same language as the notes (except Translate).

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Sarvam AI API key (free at [dashboard.sarvam.ai](https://dashboard.sarvam.ai))

### Setup

```bash
# Clone the repo
git clone https://github.com/arhambrrr/notes-OCR-Sarvam-vision.git
cd notes-OCR-Sarvam-vision

# Install dependencies
npm install

# Add your Sarvam API key
cp .env.local.example .env.local
# Edit .env.local and replace your_key_here with your actual key

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SARVAM_API_KEY` | Your Sarvam AI API key |

## How It Works

### OCR Pipeline
The app uses Sarvam's Document Intelligence API — a 5-step async pipeline that's orchestrated behind a single API call:

1. **Create Job** — Initialize an OCR job with the selected language
2. **Upload** — Send the image (wrapped in a ZIP) to a presigned Azure URL
3. **Start** — Trigger processing
4. **Poll** — Wait for completion (typically 15-45 seconds)
5. **Download** — Fetch and parse the result ZIP containing extracted text

### Study Tools
Powered by `sarvam-m`, Sarvam's multilingual chat model that natively understands 10+ Indian languages. Each tool uses a tailored system prompt to generate contextual study material from the extracted notes.

## Project Structure

```
app/
  page.tsx                 → Main UI (upload + results + study tools)
  layout.tsx               → Root layout with Noto Sans font
  api/
    ocr/route.ts           → OCR API route (Sarvam Vision pipeline)
    study/route.ts         → Study tools API route (sarvam-m chat)
components/
  UploadZone.tsx           → Drag-and-drop image upload with preview
  LanguageSelector.tsx     → Language dropdown (11 languages)
  ResultPanel.tsx          → Editable text output + copy/download
  StudyTools.tsx           → Summarize, Explain, Quiz, Translate buttons
lib/
  sarvam.ts                → Sarvam API client (OCR pipeline + chat)
```

## Supported Languages

| Language | Code | Script |
|----------|------|--------|
| Hindi | hi-IN | हिन्दी |
| Marathi | mr-IN | मराठी |
| Kannada | kn-IN | ಕನ್ನಡ |
| Tamil | ta-IN | தமிழ் |
| Telugu | te-IN | తెలుగు |
| Bengali | bn-IN | বাংলা |
| Gujarati | gu-IN | ગુજરાતી |
| Malayalam | ml-IN | മലയാളം |
| Punjabi | pa-IN | ਪੰਜਾਬੀ |
| Urdu | ur-IN | اردو |
| English | en-IN | English |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v4
- **OCR**: Sarvam Document Intelligence API
- **AI Chat**: sarvam-m (Sarvam's multilingual LLM)
- **Upload UX**: react-dropzone
- **ZIP Handling**: adm-zip (server-side)
- **Font**: Noto Sans (Devanagari + Latin subsets via next/font)
