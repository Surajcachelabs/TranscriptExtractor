import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '../auth/[...nextauth]/authOptions';
import OpenAI from 'openai';
import {
  downloadDriveFile,
  downloadDriveFileStream,
  extractFileIdFromDriveUrl,
  getDriveFileMetadata,
  DriveApiError,
} from '@/lib/googleDrive';
import { transcribeVideoBuffer } from '@/lib/transcribe';
import { chunkAndTranscribeStream } from '@/lib/chunkTranscribe';
import { scoreTranscript } from '@/lib/scoreTranscript';
import {
  identifySpeakers,
  identifySpeakersFromDiarizedUtterances,
  formatTaggedTranscript,
  TaggedSegment,
} from '@/lib/identifySpeakers';
import { transcribeAndDiarizeBuffer } from '@/lib/deepgramTranscribe';
import path from 'path';

export const runtime = 'nodejs';

function sanitizeToEnglishAscii(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/[^\u0009\u0020-\u007E]/g, '').replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .trim();
}

async function enforceEnglishTranscript(text: string): Promise<string> {
  const input = typeof text === 'string' ? text.trim() : '';
  if (!input) return '';

  if (!process.env.OPENAI_API_KEY) {
    return sanitizeToEnglishAscii(input);
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: [
            'You convert transcripts to strictly English output.',
            'Rules:',
            '- Translate all non-English content into natural English.',
            '- Keep the same line order and line count.',
            '- Preserve timestamps exactly, e.g. [00:01 - 00:05].',
            '- Preserve speaker labels exactly when present (CSM:, CLIENT:, UNKNOWN:).',
            '- Return plain text only. No markdown or commentary.',
          ].join('\n'),
        },
        { role: 'user', content: input },
      ],
    });

    const translated = completion.choices[0]?.message?.content?.trim() || input;
    const sanitized = sanitizeToEnglishAscii(translated);
    return sanitized || sanitizeToEnglishAscii(input);
  } catch (err) {
    console.error('English normalization failed; returning sanitized transcript', (err as Error).message);
    return sanitizeToEnglishAscii(input);
  }
}

function parseTaggedTranscriptToSegments(
  transcript: string
): Array<{ timestamp: string; speaker: 'CSM' | 'CLIENT' | 'UNKNOWN'; text: string }> {
  if (!transcript) return [];

  return transcript
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(?:\[(.*?)\]\s*)?(CSM|CLIENT|UNKNOWN):\s*(.*)$/);
      if (!match) {
        return {
          timestamp: '',
          speaker: 'UNKNOWN' as const,
          text: line,
        };
      }

      const [, rawTimestamp, rawSpeaker, rawText] = match;
      return {
        timestamp: rawTimestamp ? `[${rawTimestamp}]` : '',
        speaker: rawSpeaker as 'CSM' | 'CLIENT' | 'UNKNOWN',
        text: (rawText || '').trim(),
      };
    });
}

function secondsToTimestamp(seconds?: number) {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds - mins * 60)
    .toString()
    .padStart(2, '0');
  return `${mins.toString().padStart(2, '0')}:${secs}`;
}

function formatTranscriptText(transcript: any): string {
  const segments = Array.isArray(transcript?.segments) ? transcript.segments : [];
  if (segments.length > 0) {
    return segments
      .map((seg: any) => {
        const start = secondsToTimestamp(seg?.start);
        const end = secondsToTimestamp(seg?.end);
        const text = typeof seg?.text === 'string' ? seg.text.trim() : '';
        return start && end ? `[${start} - ${end}] ${text}` : text;
      })
      .filter(Boolean)
      .join('\n');
  }

  if (typeof transcript?.text === 'string') {
    return transcript.text;
  }

  return JSON.stringify(transcript);
}

const SUPPORTED_EXTENSIONS = new Set([
  '.flac',
  '.m4a',
  '.mp3',
  '.mp4',
  '.mpeg',
  '.mpga',
  '.oga',
  '.ogg',
  '.wav',
  '.webm',
]);

const SUPPORTED_MIME_TYPES = new Set([
  'audio/flac',
  'audio/m4a',
  'audio/mp3',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/oga',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'video/mp4',
  'video/mpeg',
  'video/webm',
]);

function isWhisperSupportedFile(name?: string, mimeType?: string): boolean {
  if (mimeType && SUPPORTED_MIME_TYPES.has(mimeType.toLowerCase())) return true;
  if (!name) return false;
  const ext = path.extname(name).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext);
}

