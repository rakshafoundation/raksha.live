import { InjuryType, Species } from '@prisma/client';

export const INJURY_LABELS: Record<InjuryType, { emoji: string; label: string }> = {
  HIT_BY_VEHICLE: { emoji: '🚗', label: 'Hit by vehicle' },
  BLEEDING_WOUND: { emoji: '🩸', label: 'Bleeding / wound' },
  CANNOT_WALK: { emoji: '🦵', label: "Can't walk" },
  UNCONSCIOUS: { emoji: '😵', label: 'Unconscious' },
  SKIN_DISEASE: { emoji: '🐾', label: 'Skin disease' },
  POISONING_SUSPECTED: { emoji: '☠️', label: 'Poisoning suspected' },
  ABANDONED_BABIES: { emoji: '🍼', label: 'Abandoned puppies/kittens' },
  STUCK_TRAPPED: { emoji: '🪤', label: 'Stuck / trapped' },
  OTHER: { emoji: '❓', label: 'Other' },
};

export const SPECIES_LABELS: Record<Species, { emoji: string; label: string }> = {
  DOG: { emoji: '🐕', label: 'Dog' },
  CAT: { emoji: '🐈', label: 'Cat' },
  BIRD: { emoji: '🐦', label: 'Bird' },
  CATTLE: { emoji: '🐄', label: 'Cattle' },
  OTHER: { emoji: '🐾', label: 'Other' },
};

export const ANIMAL_NAME_SUGGESTIONS = ['Sheru', 'Brownie', 'Rani', 'Motu', 'Kaalu', 'Chintu'];
