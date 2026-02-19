import OpenAI from 'openai';

export interface TaggedSegment {
  timestamp: string; // e.g. "[00:00 - 00:06]"
  speaker: 'CSM' | 'CLIENT' | 'UNKNOWN';
  text: string;
}

export interface DiarizedUtterance {
  start: number;
  end: number;
  text: string;
  speakerId: string;
}

type ParsedLine = {
  index: number;
  timestamp: string;
  text: string;
  raw: string;
};

const SPEAKER_ID_SYSTEM_PROMPT = `You are an expert conversation analyst. Your task is to label each line of a timestamped transcript with the correct speaker tag: CSM or CLIENT.

Use the following hierarchical logic:

**Tier 1: Role Indicators (Highest Priority)**
- **Knowledge Authority**: CSM provides instructions, corrections, policy explanations, procedural guidance. CLIENT seeks clarification, asks questions, reports personal situations.
- **Directive Language**: CSM uses imperative verbs ("Make sure...", "Just get...", "You need to...", "Don't..."). CLIENT uses first-person reporting ("I got...", "I will...", "I did...", "I need...").
- **Validation Patterns**: CSM confirms, corrects, or validates ("Yes", "Correct", "That's right", "No, you should..."). CLIENT seeks validation ("right?", "okay?", "is that correct?").

**Tier 2: Conversational Patterns**
- **Response Length & Structure**: CSM gives shorter, direct responses; concise guidance. CLIENT gives longer explanations with contextual details; repetitive clarifications.
- **Organizational Reference**: CLIENT refers to CSM's organization as external ("you guys", "your team", "your company"). CSM refers to organization as internal ("we", "our system", "our policy").
- **Information Flow**: CLIENT provides status updates, describes problems, shares progress. CSM responds to situations, provides solutions, sets expectations.

**Tier 3: Linguistic Markers**
- **Uncertainty vs. Certainty**: CLIENT uses hedging language ("I think...", "maybe...", "probably...", "like..."). CSM uses definitive statements ("You can...", "It will...", "That is...").
- **Confirmation Seeking**: CLIENT uses frequent tag questions and confirmation requests ("right?", "correct?", "okay?"). CSM gives confirmations rather than seeks them.
- **Professional vs. Personal Tone**: CSM uses professional, measured, procedural language. CLIENT uses more casual, conversational, sometimes fragmented speech.

**Tier 4: Contextual Clues**
- **Topic Initiation**: CLIENT usually introduces new topics, problems, or updates. CSM usually responds and guides toward resolution.
- **Problem-Solution Dynamic**: CLIENT presents situations, concerns, or questions. CSM offers solutions, next steps, or clarifications.
- **Power Dynamic**: CLIENT seeks permission, approval, or guidance. CSM grants approval, sets boundaries, provides authorization.

**Decision Process:**
1. Analyze using Tier 1 indicators first.
2. If unclear, move to Tier 2 patterns.
3. Use Tier 3 and 4 as supporting evidence.
4. Tag the first clearly identifiable speaker.
5. Use conversational flow (back-and-forth pattern) to tag remaining segments.
6. Cross-verify tags by checking if the pattern remains consistent throughout.
7. If a segment is truly ambiguous, tag as UNKNOWN.

**Output Format:**
Return ONLY a valid JSON array. Each element must have:
- "line": the 1-based line number
- "speaker": "CSM" or "CLIENT" (or "UNKNOWN" if truly ambiguous)

Example:
[{"line":1,"speaker":"CLIENT"},{"line":2,"speaker":"CSM"},{"line":3,"speaker":"CLIENT"}]

Do NOT include any other text, explanation, or markdown. Only the JSON array.`;

const DIARIZATION_SYSTEM_PROMPT = `You are a conversation diarization assistant working from timestamped transcript text.

Goal:
- Assign each line to a stable speaker identity: "S1", "S2", or "UNKNOWN".
- Keep speaker identity consistent across the full conversation.

Rules:
- Prefer only two speakers unless evidence strongly suggests otherwise.
- Do NOT assign CSM/CLIENT roles yet.
- If a line is truly ambiguous, use "UNKNOWN".
- Use context from surrounding turns to maintain continuity.

Output:
Return ONLY a valid JSON array of objects:
[{"line":1,"speakerId":"S1"},{"line":2,"speakerId":"S2"}]

No prose, no markdown.`;

