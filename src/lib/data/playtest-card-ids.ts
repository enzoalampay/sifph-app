// =============================================================================
// Playtest Card IDs — January 2026 Pre-Season
// All 53 card IDs that have updated images extracted from the playtest PDF.
// =============================================================================

export const PLAYTEST_CARD_IDS = new Set<string>([
  // ---- Stark Units ----
  "10201", // Stark Sworn Swords
  "10202", // Stark Outriders
  "10203", // House Umber Berserkers
  "10204", // Grey Wind
  "10205", // Stark Bowmen
  "10215", // House Karstark Spearmen

  // ---- Stark Attachments ----
  "20201", // Robb Stark, The Wolf Lord (Commander)
  "20202", // Greatjon Umber, Lord of Last Hearth (Commander)
  "20203", // Umber Champion
  "20204", // Sworn Sword Captain

  // ---- Stark NCUs ----
  "30201", // Catelyn Stark
  "30202", // Sansa Stark
  "30205", // Rodrik Cassel
  "30207", // Howland Reed

  // ---- Stark Tactics ----
  "40251", // Winter Is Coming
  "40252", // Northern Ferocity
  "40253", // Relentless Charge
  "40254", // The North Remembers
  "40255", // Swift Reposition
  "40256", // The Pack Survives
  "40257", // The North Endures
  "40258", // Alpha Strike (Robb)
  "40259", // Hit and Run (Robb)
  "40260", // Encircle the Prey (Robb)
  "40261", // Berserker Tactics (Greatjon)
  "40262", // Death Before Chains! (Greatjon)
  "40263", // Rage of Last Hearth (Greatjon)

  // ---- Lannister Units ----
  "10101", // Lannister Guardsmen
  "10102", // Lannister Halberdiers
  "10103", // House Clegane Mountain's Men
  "10106", // Lannister Crossbowmen
  "10112", // House Clegane Brigands

  // ---- Lannister Attachments ----
  "20101", // Assault Veteran
  "20102", // Guard Captain
  "20115", // Jaime Lannister, The Kingslayer (Commander)
  "20116", // Gregor Clegane, The Mountain (Commander)

  // ---- Lannister NCUs ----
  "30104", // Tyrion Lannister
  "30105", // Cersei Lannister
  "30106", // Joffrey Baratheon
  "30108", // Qyburn

  // ---- Lannister Tactics ----
  "40151", // Hear Me Roar!
  "40152", // Counterplot
  "40153", // Intrigue and Subterfuge
  "40154", // Wealth of the Rock
  "40155", // Subjugation of Power
  "40156", // A Lannister Pays His Debts
  "40157", // Bribery
  "40158", // Kingslayer's Pride (Jaime)
  "40159", // Deadly Riposte (Jaime)
  "40160", // Reckless Glory (Jaime)
  "40161", // Brutal Slayings (Gregor)
  "40162", // Path of Destruction (Gregor)
  "40163", // Fury Unleashed (Gregor)
]);

export function isPlaytestCard(id: string): boolean {
  return PLAYTEST_CARD_IDS.has(id);
}
