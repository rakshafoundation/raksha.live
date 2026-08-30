import { InjuryType } from '@prisma/client';

/**
 * Vet-written first-aid template library, keyed by injury type (build
 * brief §4a). The AI triage step SELECTS a template id from this fixed
 * set and may lightly adapt copy for the specific report — it must never
 * invent first-aid steps outside these templates.
 *
 * ⚠️ These are placeholder templates for the pilot build and must be
 * reviewed and signed off by a veterinarian before production use.
 */
export interface FirstAidTemplate {
  id: string;
  suspectedInjuryDefault: string;
  doNow: string[];
}

export const FIRST_AID_TEMPLATES: Record<InjuryType, FirstAidTemplate> = {
  HIT_BY_VEHICLE: {
    id: 'template.hit_by_vehicle.v1',
    suspectedInjuryDefault: 'Traumatic injury (possible fracture/internal injury)',
    doNow: [
      "Don't make the animal walk",
      "Don't try to straighten any limb",
      'Move only on a blanket or flat board, supporting the body',
      'Offer water, no food',
      'Keep the animal warm and calm; minimise handling',
    ],
  },
  BLEEDING_WOUND: {
    id: 'template.bleeding_wound.v1',
    suspectedInjuryDefault: 'Open wound with active bleeding',
    doNow: [
      'Apply firm, direct pressure with a clean cloth',
      "Don't remove the cloth if it soaks through — add another layer on top",
      'Keep the animal still and calm',
      'Do not apply any powder, turmeric, or home remedy to the wound',
    ],
  },
  CANNOT_WALK: {
    id: 'template.cannot_walk.v1',
    suspectedInjuryDefault: 'Mobility loss — possible spinal, limb, or neurological injury',
    doNow: [
      'Do not force the animal to stand or walk',
      'Support the body flat on a board if it must be moved',
      'Keep the head and spine as level as possible during transport',
    ],
  },
  UNCONSCIOUS: {
    id: 'template.unconscious.v1',
    suspectedInjuryDefault: 'Unresponsive — possible severe trauma, poisoning, or shock',
    doNow: [
      'Check for breathing before moving the animal',
      'Keep the airway clear; do not put hands near the mouth',
      'Move gently on a flat surface, minimise jostling',
      'Get to a vet immediately — this is time-critical',
    ],
  },
  SKIN_DISEASE: {
    id: 'template.skin_disease.v1',
    suspectedInjuryDefault: 'Skin condition (mange, fungal infection, or similar)',
    doNow: [
      'Avoid direct skin contact; wash hands after handling',
      'Do not apply any oil, ash, or home remedy to the skin',
      'Isolate from other animals if possible until seen by a vet',
    ],
  },
  POISONING_SUSPECTED: {
    id: 'template.poisoning_suspected.v1',
    suspectedInjuryDefault: 'Suspected poisoning or toxin ingestion',
    doNow: [
      'Do not induce vomiting unless a vet tells you to',
      'If safe to do so, note what may have been ingested',
      'Get to a vet immediately — this is time-critical',
    ],
  },
  ABANDONED_BABIES: {
    id: 'template.abandoned_babies.v1',
    suspectedInjuryDefault: 'Abandoned/orphaned newborn(s)',
    doNow: [
      'Keep them warm — cold is the biggest early risk, more than hunger',
      "Don't feed cow's milk; plain water only until a rescuer arrives",
      'Handle minimally and keep them together as a group',
    ],
  },
  STUCK_TRAPPED: {
    id: 'template.stuck_trapped.v1',
    suspectedInjuryDefault: 'Physically trapped or stuck',
    doNow: [
      'Do not force or pull the animal free — this can cause injury',
      'Keep the area calm and quiet; loud noise increases panic',
      'Wait for a rescuer with proper equipment if extraction looks risky',
    ],
  },
  OTHER: {
    id: 'template.other.v1',
    suspectedInjuryDefault: 'Condition requiring assessment',
    doNow: [
      'Keep the animal calm and minimise handling',
      'Do not offer food; water is fine if the animal is alert',
      'Get to a vet for a proper assessment',
    ],
  },
};