const ROLE_MAP_SYSTEM_PROMPT = `You are a QA role-mapping assistant.

Given stable speaker IDs (S1, S2) and each speaker's sampled utterances, map each speaker ID to one role: CSM, CLIENT, or UNKNOWN.

Rules:
- Use conversation authority, guidance language, and question/answer dynamics.
- Exactly one of S1/S2 can be CSM and the other CLIENT when evidence is sufficient.
- If evidence is insufficient for a speaker, assign UNKNOWN.

Output:
Return ONLY JSON object with keys for provided IDs.
Example: {"S1":"CLIENT","S2":"CSM"}

No prose, no markdown.`;

function parseTranscriptLines(formattedTranscript: string): ParsedLine[] {
  const rawLines = formattedTranscript
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return rawLines.map((line, index) => {
    const tsMatch = line.match(/^\[([^\]]+)\]\s*(.*)/);
    return {
      index: index + 1,
      timestamp: tsMatch ? `[${tsMatch[1]}]` : '',
      text: tsMatch ? tsMatch[2] : line,
      raw: line,
    };
  });
}

function stripJsonFences(input: string): string {
  return input.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
}

function normalizeRole(value: unknown): 'CSM' | 'CLIENT' | 'UNKNOWN' {
  if (value === 'CSM') return 'CSM';
  if (value === 'CLIENT') return 'CLIENT';
  return 'UNKNOWN';
}

function normalizeSpeakerId(value: unknown): 'S1' | 'S2' | 'UNKNOWN' {
  if (typeof value !== 'string') return 'UNKNOWN';
  const normalized = value.trim().toUpperCase();
  if (normalized === 'S1' || normalized === 'SPEAKER_1' || normalized === 'SPEAKER1') return 'S1';
  if (normalized === 'S2' || normalized === 'SPEAKER_2' || normalized === 'SPEAKER2') return 'S2';
  return 'UNKNOWN';
}

function secondsToTimestamp(seconds?: number) {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds - mins * 60)
    .toString()
    .padStart(2, '0');
  return `${mins.toString().padStart(2, '0')}:${secs}`;
}

function canonicalSpeakerId(value: string, remap: Map<string, 'S1' | 'S2'>): 'S1' | 'S2' | 'UNKNOWN' {
  const normalized = normalizeSpeakerId(value);
  if (normalized !== 'UNKNOWN') return normalized;

  const raw = value.trim();
  if (!raw) return 'UNKNOWN';

  if (remap.has(raw)) {
    return remap.get(raw)!;
  }

  if (remap.size >= 2) return 'UNKNOWN';
  const assigned = remap.size === 0 ? 'S1' : 'S2';
  remap.set(raw, assigned);
  return assigned;
}

async function mapSpeakerIdsToRoles(
  linesBySpeaker: { S1: string[]; S2: string[] },
  openai: OpenAI
): Promise<Record<'S1' | 'S2', 'CSM' | 'CLIENT' | 'UNKNOWN'>> {
  const roleMapInput = {
    speakers: [
      {
        speakerId: 'S1',
        sampleUtterances: linesBySpeaker.S1,
        sampleCount: linesBySpeaker.S1.length,
      },
      {
        speakerId: 'S2',
        sampleUtterances: linesBySpeaker.S2,
        sampleCount: linesBySpeaker.S2.length,
      },
    ],
  };

  const roleCompletion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      { role: 'system', content: ROLE_MAP_SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(roleMapInput) },
    ],
  });

  const roleReply = roleCompletion.choices[0]?.message?.content ?? '';
  const roleParsed = JSON.parse(stripJsonFences(roleReply)) as Record<string, unknown>;

  return {
    S1: normalizeRole(roleParsed.S1),
    S2: normalizeRole(roleParsed.S2),
  };
}

async function identifySpeakersDirect(lines: ParsedLine[], openai: OpenAI): Promise<TaggedSegment[]> {
  const numberedLines = lines.map((l) => `${l.index}. ${l.raw}`).join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    messages: [
      { role: 'system', content: SPEAKER_ID_SYSTEM_PROMPT },
      { role: 'user', content: numberedLines },
    ],
  });

  const reply = completion.choices[0]?.message?.content ?? '';
  const cleaned = stripJsonFences(reply);
  const parsed = JSON.parse(cleaned) as Array<{ line: number; speaker: string }>;

  const speakerByLine = new Map<number, 'CSM' | 'CLIENT' | 'UNKNOWN'>();
  for (const entry of parsed) {
    speakerByLine.set(entry.line, normalizeRole(entry.speaker));
  }

  return lines.map((line) => ({
    timestamp: line.timestamp,
    speaker: speakerByLine.get(line.index) ?? 'UNKNOWN',
    text: line.text,
  }));
}

