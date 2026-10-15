/**
 * guide-machine.ts — State machine untuk VTuber Turguide
 * Mengatur transisi state yang konsisten tanpa benturan dan bebas race condition.
 */

import { GuideState } from "./guide-types";

export type GuideAction =
  | { type: "GREET" }
  | { type: "FINISH_GREET" }
  | { type: "START_TUTORIAL" }
  | { type: "NEXT_TUTORIAL_STEP" }
  | { type: "PREV_TUTORIAL_STEP" }
  | { type: "EXIT_TUTORIAL" }
  | { type: "START_THINKING" }
  | { type: "START_SPEAKING" }
  | { type: "FINISH_SPEAKING" }
  | { type: "SET_ERROR"; message: string }
  | { type: "CLEAR_ERROR" }
  | { type: "MINIMIZE" }
  | { type: "RESTORE" };

export interface MachineState {
  current: GuideState;
  previous: GuideState;
  tutorialStepIndex: number;
  errorMessage: string | null;
}

export const initialMachineState: MachineState = {
  current: "idle",
  previous: "idle",
  tutorialStepIndex: 0,
  errorMessage: null,
};

export function guideReducer(state: MachineState, action: GuideAction): MachineState {
  switch (action.type) {
    case "GREET":
      if (state.current === "minimized") return state;
      return {
        ...state,
        previous: state.current,
        current: "greeting",
        errorMessage: null,
      };

    case "FINISH_GREET":
      if (state.current !== "greeting") return state;
      return {
        ...state,
        previous: "greeting",
        current: "idle",
      };

    case "START_TUTORIAL":
      return {
        ...state,
        previous: state.current,
        current: "tutorial",
        tutorialStepIndex: 0,
        errorMessage: null,
      };

    case "NEXT_TUTORIAL_STEP":
      return {
        ...state,
        tutorialStepIndex: state.tutorialStepIndex + 1,
      };

    case "PREV_TUTORIAL_STEP":
      return {
        ...state,
        tutorialStepIndex: Math.max(0, state.tutorialStepIndex - 1),
      };

    case "EXIT_TUTORIAL":
      return {
        ...state,
        previous: state.current,
        current: "idle",
        tutorialStepIndex: 0,
      };

    case "START_THINKING":
      if (state.current === "minimized") return state;
      return {
        ...state,
        previous: state.current,
        current: "thinking",
        errorMessage: null,
      };

    case "START_SPEAKING":
      if (state.current === "minimized") return state;
      return {
        ...state,
        previous: state.current,
        current: "speaking",
      };

    case "FINISH_SPEAKING":
      if (state.current !== "speaking") return state;
      return {
        ...state,
        previous: "speaking",
        current: "idle",
      };

    case "SET_ERROR":
      return {
        ...state,
        previous: state.current,
        current: "error",
        errorMessage: action.message,
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        current: state.previous === "error" ? "idle" : state.previous,
        errorMessage: null,
      };

    case "MINIMIZE":
      if (state.current === "minimized") return state;
      return {
        ...state,
        previous: state.current,
        current: "minimized",
      };

    case "RESTORE":
      if (state.current !== "minimized") return state;
      return {
        ...state,
        previous: "minimized",
        current: state.previous === "minimized" ? "idle" : state.previous,
      };

    default:
      return state;
  }
}
