import { create } from 'zustand';
import type { TrustScoreBreakdown } from '@/types';

interface TrustScoreState {
  score: number;
  breakdown: TrustScoreBreakdown | null;
  setTrustScore: (score: number, breakdown: TrustScoreBreakdown) => void;
}

export const useTrustScoreStore = create<TrustScoreState>((set) => ({
  score: 0,
  breakdown: null,
  setTrustScore: (score, breakdown) => set({ score, breakdown }),
}));
