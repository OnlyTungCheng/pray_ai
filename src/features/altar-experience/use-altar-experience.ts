"use client";

import { useCallback, useReducer } from "react";

import type { SceneTheme } from "@/features/temple-scene/scene-types";

type AltarExperienceState = {
  themeMode: SceneTheme;
  currentHallId: string;
  currentHallDeityId: string;
};

type AltarExperienceEvent =
  | { type: "TOGGLE_THEME" }
  | { type: "HALL_SELECTED"; hallId: string; deityId: string }
  | { type: "DEITY_SELECTED"; deityId: string };

function reduceAltarExperience(state: AltarExperienceState, event: AltarExperienceEvent): AltarExperienceState {
  switch (event.type) {
    case "TOGGLE_THEME":
      return { ...state, themeMode: state.themeMode === "basic" ? "remix" : "basic" };
    case "HALL_SELECTED":
      return { ...state, currentHallId: event.hallId, currentHallDeityId: event.deityId };
    case "DEITY_SELECTED":
      return { ...state, currentHallDeityId: event.deityId };
  }
}

export function useAltarExperience(initial: {
  themeMode: SceneTheme;
  hallId: string;
  deityId: string;
}) {
  const [state, dispatch] = useReducer(reduceAltarExperience, {
    themeMode: initial.themeMode,
    currentHallId: initial.hallId,
    currentHallDeityId: initial.deityId,
  });

  const toggleTheme = useCallback(() => dispatch({ type: "TOGGLE_THEME" }), []);
  const selectHall = useCallback((hallId: string, deityId: string) => dispatch({ type: "HALL_SELECTED", hallId, deityId }), []);
  const selectDeity = useCallback((deityId: string) => dispatch({ type: "DEITY_SELECTED", deityId }), []);

  return { ...state, toggleTheme, selectHall, selectDeity };
}
