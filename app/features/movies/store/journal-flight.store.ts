import { create } from "zustand";
import type { ViewInstance } from "react-native";
import type { ScreenRect } from "../types/movies.type";

export interface JournalFlight {
  id: number;
  source: ScreenRect;
  target: ScreenRect;
}

interface JournalFlightState {
  flight: JournalFlight | null;
  /** Increments when a token reaches the Journal tab. */
  arrivals: number;
  startFlight: (source: ScreenRect, target: ScreenRect) => void;
  completeFlight: (id: number) => void;
}

/** Mounted Journal tab icon that a token flies toward. */
export const journalTabAnchor = { current: null as ViewInstance | null };

/** Root overlay used to translate window measurements into overlay space. */
export const journalFlightOverlay = { current: null as ViewInstance | null };

let nextFlightId = 0;

export const useJournalFlightStore = create<JournalFlightState>()((set) => ({
  flight: null,
  arrivals: 0,
  startFlight: (source, target) =>
    set({ flight: { id: (nextFlightId += 1), source, target } }),
  completeFlight: (id) =>
    set((state) =>
      state.flight?.id === id
        ? { flight: null, arrivals: state.arrivals + 1 }
        : state,
    ),
}));

/**
 * Launches the Seen -> Journal token. Measured rects are in window space,
 * while the overlay lays out in root space; the overlay's own origin bridges
 * the two.
 * No-ops when the Journal tab is not on screen (e.g. movie detail).
 */
export function flyToJournal(source: ScreenRect) {
  const anchor = journalTabAnchor.current;
  const overlay = journalFlightOverlay.current;
  if (!anchor || !overlay) return;

  overlay.measureInWindow((originX, originY) => {
    anchor.measureInWindow((x, y, width, height) => {
      if (width <= 0 || height <= 0) return;

      const toOverlay = (rect: ScreenRect): ScreenRect => ({
        ...rect,
        x: rect.x - originX,
        y: rect.y - originY,
      });

      useJournalFlightStore
        .getState()
        .startFlight(
          toOverlay(source),
          toOverlay({ x, y, width, height }),
        );
    });
  });
}
