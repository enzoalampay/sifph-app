// =============================================================================
// Card Image URL helpers
// Images hosted on the asoiaf-tmg-data GitHub repo.
// Playtest-aware variants check for local overrides from the Jan 2026 PDF.
// =============================================================================

import type { FactionId } from "../types/game-data";
import { isPlaytestCard } from "../data/playtest-card-ids";

const BASE =
  "https://raw.githubusercontent.com/Pf2eTools/asoiaf-tmg-data/master";

/**
 * Get the full card image URL (front side).
 * Cards are stored as JPGs under generated/en/{faction}/{id}.jpg
 */
export function getCardImageUrl(
  id: string,
  faction: FactionId
): string {
  return `${BASE}/generated/en/${faction}/${id}.jpg`;
}

/**
 * Get the back side of a card image.
 * Back sides are stored as {id}b.jpg
 */
export function getCardBackImageUrl(
  id: string,
  faction: FactionId
): string {
  return `${BASE}/generated/en/${faction}/${id}b.jpg`;
}

/**
 * Get round portrait thumbnail for a card (PNG).
 * Portraits are stored under portraits/round/{id}.png
 */
export function getPortraitUrl(id: string): string {
  return `${BASE}/portraits/round/${id}.png`;
}

/**
 * Tactics cards may be stored under faction or under `game` for generic ones.
 * Commander tactics use the commander's faction folder.
 */
export function getTacticsImageUrl(
  id: string,
  faction: FactionId
): string {
  return `${BASE}/generated/en/${faction}/${id}.jpg`;
}

// =============================================================================
// Playtest-aware variants
// When usePlaytest is true and the card ID is in the playtest set,
// returns a local URL (/playtest-cards/{id}.jpg) instead of the CDN URL.
// =============================================================================

/**
 * Playtest-aware card image URL.
 * Returns local playtest image if available, otherwise falls back to CDN.
 */
export function getPlaytestCardImageUrl(
  id: string,
  faction: FactionId,
  usePlaytest: boolean
): string {
  if (usePlaytest && isPlaytestCard(id)) {
    return `/playtest-cards/${id}.jpg`;
  }
  return getCardImageUrl(id, faction);
}

/**
 * Playtest-aware card back image URL.
 * The playtest PDF does not contain card backs, so this always falls back to CDN.
 */
export function getPlaytestCardBackImageUrl(
  id: string,
  faction: FactionId,
  _usePlaytest: boolean
): string {
  return getCardBackImageUrl(id, faction);
}
