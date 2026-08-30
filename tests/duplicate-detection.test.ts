import { describe, expect, it } from 'vitest';
import { Species } from '@prisma/client';
import { findDuplicateCandidates } from '@/lib/duplicate-detection';

const BASE_TIME = new Date('2026-08-30T12:00:00Z');

describe('duplicate detection heuristic gate', () => {
  it('flags a same-species case within 300m and 90 minutes', () => {
    const candidates = findDuplicateCandidates(
      { species: Species.DOG, location: { latitude: 19.017, longitude: 72.817 }, reportedAt: BASE_TIME },
      [
        {
          caseId: 'c1',
          caseNumber: 'RN-10284',
          species: Species.DOG,
          // ~110m away
          location: { latitude: 19.018, longitude: 72.817 },
          reportedAt: new Date(BASE_TIME.getTime() - 7 * 60_000),
        },
      ]
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.caseNumber).toBe('RN-10284');
  });

  it('does not flag a different species at the same spot and time', () => {
    const candidates = findDuplicateCandidates(
      { species: Species.DOG, location: { latitude: 19.017, longitude: 72.817 }, reportedAt: BASE_TIME },
      [
        {
          caseId: 'c1',
          caseNumber: 'RN-10284',
          species: Species.CAT,
          location: { latitude: 19.017, longitude: 72.817 },
          reportedAt: BASE_TIME,
        },
      ]
    );
    expect(candidates).toHaveLength(0);
  });

  it('does not flag a case beyond 300m', () => {
    const candidates = findDuplicateCandidates(
      { species: Species.DOG, location: { latitude: 19.017, longitude: 72.817 }, reportedAt: BASE_TIME },
      [
        {
          caseId: 'c1',
          caseNumber: 'RN-10284',
          species: Species.DOG,
          // ~1.1km away
          location: { latitude: 19.027, longitude: 72.817 },
          reportedAt: BASE_TIME,
        },
      ]
    );
    expect(candidates).toHaveLength(0);
  });

  it('does not flag a case beyond the 90 minute window', () => {
    const candidates = findDuplicateCandidates(
      { species: Species.DOG, location: { latitude: 19.017, longitude: 72.817 }, reportedAt: BASE_TIME },
      [
        {
          caseId: 'c1',
          caseNumber: 'RN-10284',
          species: Species.DOG,
          location: { latitude: 19.017, longitude: 72.817 },
          reportedAt: new Date(BASE_TIME.getTime() - 120 * 60_000),
        },
      ]
    );
    expect(candidates).toHaveLength(0);
  });

  it('sorts multiple candidates by distance, nearest first', () => {
    const candidates = findDuplicateCandidates(
      { species: Species.DOG, location: { latitude: 19.017, longitude: 72.817 }, reportedAt: BASE_TIME },
      [
        {
          caseId: 'far',
          caseNumber: 'RN-10001',
          species: Species.DOG,
          location: { latitude: 19.0195, longitude: 72.817 },
          reportedAt: BASE_TIME,
        },
        {
          caseId: 'near',
          caseNumber: 'RN-10002',
          species: Species.DOG,
          location: { latitude: 19.0172, longitude: 72.817 },
          reportedAt: BASE_TIME,
        },
      ]
    );
    expect(candidates.map((c) => c.caseId)).toEqual(['near', 'far']);
  });
});
