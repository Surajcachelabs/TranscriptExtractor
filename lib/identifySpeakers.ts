import OpenAI from 'openai';

export interface TaggedSegment {
  timestamp: string; // e.g. "[00:00 - 00:06]"
  speaker: 'CSM' | 'CLIENT' | 'UNKNOWN';
  text: string;
}

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

/**
 * Takes a formatted transcript (timestamped lines) and uses GPT to identify
 * each line's speaker as CSM or CLIENT.
 */
export async function identifySpeakers(formattedTranscript: string): Promise<TaggedSegment[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Server misconfiguration: OPENAI_API_KEY is missing.');
  }

  const lines = formattedTranscript
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  // Build numbered lines for GPT
  const numberedLines = lines.map((l, i) => `${i + 1}. ${l}`).join('\n');

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    messages: [
      { role: 'system', content: SPEAKER_ID_SYSTEM_PROMPT },
      { role: 'user', content: numberedLines },
    ],
  });

  const reply = completion.choices[0]?.message?.content ?? '';

  // Parse the JSON array from GPT's reply
  let speakerMap: Array<{ line: number; speaker: string }> = [];
  try {
    // Strip potential markdown fencing
    const cleaned = reply.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
    speakerMap = JSON.parse(cleaned);
  } catch {
    console.error('Failed to parse speaker identification JSON:', reply);
    // Fallback: return lines without speaker tags
    return lines.map((l) => {
      const tsMatch = l.match(/^\[([^\]]+)\]\s*(.*)/);
      return {
        timestamp: tsMatch ? `[${tsMatch[1]}]` : '',
        speaker: 'UNKNOWN' as const,
        text: tsMatch ? tsMatch[2] : l,
      };
    });
  }

  // Build a lookup from line number -> speaker
  const speakerByLine = new Map<number, 'CSM' | 'CLIENT' | 'UNKNOWN'>();
  for (const entry of speakerMap) {
    const speaker =
      entry.speaker === 'CSM' ? 'CSM' : entry.speaker === 'CLIENT' ? 'CLIENT' : 'UNKNOWN';
    speakerByLine.set(entry.line, speaker);
  }

  return lines.map((l, i) => {
    const tsMatch = l.match(/^\[([^\]]+)\]\s*(.*)/);
    return {
      timestamp: tsMatch ? `[${tsMatch[1]}]` : '',
      speaker: speakerByLine.get(i + 1) ?? 'UNKNOWN',
      text: tsMatch ? tsMatch[2] : l,
    };
  });
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
