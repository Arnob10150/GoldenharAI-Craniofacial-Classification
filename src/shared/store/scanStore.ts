import { create } from "zustand";
import type { ScanRecord } from "@/shared/lib/types";

interface ScanStoreState {
  activeScan: ScanRecord | null;
  analyzing: boolean;
  analysisStep: number;
  setActiveScan: (scan: ScanRecord | null) => void;
  setAnalyzing: (value: boolean) => void;
  setAnalysisStep: (step: number) => void;
}

export const useScanStore = create<ScanStoreState>((set) => ({
  activeScan: null,
  analyzing: false,
  analysisStep: 0,
  setActiveScan: (activeScan) => set({ activeScan }),
  setAnalyzing: (analyzing) => set({ analyzing }),
  setAnalysisStep: (analysisStep) => set({ analysisStep }),
}));
