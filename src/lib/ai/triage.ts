import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { InjuryType, Species, Urgency } from '@prisma/client';
import { FIRST_AID_TEMPLATES } from './templates';

/**
 * AI photo triage (build brief §4a). The model only ever *selects and
 * lightly adapts* a vet-written template — it must not freestyle medical
 * advice. Every result carries the "not a diagnosis" disclaimer, and any
 * low-confidence or failed call defaults to the safe fallback: treat as
 * urgent, get to a vet.
 */

export interface TriageInput {
  species: Species;
  injuryType: InjuryType;
  photo?: { base64: string; mimeType: string } | null;
}

export interface TriageResult {
  suspectedInjury: string;
  urgency: Urgency;
  templateId: string;
  doNow: string[];
  confidence: number; // 0..1
  disclaimer: 'Triage guidance, not a diagnosis.';
}

const ModelOutputSchema = z.object({
  suspected_injury: z.string(),
  urgency: z.enum(['CRITICAL', 'URGENT', 'NON_URGENT']),
  template_id: z.string(),
  confidence: z.number().min(0).max(1),
});

const DISCLAIMER = 'Triage guidance, not a diagnosis.' as const;

function safeFallback(injuryType: InjuryType): TriageResult {
  const template = FIRST_AID_TEMPLATES[injuryType];
  return {
    suspectedInjury: template.suspectedInjuryDefault,
    urgency: Urgency.URGENT, // low-confidence/unavailable default per build brief §4a
    templateId: template.id,
    doNow: template.doNow,
    confidence: 0,
    disclaimer: DISCLAIMER,
  };
}

export async function runTriage(input: TriageInput): Promise<TriageResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return safeFallback(input.injuryType);
  }

  try {
    const client = new Anthropic({ apiKey });
    const allowedTemplateIds = Object.values(FIRST_AID_TEMPLATES).map((t) => t.id);

    const content: Anthropic.MessageCreateParams['messages'][number]['content'] = [
      {
        type: 'text',
        text: [
          'You are a triage assistant for a street-animal rescue platform in Mumbai.',
          `Species: ${input.species}. Reporter-selected injury type: ${input.injuryType}.`,
          'Look at the photo (if provided) and the injury type, then respond with ONLY a JSON object:',
          '{"suspected_injury": string, "urgency": "CRITICAL"|"URGENT"|"NON_URGENT", "template_id": string, "confidence": number 0-1}',
          `template_id MUST be one of: ${allowedTemplateIds.join(', ')}.`,
          'You are selecting a first-aid template, not writing medical advice yourself.',
          'If you are unsure, set urgency to "URGENT" and confidence low rather than guessing "NON_URGENT".',
        ].join('\n'),
      },
    ];

    if (input.photo) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: input.photo.mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
          data: input.photo.base64,
        },
      });
    }

    const response = await client.messages.create({
      model: process.env.ANTHROPIC_TRIAGE_MODEL || 'claude-sonnet-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') return safeFallback(input.injuryType);

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return safeFallback(input.injuryType);

    const parsed = ModelOutputSchema.parse(JSON.parse(jsonMatch[0]));
    const template = Object.values(FIRST_AID_TEMPLATES).find((t) => t.id === parsed.template_id)
      ?? FIRST_AID_TEMPLATES[input.injuryType];

    // Low confidence defaults to the safe posture regardless of what the
    // model guessed for urgency.
    const urgency = parsed.confidence < 0.4 ? Urgency.URGENT : (parsed.urgency as Urgency);

    return {
      suspectedInjury: parsed.suspected_injury,
      urgency,
      templateId: template.id,
      doNow: template.doNow,
      confidence: parsed.confidence,
      disclaimer: DISCLAIMER,
    };
  } catch {
    return safeFallback(input.injuryType);
  }
}
