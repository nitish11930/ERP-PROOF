import type { Case, Producer } from '@/lib/types';
import { DEMO_CASES, DEMO_PRODUCERS } from '@/lib/data/demo';

export function getCases(): Case[] {
  return DEMO_CASES;
}

export function getCase(id: string): Case | undefined {
  return DEMO_CASES.find((c) => c.caseId === id);
}

export function saveCase(newCase: Case): void {
  const index = DEMO_CASES.findIndex(c => c.caseId === newCase.caseId);
  if (index >= 0) {
    DEMO_CASES[index] = newCase;
  } else {
    DEMO_CASES.unshift(newCase);
  }
}

export function getProducers(): Producer[] {
  return DEMO_PRODUCERS;
}
