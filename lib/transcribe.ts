import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

/**
 * Sends a video/audio buffer to OpenAI Whisper and returns the verbose JSON transcript.
 */
export async function transcribeVideoBuffer(buffer: Buffer, fileName: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Server misconfiguration: OPENAI_API_KEY is missing.');
  }

  const maxBytes = 25 * 1024 * 1024; // Whisper limit ~25MB
  if (buffer.byteLength > maxBytes) {
    const mb = (buffer.byteLength / 1024 / 1024).toFixed(2);
    throw new Error(`File too large (${mb} MB). Whisper supports up to ~25 MB.`);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Retry on transient errors (429 rate limit, 5xx server errors)
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const file = await toFile(buffer, fileName || 'video.mp4');
      const transcript = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        response_format: 'verbose_json',
      });
      return transcript;
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status;
      const isRetryable = status === 429 || (typeof status === 'number' && status >= 500);
      if (!isRetryable || attempt === 3) throw err;
      const delay = 2000 * Math.pow(2, attempt - 1);
      console.warn(`Whisper API error (${status}), retrying in ${delay}ms (${attempt}/3)...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Transcription failed after all retry attempts');
}
