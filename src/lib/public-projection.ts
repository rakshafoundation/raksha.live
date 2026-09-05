import type { Case, CaseEvent, CasePhoto } from '@prisma/client';

/**
 * Non-negotiable: exact GPS and reporter identity must never appear in a
 * public API response (build brief §3, §11 checklist). This is the single
 * place that shape gets produced — every public-facing route must go
 * through it rather than hand-picking fields itself.
 */
export interface PublicCase {
  caseNumber: string;
  animalName: string;
  species: Case['species'];
  injuryType: Case['injuryType'];
  area: string;
  status: Case['status'];
  outcomeType: Case['outcomeType'];
  createdAt: Date;
  closedAt: Date | null;
  photos: PublicCasePhoto[];
  timeline: PublicTimelineEvent[];
  // Public and safe: an org name is already public via the directory.
  // Exact GPS/reporter identity stay excluded above this line.
  receivingOrganisationName: string | null;
}

export interface PublicCasePhoto {
  url: string;
  isGraphic: boolean;
}

export interface PublicTimelineEvent {
  fromStatus: CaseEvent['fromStatus'];
  toStatus: CaseEvent['toStatus'];
  hasPhoto: boolean;
  note: string | null;
  createdAt: Date;
}

export function toPublicCase(
  c: Case & { photos: CasePhoto[]; events: CaseEvent[]; receivingOrganisation?: { name: string } | null }
): PublicCase {
  return {
    caseNumber: c.caseNumber,
    animalName: c.animalName,
    species: c.species,
    injuryType: c.injuryType,
    area: c.area,
    status: c.status,
    outcomeType: c.outcomeType,
    createdAt: c.createdAt,
    closedAt: c.closedAt,
    photos: c.photos.map((p) => ({ url: p.url, isGraphic: p.isGraphic })),
    receivingOrganisationName: c.receivingOrganisation?.name ?? null,
    timeline: c.events
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((e) => ({
        fromStatus: e.fromStatus,
        toStatus: e.toStatus,
        hasPhoto: Boolean(e.photoUrl),
        note: e.note,
        createdAt: e.createdAt,
      })),
  };
}
