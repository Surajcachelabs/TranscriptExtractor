import fs from 'fs/promises';
import fssync from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';
import { spawn } from 'child_process';
import { pipeline } from 'stream/promises';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

let cachedFfmpegPath: string | null = null;

export async function resolveFfmpegPath(): Promise<string> {
  if (cachedFfmpegPath) return cachedFfmpegPath;

  const candidates: string[] = [];

  if (process.env.FFMPEG_PATH) {
    candidates.push(process.env.FFMPEG_PATH);
  }

  try {
    // Prefer the module-resolved binary path
    const mod = (await import('ffmpeg-static')).default;
    if (typeof mod === 'string' && mod.length > 0) {
      candidates.push(mod);
    }
  } catch (err) {
    // ignore
  }

  // Direct fallback to node_modules path (Windows likely has ffmpeg.exe here)
  candidates.push(path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'));
  candidates.push(path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg'));

  // Last resort: system ffmpeg in PATH
  candidates.push('ffmpeg');

  for (const p of candidates) {
    if (typeof p === 'string' && p.length > 0) {
      try {
        if (fssync.existsSync(p)) {
          cachedFfmpegPath = p;
          return p;
        }
      } catch (err) {
        // ignore and continue
      }
    }
  }

  cachedFfmpegPath = 'ffmpeg';
  return cachedFfmpegPath;
}

interface ChunkTranscript {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

interface CombinedTranscript {
  text: string;
  language?: string;
  duration?: number;
  segments: ChunkTranscript['segments'];
  chunkCount: number;
}

/**
 * Converts any audio/video buffer to a 16 kHz mono WAV buffer using ffmpeg.
 * This ensures the data sent to Whisper is always in a clean, supported format.
 */
export async function extractAudioBuffer(inputBuffer: Buffer): Promise<Buffer> {
  const ffmpegPath = await resolveFfmpegPath();
  if (!ffmpegPath) {
    throw new Error('FFmpeg binary could not be resolved. Install ffmpeg or set FFMPEG_PATH.');
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'whisper-extract-'));
  const srcPath = path.join(tmpDir, 'source.bin');
  const outPath = path.join(tmpDir, 'audio.wav');

  try {
    await fs.writeFile(srcPath, inputBuffer);

    await new Promise<void>((resolve, reject) => {
      const args = [
        '-hide_banner',
        '-loglevel', 'error',
        '-y',
        '-i', srcPath,
        '-vn',           // drop video
        '-ac', '1',      // mono
        '-ar', '16000',  // 16 kHz
        '-f', 'wav',
        outPath,
      ];
      const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'inherit', 'inherit'] });
      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg audio extraction exited with code ${code}`));
      });
    });

    const output = await fs.readFile(outPath);
    if (output.byteLength < 1024) {
      throw new Error('ffmpeg produced an empty or too-small audio file; the source may have no audio track.');
    }
    return output;
  } finally {
    // Cleanup temp files
    await fs.unlink(srcPath).catch(() => undefined);
    await fs.unlink(outPath).catch(() => undefined);
    await fs.rmdir(tmpDir).catch(() => undefined);
  }
}

// At 16kHz mono PCM (~256 kbps), 300s ≈ ~9.6 MB; stays well under 24MB target.
const CHUNK_SECONDS = 300;
const MAX_BYTES = 24 * 1024 * 1024;
const MIN_CHUNK_BYTES = 2 * 1024; // ignore tiny/empty chunks

async function whisperWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? err?.response?.status;
      // Retry on transient errors (429 rate limit, 5xx server errors)
      // Do NOT retry on 400 (bad request) — the file itself is the problem
      const isRetryable = status === 429 || (typeof status === 'number' && status >= 500);
      if (!isRetryable || attempt === maxAttempts) throw err;
      const delay = 2000 * Math.pow(2, attempt - 1);
      console.warn(`Whisper API error (${status}), retrying in ${delay}ms (${attempt}/${maxAttempts})...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

/**
 * Streams a media file into ffmpeg, produces WAV chunks, transcribes each chunk with Whisper,
 * and merges transcripts with time offsets.
 */
export async function chunkAndTranscribeStream(stream: Readable, fileName: string): Promise<CombinedTranscript> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Server misconfiguration: OPENAI_API_KEY is missing.');
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'whisper-chunks-'));
  const sourcePath = path.join(tmpDir, 'source.bin');
  const pattern = path.join(tmpDir, 'chunk-%03d.wav');

  // Persist the full download to disk to avoid partial/pipe issues.
  await pipeline(stream, fssync.createWriteStream(sourcePath));

  const ffmpegPath = await resolveFfmpegPath();
  if (!ffmpegPath) {
    throw new Error('FFmpeg binary could not be resolved. Install ffmpeg or set FFMPEG_PATH.');
  }

  // Run ffmpeg via child_process to segment audio into 16k mono WAV chunks from the temp file.
  await new Promise<void>((resolve, reject) => {
    const args = [
      '-hide_banner',
      '-loglevel', 'error',
      '-i', sourcePath,
      '-vn',
      '-ac', '1',
      '-ar', '16000',
      '-f', 'segment',
      '-segment_time', String(CHUNK_SECONDS),
      '-reset_timestamps', '1',
      '-map', '0:a:0?',
      pattern,
    ];

    const proc = spawn(ffmpegPath as string, args, { stdio: ['ignore', 'inherit', 'inherit'] });

    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const files = (await fs.readdir(tmpDir))
    .filter((f) => f.startsWith('chunk-') && f.endsWith('.wav'))
    .sort();

  let offset = 0;
  const segments: CombinedTranscript['segments'] = [];
  let combinedText = '';
  let language: string | undefined;
  let totalDuration = 0;

  for (const file of files) {
    const fullPath = path.join(tmpDir, file);
    const stat = await fs.stat(fullPath);
    if (stat.size < MIN_CHUNK_BYTES) {
      continue; // skip empty/too-small chunks that can trigger Whisper errors
    }
    if (stat.size > MAX_BYTES) {
      throw new Error(
        `Chunk size ${stat.size} bytes exceeds ${MAX_BYTES} bytes after encoding. Try a smaller segment time.`
      );
    }

    const data = await fs.readFile(fullPath);

    const result = await whisperWithRetry(async () => {
      const fileLike = await toFile(data, `${fileName || 'chunk'}.wav`);
      return (await openai.audio.transcriptions.create({
        file: fileLike,
        model: 'whisper-1',
        response_format: 'verbose_json',
      })) as ChunkTranscript;
    });

    if (!language && result.language) language = result.language;
    if (typeof result.duration === 'number') {
      totalDuration += result.duration;
    }

    combinedText += (combinedText ? ' ' : '') + (result.text || '');

    if (result.segments?.length) {
      for (const seg of result.segments) {
        segments.push({
          id: segments.length,
          start: seg.start + offset,
          end: seg.end + offset,
          text: seg.text,
        });
      }
    }

    // Advance offset using chunk duration if available; otherwise use last segment end.
    if (typeof result.duration === 'number') {
      offset += result.duration;
    } else if (result.segments?.length) {
      offset = result.segments[result.segments.length - 1].end + offset;
    }
  }

  // Cleanup temp files/dir
  await Promise.all(files.map((f) => fs.unlink(path.join(tmpDir, f))));
  await fs.unlink(sourcePath).catch(() => undefined);
  await fs.rmdir(tmpDir).catch(() => undefined);

  return {
    text: combinedText,
    language,
    duration: totalDuration || offset,
    segments,
    chunkCount: files.length,
  };
}
