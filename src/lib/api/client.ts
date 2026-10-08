/**
 * API Gateway Boundary Abstraction
 * 
 * This service provides a clean boundary for the Frontend to communicate 
 * with the API Gateway / Lambda backend.
 * 
 * In Phase 3A, this is a structural foundation. The actual implementation 
 * currently relies on the local in-memory store.
 */

import type { Case, ReviewDecision } from '@/lib/types';

export const ApiClient = {
  cases: {
    list: async (): Promise<Case[]> => {
      // Future: return fetch('/api/cases').then(r => r.json());
      throw new Error("Not implemented yet. Using local store.");
    },
    
    get: async (id: string): Promise<Case> => {
      // Future: return fetch(`/api/cases/${id}`).then(r => r.json());
      throw new Error("Not implemented yet. Using local store.");
    },
    
    create: async (caseData: Partial<Case>): Promise<Case> => {
      // Future: return fetch('/api/cases', { method: 'POST', body: JSON.stringify(caseData) }).then(r => r.json());
      throw new Error("Not implemented yet. Using local store.");
    },
    
    verify: async (id: string): Promise<Case> => {
      // Future: return fetch(`/api/cases/${id}/verify`, { method: 'POST' }).then(r => r.json());
      throw new Error("Not implemented yet. Using local store.");
    },
    
    submitReview: async (id: string, review: ReviewDecision): Promise<Case> => {
      // Future: return fetch(`/api/cases/${id}/review`, { method: 'POST', body: JSON.stringify(review) }).then(r => r.json());
      throw new Error("Not implemented yet. Using local store.");
    }
  }
};