async function identifySpeakersStable(lines: ParsedLine[], openai: OpenAI): Promise<TaggedSegment[]> {
  const numberedLines = lines.map((l) => `${l.index}. ${l.raw}`).join('\n');

  const diarizationCompletion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      { role: 'system', content: DIARIZATION_SYSTEM_PROMPT },
      { role: 'user', content: numberedLines },
    ],
  });

  const diarizationReply = diarizationCompletion.choices[0]?.message?.content ?? '';
  const diarizationParsed = JSON.parse(stripJsonFences(diarizationReply)) as Array<{
    line: number;
    speakerId: string;
  }>;

  const speakerIdByLine = new Map<number, 'S1' | 'S2' | 'UNKNOWN'>();
  for (const entry of diarizationParsed) {
    speakerIdByLine.set(entry.line, normalizeSpeakerId(entry.speakerId));
  }

  const groupedBySpeaker = {
    S1: [] as string[],
    S2: [] as string[],
  };

  for (const line of lines) {
    const speakerId = speakerIdByLine.get(line.index) ?? 'UNKNOWN';
    if (speakerId === 'S1' || speakerId === 'S2') {
      if (groupedBySpeaker[speakerId].length < 40) {
        groupedBySpeaker[speakerId].push(line.text);
      }
    }
  }

  const roleBySpeakerId = await mapSpeakerIdsToRoles(groupedBySpeaker, openai);

  return lines.map((line) => {
    const speakerId = speakerIdByLine.get(line.index) ?? 'UNKNOWN';
    const speakerRole = speakerId === 'UNKNOWN' ? 'UNKNOWN' : roleBySpeakerId[speakerId];
    return {
      timestamp: line.timestamp,
      speaker: speakerRole,
      text: line.text,
    };
  });
}

export async function identifySpeakersFromDiarizedUtterances(
  utterances: DiarizedUtterance[]
): Promise<TaggedSegment[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Server misconfiguration: OPENAI_API_KEY is missing.');
  }

  if (!Array.isArray(utterances) || utterances.length === 0) {
    return [];
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const speakerRemap = new Map<string, 'S1' | 'S2'>();
  const groupedBySpeaker = {
    S1: [] as string[],
    S2: [] as string[],
  };

  const utterancesWithCanonical = utterances.map((utt) => {
    const canonicalId = canonicalSpeakerId(utt.speakerId, speakerRemap);
    if ((canonicalId === 'S1' || canonicalId === 'S2') && groupedBySpeaker[canonicalId].length < 50) {
      groupedBySpeaker[canonicalId].push(utt.text);
    }
    return { ...utt, canonicalId };
  });

  const roleBySpeakerId = await mapSpeakerIdsToRoles(groupedBySpeaker, openai);

  return utterancesWithCanonical.map((utt) => {
    const speaker = utt.canonicalId === 'UNKNOWN' ? 'UNKNOWN' : roleBySpeakerId[utt.canonicalId];
    const start = secondsToTimestamp(utt.start);
    const end = secondsToTimestamp(utt.end);
    return {
      timestamp: `[${start} - ${end}]`,
      speaker,
      text: utt.text,
    };
  });
}

/**
 * Takes a formatted transcript (timestamped lines) and uses GPT to identify
 * each line's speaker as CSM or CLIENT.
 */
export async function identifySpeakers(formattedTranscript: string): Promise<TaggedSegment[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Server misconfiguration: OPENAI_API_KEY is missing.');
  }

  const lines = parseTranscriptLines(formattedTranscript);

  if (lines.length === 0) return [];

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    return await identifySpeakersStable(lines, openai);
  } catch (stableErr) {
    console.error('Stable speaker-role pipeline failed, falling back to direct classifier:', stableErr);
    try {
      return await identifySpeakersDirect(lines, openai);
    } catch (directErr) {
      console.error('Direct speaker identification failed:', directErr);
      return lines.map((line) => ({
        timestamp: line.timestamp,
        speaker: 'UNKNOWN',
        text: line.text,
      }));
    }
  }
}

/**
 * Formats tagged segments into a string with speaker labels.
 * e.g. "[00:00 - 00:06] CSM: So I actually got..."
 */
export function formatTaggedTranscript(segments: TaggedSegment[]): string {
  return segments
    .map((seg) => {
      const prefix = seg.timestamp ? `${seg.timestamp} ` : '';
      return `${prefix}${seg.speaker}: ${seg.text}`;
    })
    .join('\n');
}
