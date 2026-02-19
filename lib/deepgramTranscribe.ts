import { DiarizedUtterance } from './identifySpeakers';

interface DeepgramUtterance {
  start?: number;
  end?: number;
  transcript?: string;
  speaker?: number;
}

interface DeepgramResponse {
  results?: {
    utterances?: DeepgramUtterance[];
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
      }>;
    }>;
  };
}

function normalizeMimeType(mimeType?: string): string {
  if (!mimeType || typeof mimeType !== 'string') return 'audio/wav';
  return mimeType;
}

export async function transcribeAndDiarizeBuffer(
  buffer: Buffer,
  mimeType?: string
): Promise<{ utterances: DiarizedUtterance[]; transcriptText: string }> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('Server misconfiguration: DEEPGRAM_API_KEY is missing.');
  }

  const query = new URLSearchParams({
    model: 'nova-2',
    smart_format: 'true',
    punctuate: 'true',
    diarize: 'true',
    utterances: 'true',
  });

  const response = await fetch(`https://api.deepgram.com/v1/listen?${query.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': normalizeMimeType(mimeType),
    },
    body: new Uint8Array(buffer),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Deepgram diarization failed (${response.status}): ${details || 'Unknown error'}`);
  }

  const data = (await response.json()) as DeepgramResponse;

  const utterances: DiarizedUtterance[] = (data.results?.utterances ?? [])
    .filter((utt) => typeof utt.transcript === 'string' && utt.transcript.trim().length > 0)
    .map((utt) => ({
      start: typeof utt.start === 'number' ? utt.start : 0,
      end: typeof utt.end === 'number' ? utt.end : typeof utt.start === 'number' ? utt.start : 0,
      text: (utt.transcript ?? '').trim(),
      speakerId:
        typeof utt.speaker === 'number' ? `SPEAKER_${utt.speaker + 1}` : 'UNKNOWN',
    }));

  const transcriptText =
    data.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ||
    utterances.map((utt) => utt.text).join(' ').trim();

  return {
    utterances,
    transcriptText,
  };
}
