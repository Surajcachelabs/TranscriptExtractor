'use client';

import { Fragment, useMemo, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';

type YesNoValue = 'Yes' | 'No' | 'N/A';
type StarValue = '1/5' | '2/5' | '3/5' | '4/5' | '5/5' | 'N/A';

interface ScoreResult {
  yesNo?: {
    greetingsAndCallClosure?: YesNoValue;
    rapportBuilding?: YesNoValue;
    summarizeTheCallAtTheEnd?: YesNoValue;
    proactiveCommunication?: YesNoValue;
    managingClientExpectation?: YesNoValue;
    followUpCommunication?: YesNoValue;
  };
  starRatings?: {
    clarityOfCommunication?: StarValue;
    professionalism?: StarValue;
    handlingDifficultSituations?: StarValue;
    empathy?: StarValue;
    problemSolving?: StarValue;
    problemOwnership?: StarValue;
    escalationHandling?: StarValue;
    toneAdaptation?: StarValue;
    activeListening?: StarValue;
    productKnowledge?: StarValue;
    avoidingSlangInformalLanguage?: StarValue;
    toneOfVoice?: StarValue;
  };
  summary?: string;
  raw?: string;
}

interface TaggedSegment {
  timestamp: string;
  speaker: 'CSM' | 'CLIENT' | 'UNKNOWN';
  text: string;
}

interface TranscribeResponse {
  file: {
    id: string;
    name: string;
    mimeType: string;
    size?: string;
  };
  transcript: any;
  formattedTranscript?: string;
  taggedSegments?: TaggedSegment[];
  score?: ScoreResult;
  error?: string;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const [driveUrl, setDriveUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranscribeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transcriptLines = useMemo(() => {
    if (!result) return [] as string[];
    if (typeof result.formattedTranscript === 'string') {
      return result.formattedTranscript
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    }
    if (Array.isArray(result.transcript?.segments)) {
      return result.transcript.segments
        .map((seg: any) => {
          const start = secondsToTimestamp(seg?.start);
          const end = secondsToTimestamp(seg?.end);
          const text = typeof seg?.text === 'string' ? seg.text.trim() : '';
          return start && end ? `[${start} - ${end}] ${text}` : text;
        })
        .filter(Boolean);
    }
    if (typeof result.transcript?.text === 'string') {
      return [result.transcript.text];
    }
    return [] as string[];
  }, [result]);

  const handleTranscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ driveUrl }),
      });

      const data = (await response.json()) as TranscribeResponse;
      if (!response.ok) {
        setError(data.error || 'Transcription failed. Please try again.');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        Checking session...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="card hero">
        <h1>Sign in to begin</h1>
        <p>Sign in with Google to transcribe videos from your Google Drive.</p>
        <button className="button-primary" onClick={() => signIn('google')}>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1>Transcribe a Drive video</h1>
        <p style={{ marginTop: 8, marginBottom: 0 }}>
          Paste a Google Drive video URL. We will verify your access, download the file, and send it to
          Whisper for transcription.
        </p>
      </div>

      <form onSubmit={handleTranscribe} className="input-row">
        <label htmlFor="drive-url" style={{ fontWeight: 600 }}>
          Google Drive video URL
        </label>
        <input
          id="drive-url"
          name="drive-url"
          type="text"
          placeholder="https://drive.google.com/file/d/FILE_ID/view"
          value={driveUrl}
          onChange={(e) => setDriveUrl(e.target.value)}
          required
        />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button type="submit" className="button-primary" disabled={loading}>
            {loading ? 'Transcribing…' : 'Transcribe'}
          </button>
          {loading && <span className="status-box">Transcribing… this might take a bit.</span>}
        </div>
      </form>

      {error && <div className="error-box">{error}</div>}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>File details</div>
          <div className="file-meta">
            <span className="meta-pill">Name: {result.file.name}</span>
            <span className="meta-pill">Mime: {result.file.mimeType}</span>
            {result.file.size && <span className="meta-pill">Size: {formatSize(result.file.size)}</span>}
            {result.transcript?.duration && (
              <span className="meta-pill">Duration: {Number(result.transcript.duration).toFixed(2)}s</span>
            )}
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>Transcript</div>
          {result.taggedSegments && result.taggedSegments.length > 0 ? (
            <div
              className="transcript"
              style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, padding: '6px 0' }}
            >
              {result.taggedSegments.map((seg: TaggedSegment, idx: number) => {
                const isCSM = seg.speaker === 'CSM';
                const isClient = seg.speaker === 'CLIENT';
                const speakerColor = isCSM ? '#60a5fa' : isClient ? '#f59e0b' : '#94a3b8';
                const speakerBg = isCSM
                  ? 'rgba(96, 165, 250, 0.12)'
                  : isClient
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(148, 163, 184, 0.08)';
                const borderLeft = `3px solid ${speakerColor}`;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      borderBottom:
                        idx === result.taggedSegments!.length - 1
                          ? 'none'
                          : '1px solid var(--divider)',
                      background: speakerBg,
                      borderLeft,
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: 13,
                        marginRight: 8,
                      }}
                    >
                      {seg.timestamp}
                    </span>
                    <span
                      style={{
                        color: speakerColor,
                        fontWeight: 700,
                        fontSize: 13,
                        marginRight: 8,
                      }}
                    >
                      {seg.speaker}:
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{seg.text}</span>
                  </div>
                );
              })}
            </div>
          ) : transcriptLines.length > 0 ? (
            <div
              className="transcript"
              style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, padding: '6px 0' }}
            >
              {transcriptLines.map((line: string, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderBottom:
                      idx === transcriptLines.length - 1 ? 'none' : '1px solid var(--divider)',
                    color: 'var(--text-primary)',
                    background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          ) : (
            <pre className="transcript">{JSON.stringify(result.transcript, null, 2)}</pre>
          )}

          {result.score && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Scorecard</div>
              {result.score.summary && <div className="status-box">{result.score.summary}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Yes / No criteria</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', rowGap: 8, columnGap: 8 }}>
                    {yesNoEntries.map(({ label, key }) => (
                      <Fragment key={key}>
                        <div style={{ color: 'var(--text-secondary)' }}>{label}</div>
                        <div style={{ textAlign: 'right' }}>
                          <ValuePill value={result.score?.yesNo?.[key]} />
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>⭐ Ratings (1-5)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', rowGap: 8, columnGap: 8 }}>
                    {starEntries.map(({ label, key }) => (
                      <Fragment key={key}>
                        <div style={{ color: 'var(--text-secondary)' }}>{label}</div>
                        <div style={{ textAlign: 'right' }}>
                          <ValuePill value={result.score?.starRatings?.[key]} />
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {result.score.raw && (
                <details className="card" style={{ padding: 12 }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Raw model reply</summary>
                  <pre className="transcript" style={{ marginTop: 8 }}>{result.score.raw}</pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatSize(size: string) {
  const num = Number(size);
  if (Number.isFinite(num)) {
    if (num > 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)} GB`;
    if (num > 1_000_000) return `${(num / 1_000_000).toFixed(2)} MB`;
    if (num > 1_000) return `${(num / 1_000).toFixed(1)} KB`;
    return `${num} bytes`;
  }
  return size;
}

function secondsToTimestamp(seconds?: number) {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds - mins * 60)
    .toString()
    .padStart(2, '0');
  return `${mins.toString().padStart(2, '0')}:${secs}`;
}

const yesNoEntries: Array<{ label: string; key: keyof NonNullable<ScoreResult['yesNo']> }> = [
  { label: 'Greetings and call closure', key: 'greetingsAndCallClosure' },
  { label: 'Rapport building', key: 'rapportBuilding' },
  { label: 'Summarize the call at the end', key: 'summarizeTheCallAtTheEnd' },
  { label: 'Proactive communication', key: 'proactiveCommunication' },
  { label: 'Managing client expectation', key: 'managingClientExpectation' },
  { label: 'Follow-up communication', key: 'followUpCommunication' },
];

const starEntries: Array<{ label: string; key: keyof NonNullable<ScoreResult['starRatings']> }> = [
  { label: 'Clarity of communication', key: 'clarityOfCommunication' },
  { label: 'Professionalism', key: 'professionalism' },
  { label: 'Handling difficult situations', key: 'handlingDifficultSituations' },
  { label: 'Empathy', key: 'empathy' },
  { label: 'Problem-solving', key: 'problemSolving' },
  { label: 'Problem ownership', key: 'problemOwnership' },
  { label: 'Escalation handling', key: 'escalationHandling' },
  { label: 'Tone adaptation', key: 'toneAdaptation' },
  { label: 'Active listening', key: 'activeListening' },
  { label: 'Product knowledge', key: 'productKnowledge' },
  { label: 'Avoiding Slang & Informal Language', key: 'avoidingSlangInformalLanguage' },
  { label: 'Tone of voice', key: 'toneOfVoice' },
];

function ValuePill({ value }: { value?: YesNoValue | StarValue }) {
  if (!value) return <span style={{ color: 'var(--text-muted)' }}>N/A</span>;
  const isPositive = value === 'Yes' || value === '5/5' || value === '4/5';
  const bg = isPositive
    ? 'rgba(34, 197, 94, 0.16)'
    : value === 'No'
      ? 'rgba(248, 113, 113, 0.18)'
      : 'rgba(148, 163, 184, 0.18)';
  const color = isPositive ? '#6ee7b7' : value === 'No' ? '#fecdd3' : '#cbd5e1';
  const border = isPositive
    ? '1px solid rgba(34, 197, 94, 0.35)'
    : value === 'No'
      ? '1px solid rgba(248, 113, 113, 0.35)'
      : '1px solid rgba(148, 163, 184, 0.35)';
  return (
    <span
      style={{
        padding: '4px 8px',
        borderRadius: 6,
        background: bg,
        color,
        border,
        fontWeight: 600,
        fontSize: 12,
        display: 'inline-block',
      }}
    >
      {value}
    </span>
  );
}
