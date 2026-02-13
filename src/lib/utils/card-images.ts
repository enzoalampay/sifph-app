// =============================================================================
// Card Image URL helpers
// Images hosted on the asoiaf-tmg-data GitHub repo
// =============================================================================

import type { FactionId } from "../types/game-data";

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