export async function POST(req: Request) {
  try {
    const body = await req
      .json()
      .catch((err) => {
        console.error('Failed to parse request JSON', err);
        return null;
      });
    const driveUrl = body?.driveUrl as string | undefined;

    if (!driveUrl || typeof driveUrl !== 'string') {
      return NextResponse.json({ error: 'driveUrl is required.' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const accessToken = session?.accessToken as string | undefined;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated. Please sign in with Google.' }, { status: 401 });
    }

    const fileId = extractFileIdFromDriveUrl(driveUrl);
    if (!fileId) {
      return NextResponse.json(
        { error: 'Could not extract fileId from Google Drive URL.' },
        { status: 400 }
      );
    }

    let metadata;
    try {
      metadata = await getDriveFileMetadata(fileId, accessToken);
    } catch (err) {
      const status = (err as DriveApiError).status;
      const details = (err as DriveApiError).body;
      console.error('Metadata fetch failed', { status, details, fileId });
      if (status === 403 || status === 404) {
        return NextResponse.json(
          { error: 'You do not have access to this file or it does not exist.', details },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to read metadata from Google Drive. Please try again.', details },
        { status: 500 }
      );
    }

    if (!metadata.mimeType?.startsWith('video/')) {
      return NextResponse.json(
        { error: 'The provided file is not a video.' },
        { status: 400 }
      );
    }

    const maxBytes = 25 * 1024 * 1024;
    const declaredSize = metadata.size ? Number(metadata.size) : undefined;
    const isSupported = isWhisperSupportedFile(metadata.name, metadata.mimeType);
    const shouldChunk = !isSupported || (declaredSize ? declaredSize > maxBytes : true);

    let transcript;
    let downloadedBuffer: Buffer | undefined;
    let acousticTaggedSegments: TaggedSegment[] | undefined;

    if (!shouldChunk) {
      try {
        downloadedBuffer = await downloadDriveFile(fileId, accessToken);
      } catch (err) {
        const status = (err as DriveApiError).status;
        const details = (err as DriveApiError).body;
        console.error('Download failed', { status, details, fileId });
        if (status === 403 || status === 404) {
          return NextResponse.json(
            { error: 'You do not have access to this file or it does not exist.', details },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { error: 'Failed to download the file from Google Drive.', details },
          { status: 500 }
        );
      }

      if (process.env.DEEPGRAM_API_KEY && downloadedBuffer) {
        try {
          const deepgramResult = await transcribeAndDiarizeBuffer(
            downloadedBuffer,
            metadata.mimeType ?? undefined
          );
          acousticTaggedSegments = await identifySpeakersFromDiarizedUtterances(
            deepgramResult.utterances
          );
        } catch (err) {
          console.error('Acoustic diarization failed; falling back to text classifier', {
            error: (err as Error).message,
          });
        }
      }

      try {
        transcript = await transcribeVideoBuffer(downloadedBuffer, metadata.name ?? 'video');
      } catch (err) {
        const anyErr = err as any;
        const message = anyErr?.message || 'Transcription failed, please try again.';
        const status = typeof anyErr?.status === 'number' ? anyErr.status : 500;
        const details = anyErr?.error ?? anyErr?.response ?? undefined;
        console.error('Transcription failed', { status, message, details });
        return NextResponse.json({ error: message, details }, { status });
      }
    } else {
      let stream: import('stream').Readable;
      try {
        stream = await downloadDriveFileStream(fileId, accessToken);
      } catch (err) {
        const status = (err as DriveApiError).status;
        const details = (err as DriveApiError).body;
        console.error('Stream download failed', { status, details, fileId, error: (err as Error).message });
        if (status === 403 || status === 404) {
          return NextResponse.json(
            { error: 'You do not have access to this file or it does not exist.', details },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { error: 'Failed to download the file from Google Drive.', details },
          { status: 500 }
        );
      }

      try {
        transcript = await chunkAndTranscribeStream(stream, metadata.name ?? 'video');
      } catch (err) {
        const anyErr = err as any;
        const message = anyErr?.message || 'Chunked transcription failed.';
        const status = typeof anyErr?.status === 'number' ? anyErr.status : 500;
        const details = anyErr?.error ?? anyErr?.response ?? undefined;
        console.error('Chunked transcription failed', { status, message, details });
        return NextResponse.json({ error: message, details }, { status });
      }
    }
    const baseFormattedTranscript = formatTranscriptText(transcript);

    // Identify speakers (CSM vs CLIENT) using GPT
    let taggedSegments: TaggedSegment[] | undefined;
    let taggedTranscript: string | undefined;
    if (acousticTaggedSegments?.length) {
      taggedSegments = acousticTaggedSegments;
      taggedTranscript = formatTaggedTranscript(acousticTaggedSegments);
    } else {
      try {
        taggedSegments = await identifySpeakers(baseFormattedTranscript);
        taggedTranscript = formatTaggedTranscript(taggedSegments);
      } catch (err) {
        console.error('Speaker identification failed', (err as Error).message);
        taggedSegments = undefined;
        taggedTranscript = undefined;
      }
    }

    // Score using the speaker-tagged transcript if available, otherwise plain
    const transcriptForScoringRaw = taggedTranscript || baseFormattedTranscript;
    const englishTranscript = await enforceEnglishTranscript(transcriptForScoringRaw);

    const transcriptForScoring = englishTranscript || transcriptForScoringRaw;
    let responseTaggedSegments = taggedSegments;

    if (taggedSegments?.length) {
      const englishTaggedSegments = parseTaggedTranscriptToSegments(transcriptForScoring);
      if (englishTaggedSegments.length === taggedSegments.length) {
        responseTaggedSegments = taggedSegments.map((seg, idx) => ({
          ...seg,
          timestamp: englishTaggedSegments[idx]?.timestamp || seg.timestamp,
          speaker: englishTaggedSegments[idx]?.speaker || seg.speaker,
          text: englishTaggedSegments[idx]?.text || seg.text,
        }));
      }
    }

    let score;
    try {
      score = await scoreTranscript(transcriptForScoring);
    } catch (err) {
      console.error('Scoring failed', (err as Error).message);
      score = undefined;
    }

    return NextResponse.json({
      file: metadata,
      transcript,
      formattedTranscript: transcriptForScoring,
      taggedSegments: responseTaggedSegments,
      score,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
