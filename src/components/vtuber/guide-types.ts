/**
 * guide-types.ts — Definisi tipe untuk VTuber Turguide Bank Saku Digital
 */

export type GuideState =
  | "idle"
  | "greeting"
  | "tutorial"
  | "listening"
  | "thinking"
  | "speaking"
  | "error"
  | "minimized";

export interface TutorialStep {
  id: string;
  target?: string; // CSS selector opsional untuk highlight
  title: string;
  description: string;
  tip?: string;
}

export interface PageTutorial {
  pageId: string;
  pageTitle: string;
  route: string;
  summary: string;
  steps: TutorialStep[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "guide";
  text: string;
  timestamp: string;
}

export interface GuideContextState {
  currentPath: string;
  userRole?: string;
  userName?: string;
}
