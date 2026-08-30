import { Species } from '@prisma/client';
import { distanceMeters, type LatLng } from './geo';

/**
 * Layer 1 duplicate gate (build brief §4b / §12): a hard, instant heuristic.
 * Same species + within 300m + within 90 minutes flags a candidate.
 *
 * This module only ever *flags* candidates. It must never merge cases:
 * per the brief, AI/heuristics may block duplicate *creation* (by showing
 * the reporter a confirmation screen), but merging two already-live cases
 * always requires an explicit human action (reporter "same animal"
 * confirmation, or a dispatcher merge in the Command Center).
 *
 * Layer 2 (AI photo comparison) is deferred until real photo pairs exist
 * to tune it on (build order §10) — see README for the planned interface.
 */

export const DUPLICATE_GATE_RADIUS_METERS = 300;
export const DUPLICATE_GATE_WINDOW_MINUTES = 90;

export interface CandidateCaseInput {
  caseId: string;
  caseNumber: string;
  species: Species;
  location: LatLng;
  reportedAt: Date;
}

export interface NewReportInput {
  species: Species;
  location: LatLng;
  reportedAt: Date;
}

export interface DuplicateCandidate {
  caseId: string;
  caseNumber: string;
  distanceMeters: number;
  minutesSinceReported: number;
}

export function findDuplicateCandidates(
  newReport: NewReportInput,
  openCases: CandidateCaseInput[]
): DuplicateCandidate[] {
  return openCases
    .filter((existing) => existing.species === newReport.species)
    .map((existing) => {
      const distance = distanceMeters(newReport.location, existing.location);
      const minutesSince = Math.abs(
        (newReport.reportedAt.getTime() - existing.reportedAt.getTime()) / 60_000
      );
      return { existing, distance, minutesSince };
    })
    .filter(
      ({ distance, minutesSince }) =>
        distance <= DUPLICATE_GATE_RADIUS_METERS && minutesSince <= DUPLICATE_GATE_WINDOW_MINUTES
    )
    .map(({ existing, distance, minutesSince }) => ({
      caseId: existing.caseId,
      caseNumber: existing.caseNumber,
      distanceMeters: Math.round(distance),
      minutesSinceReported: Math.round(minutesSince),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
