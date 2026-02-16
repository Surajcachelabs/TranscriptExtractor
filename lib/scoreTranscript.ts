import OpenAI from 'openai';

type YesNoValue = 'Yes' | 'No' | 'N/A';
type StarValue = '1/5' | '2/5' | '3/5' | '4/5' | '5/5' | 'N/A';

export interface ScoreResult {
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

const MODEL_ID = 'ft:gpt-4o-mini-2024-07-18:cache-labs-llc:csm-audit:Cich3dyr';

/**
 * Sends transcript text to the fine-tuned model and expects a JSON reply
 * shaped around yes/no checks and 1-5 star ratings.
 */
export async function scoreTranscript(transcriptText: string): Promise<ScoreResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Server misconfiguration: OPENAI_API_KEY is missing.');
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: MODEL_ID,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          [
            'You are a contact-center QA grader.',
            'Given a transcript, respond ONLY with JSON using these exact keys:',
            '{',
            '  "yes_no": {',
            '    "greetings_and_call_closure": "Yes|No|N/A",',
            '    "rapport_building": "Yes|No|N/A",',
            '    "summarize_the_call_at_the_end": "Yes|No|N/A",',
            '    "proactive_communication": "Yes|No|N/A",',
            '    "managing_client_expectation": "Yes|No|N/A",',
            '    "follow_up_communication": "Yes|No|N/A"',
            '  },',
            '  "star_ratings": {',
            '    "clarity_of_communication": "1/5-5/5 or N/A",',
            '    "professionalism": "1/5-5/5 or N/A",',
            '    "handling_difficult_situations": "1/5-5/5 or N/A",',
            '    "empathy": "1/5-5/5 or N/A",',
            '    "problem_solving": "1/5-5/5 or N/A",',
            '    "problem_ownership": "1/5-5/5 or N/A",',
            '    "escalation_handling": "1/5-5/5 or N/A",',
            '    "tone_adaptation": "1/5-5/5 or N/A",',
            '    "active_listening": "1/5-5/5 or N/A",',
            '    "product_knowledge": "1/5-5/5 or N/A",',
            '    "avoiding_slang_informal_language": "1/5-5/5 or N/A",',
            '    "tone_of_voice": "1/5-5/5 or N/A"',
            '  },',
            '  "summary": "1-2 sentence justification"',
            '}',
            'Rules:',
            '- Only output JSON, no prose.',
            '- Use the exact key names above.',
            '- If insufficient evidence, use "N/A".',
          ].join('\n'),
      },
      { role: 'user', content: transcriptText },
    ],
  });

  const reply = completion.choices[0]?.message?.content;
  if (!reply) {
    return { raw: undefined };
  }

  try {
    const parsed = JSON.parse(reply);
    const yesNoRaw = parsed?.yes_no ?? {};
    const starsRaw = parsed?.star_ratings ?? {};

    const toYesNo = (val: unknown): YesNoValue | undefined => {
      if (typeof val !== 'string') return undefined;
      const norm = val.trim().toLowerCase();
      if (norm === 'yes') return 'Yes';
      if (norm === 'no') return 'No';
      if (norm === 'n/a' || norm === 'na') return 'N/A';
      return undefined;
    };

    const toStar = (val: unknown): StarValue | undefined => {
      if (typeof val !== 'string') return undefined;
      const norm = val.trim().toLowerCase();
      if (norm === 'n/a' || norm === 'na') return 'N/A';
      if (['1/5', '2/5', '3/5', '4/5', '5/5'].includes(norm)) {
        return norm.toUpperCase() as StarValue;
      }
      return undefined;
    };

    return {
      yesNo: {
        greetingsAndCallClosure: toYesNo(yesNoRaw?.greetings_and_call_closure),
        rapportBuilding: toYesNo(yesNoRaw?.rapport_building),
        summarizeTheCallAtTheEnd: toYesNo(yesNoRaw?.summarize_the_call_at_the_end),
        proactiveCommunication: toYesNo(yesNoRaw?.proactive_communication),
        managingClientExpectation: toYesNo(yesNoRaw?.managing_client_expectation),
        followUpCommunication: toYesNo(yesNoRaw?.follow_up_communication),
      },
      starRatings: {
        clarityOfCommunication: toStar(starsRaw?.clarity_of_communication),
        professionalism: toStar(starsRaw?.professionalism),
        handlingDifficultSituations: toStar(starsRaw?.handling_difficult_situations),
        empathy: toStar(starsRaw?.empathy),
        problemSolving: toStar(starsRaw?.problem_solving),
        problemOwnership: toStar(starsRaw?.problem_ownership),
        escalationHandling: toStar(starsRaw?.escalation_handling),
        toneAdaptation: toStar(starsRaw?.tone_adaptation),
        activeListening: toStar(starsRaw?.active_listening),
        productKnowledge: toStar(starsRaw?.product_knowledge),
        avoidingSlangInformalLanguage: toStar(starsRaw?.avoiding_slang_informal_language),
        toneOfVoice: toStar(starsRaw?.tone_of_voice),
      },
      summary: typeof parsed?.summary === 'string' ? parsed.summary : undefined,
      raw: reply,
    };
  } catch (_err) {
    // If not valid JSON, return raw
    return { raw: reply };
  }
}