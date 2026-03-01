/**
 * Test data seeder for tournament functionality.
 *
 * All test IDs use the "__TEST__" prefix and names use "[TEST]" prefix
 * so they can be easily identified and removed.
 */

import { saveEntity, deleteEntity, getIndex } from "@/lib/storage/local-storage";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import type { Player } from "@/lib/types/player";
import type { ArmyList, ArmyUnitSlot, ArmyNCUSlot } from "@/lib/types/army-list";
import type {
  Tournament,
  TournamentPlayer,
  Round,
  Pairing,
  MatchResult,
} from "@/lib/types/tournament";
import type { FactionId } from "@/lib/types/game-data";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_PREFIX = "__TEST__";
const now = new Date().toISOString();

function slot(unitId: string, attachmentIds: string[] = []): ArmyUnitSlot {
  return { id: `${TEST_PREFIX}slot-${unitId}`, unitId, attachmentIds };
}

function ncuSlot(ncuId: string): ArmyNCUSlot {
  return { id: `${TEST_PREFIX}ncu-${ncuId}`, ncuId };
}

function makeList(
  id: string,
  name: string,
  faction: FactionId,
  commanderId: string,
  commanderSlotUnitId: string,
  units: ArmyUnitSlot[],
  ncus: ArmyNCUSlot[],
  playerId: string
): ArmyList {
  const commanderSlot = units.find((u) => u.unitId === commanderSlotUnitId);
  return {
    id,
    name,
    faction,
    pointLimit: 40,
    commanderId,
    commanderUnitSlotId: commanderSlot?.id ?? null,
    units,
    ncus,
    createdAt: now,
    updatedAt: now,
    playerId,
  };
}

// ---------------------------------------------------------------------------
// 16 Test Players
// ---------------------------------------------------------------------------

const TEST_PLAYERS: Player[] = [
  { id: `${TEST_PREFIX}player-01`, name: "[TEST] Robb Rivers", createdAt: now, updatedAt: now },
  { id: `${TEST_PREFIX}player-02`, name: "[TEST] Arya Snow", createdAt: now, updatedAt: now },
  { id: `${TEST_PREFIX}player-03`, name: "[TEST] Tywin Hill", createdAt: now, updatedAt: now },
  { id: `${TEST_PREFIX}player-04`, name: "[TEST] Cersei Waters", createdAt: now, updatedAt: now },
  { id: `${TEST_PREFIX}player-05`, name: "[TEST] Stannis Storm", createdAt: now, updatedAt: now },
  { id: `${TEST_PREFIX}player-06`, name: "[TEST] Renly Flowers", createdAt: now, updatedAt: now },
  { id: `${TEST_PREFIX}player-07`, name: "[TEST] Khal Zhako", createdAt: now, updatedAt: now },
  { id: `${TEST_PREFIX}player-08`, name: "[TEST] Missandei Pahl", createdAt: now, updatedAt: now },
  { id: `${TEST_PREFIX}player-09`, name: "[TEST] Jon Steward", createdAt: now, updatedAt: now },
  { id: `${TEST_PREFIX}player-10`, name: "[TEST] Sam Ranger", createdAt: now, updatedAt: now },
  { id: `${TEST_PREFIX}player-11`, name: "[TEST] Asha Salt", createdAt: now, updatedAt: now },
  { id: `${TEST_PREFIX}player-12`, name: "[TEST] Theon Pike", createdAt: now, updatedAt: now },
  { id: `${TEST_PREFIX}player-13`, name: "[TEST] Oberyn Sand", createdAt: now, updatedAt: now },
  { id: `${TEST_PREFIX}player-14`, name: "[TEST] Arianne Dayne", createdAt: now, updatedAt: now },
  { id: `${TEST_PREFIX}player-15`, name: "[TEST] Tormund Crow", createdAt: now, updatedAt: now },
  { id: `${TEST_PREFIX}player-16`, name: "[TEST] Mance King", createdAt: now, updatedAt: now },
];

// ---------------------------------------------------------------------------
// Player faction mapping (2 players per faction)
// ---------------------------------------------------------------------------

type PlayerFaction = { playerId: string; faction: FactionId };

const PLAYER_FACTIONS: PlayerFaction[] = [
  { playerId: `${TEST_PREFIX}player-01`, faction: "stark" },
  { playerId: `${TEST_PREFIX}player-02`, faction: "stark" },
  { playerId: `${TEST_PREFIX}player-03`, faction: "lannister" },
  { playerId: `${TEST_PREFIX}player-04`, faction: "lannister" },
  { playerId: `${TEST_PREFIX}player-05`, faction: "baratheon" },
  { playerId: `${TEST_PREFIX}player-06`, faction: "baratheon" },
  { playerId: `${TEST_PREFIX}player-07`, faction: "targaryen" },
  { playerId: `${TEST_PREFIX}player-08`, faction: "targaryen" },
  { playerId: `${TEST_PREFIX}player-09`, faction: "nightswatch" },
  { playerId: `${TEST_PREFIX}player-10`, faction: "nightswatch" },
  { playerId: `${TEST_PREFIX}player-11`, faction: "greyjoy" },
  { playerId: `${TEST_PREFIX}player-12`, faction: "greyjoy" },
  { playerId: `${TEST_PREFIX}player-13`, faction: "martell" },
  { playerId: `${TEST_PREFIX}player-14`, faction: "martell" },
  { playerId: `${TEST_PREFIX}player-15`, faction: "freefolk" },
  { playerId: `${TEST_PREFIX}player-16`, faction: "freefolk" },
];

// ---------------------------------------------------------------------------
// 32 Army Lists (2 per player) — real game entity IDs, ~40pts each
// ---------------------------------------------------------------------------

function buildAllLists(): ArmyList[] {
  const lists: ArmyList[] = [];

  // ---- STARK player 1 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-01a`, "[TEST] Stark — Robb's Host", "stark", "20201", "10201",
      [slot("10201", ["20204"]), slot("10202"), slot("10205"), slot("10203"), slot("10204")],
      [ncuSlot("30201"), ncuSlot("30202")],
      `${TEST_PREFIX}player-01`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-01b`, "[TEST] Stark — The Blackfish", "stark", "20208", "10206",
      [slot("10206", ["20209"]), slot("10201"), slot("10209"), slot("10208"), slot("10207")],
      [ncuSlot("30206"), ncuSlot("30205")],
      `${TEST_PREFIX}player-01`
    )
  );

  // ---- STARK player 2 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-02a`, "[TEST] Stark — Ned's Justice", "stark", "20210", "10212",
      [slot("10212", ["20203"]), slot("10201"), slot("10205"), slot("10214")],
      [ncuSlot("30204"), ncuSlot("30202")],
      `${TEST_PREFIX}player-02`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-02b`, "[TEST] Stark — Karstark Fury", "stark", "20228", "10215",
      [slot("10215"), slot("10217"), slot("10203", ["20203"]), slot("10210")],
      [ncuSlot("30209"), ncuSlot("30206")],
      `${TEST_PREFIX}player-02`
    )
  );

  // ---- LANNISTER player 3 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-03a`, "[TEST] Lannister — Tywin's Fist", "lannister", "20104", "10101",
      [slot("10101", ["20102"]), slot("10105"), slot("10106"), slot("10103")],
      [ncuSlot("30101"), ncuSlot("30105")],
      `${TEST_PREFIX}player-03`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-03b`, "[TEST] Lannister — The Mountain", "lannister", "20116", "10103",
      [slot("10103"), slot("10101", ["20101"]), slot("10102"), slot("10107")],
      [ncuSlot("30104"), ncuSlot("30102")],
      `${TEST_PREFIX}player-03`
    )
  );

  // ---- LANNISTER player 4 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-04a`, "[TEST] Lannister — Kingslayer", "lannister", "20115", "10110",
      [slot("10110"), slot("10101", ["20102"]), slot("10108"), slot("10106")],
      [ncuSlot("30105"), ncuSlot("30108")],
      `${TEST_PREFIX}player-04`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-04b`, "[TEST] Lannister — Faith Militant", "lannister", "20125", "10108",
      [slot("10108"), slot("10109"), slot("10101", ["20101"]), slot("10111")],
      [ncuSlot("30103"), ncuSlot("30109")],
      `${TEST_PREFIX}player-04`
    )
  );

  // ---- BARATHEON player 5 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-05a`, "[TEST] Baratheon — Stannis R'hllor", "baratheon", "20602", "10608",
      [slot("10608"), slot("10602", ["20604"]), slot("10605"), slot("10610")],
      [ncuSlot("30603"), ncuSlot("30604")],
      `${TEST_PREFIX}player-05`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-05b`, "[TEST] Baratheon — Stag Knights", "baratheon", "20605", "10601",
      [slot("10601", ["20603"]), slot("10603"), slot("10606"), slot("10607")],
      [ncuSlot("30605"), ncuSlot("30601")],
      `${TEST_PREFIX}player-05`
    )
  );

  // ---- BARATHEON player 6 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-06a`, "[TEST] Baratheon — Renly's Rose", "baratheon", "20601", "10604",
      [slot("10604", ["20613"]), slot("10612"), slot("10611"), slot("10602")],
      [ncuSlot("30608"), ncuSlot("30609")],
      `${TEST_PREFIX}player-06`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-06b`, "[TEST] Baratheon — Penrose Guard", "baratheon", "20624", "10615",
      [slot("10615"), slot("10601"), slot("10603", ["20604"]), slot("10614")],
      [ncuSlot("30612"), ncuSlot("30602")],
      `${TEST_PREFIX}player-06`
    )
  );

  // ---- TARGARYEN player 7 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-07a`, "[TEST] Targaryen — Khal's Horde", "targaryen", "20701", "10703",
      [slot("10703", ["20704"]), slot("10701"), slot("10702"), slot("10711")],
      [ncuSlot("30701"), ncuSlot("30702")],
      `${TEST_PREFIX}player-07`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-07b`, "[TEST] Targaryen — Dragon Queen", "targaryen", "20714", "10705",
      [slot("10705", ["20706"]), slot("10706"), slot("10712"), slot("10714")],
      [ncuSlot("30707"), ncuSlot("30711")],
      `${TEST_PREFIX}player-07`
    )
  );

  // ---- TARGARYEN player 8 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-08a`, "[TEST] Targaryen — Ser Barristan", "targaryen", "20707", "10705",
      [slot("10705"), slot("10713", ["20710"]), slot("10706"), slot("10704")],
      [ncuSlot("30704"), ncuSlot("30705")],
      `${TEST_PREFIX}player-08`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-08b`, "[TEST] Targaryen — Grey Worm's Spear", "targaryen", "20712", "10706",
      [slot("10706", ["20713"]), slot("10705"), slot("10716"), slot("10717")],
      [ncuSlot("30710"), ncuSlot("30708")],
      `${TEST_PREFIX}player-08`
    )
  );

  // ---- NIGHT'S WATCH player 9 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-09a`, "[TEST] Night's Watch — Lord Commander", "nightswatch", "20501", "10501",
      [slot("10501", ["20504"]), slot("10502"), slot("10504"), slot("10508")],
      [ncuSlot("30502"), ncuSlot("30501")],
      `${TEST_PREFIX}player-09`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-09b`, "[TEST] Night's Watch — Jon Snow", "nightswatch", "20502", "10502",
      [slot("10502", ["20503"]), slot("10501"), slot("10503"), slot("10505")],
      [ncuSlot("30506"), ncuSlot("30509")],
      `${TEST_PREFIX}player-09`
    )
  );

  // ---- NIGHT'S WATCH player 10 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-10a`, "[TEST] Night's Watch — Thorne's Vow", "nightswatch", "20509", "10509",
      [slot("10509"), slot("10501", ["20510"]), slot("10505"), slot("10504")],
      [ncuSlot("30507"), ncuSlot("30502")],
      `${TEST_PREFIX}player-10`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-10b`, "[TEST] Night's Watch — Shadow Tower", "nightswatch", "20535", "10513",
      [slot("10513"), slot("10502"), slot("10508"), slot("10510")],
      [ncuSlot("30513"), ncuSlot("30501")],
      `${TEST_PREFIX}player-10`
    )
  );

  // ---- GREYJOY player 11 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-11a`, "[TEST] Greyjoy — Asha's Raiders", "greyjoy", "20801", "10801",
      [slot("10801", ["20805"]), slot("10803"), slot("10804"), slot("10802")],
      [ncuSlot("30801"), ncuSlot("30802")],
      `${TEST_PREFIX}player-11`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-11b`, "[TEST] Greyjoy — Iron Fleet", "greyjoy", "20803", "10804",
      [slot("10804", ["20804"]), slot("10806"), slot("10801"), slot("10808")],
      [ncuSlot("30803"), ncuSlot("30804")],
      `${TEST_PREFIX}player-11`
    )
  );

  // ---- GREYJOY player 12 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-12a`, "[TEST] Greyjoy — Euron's Silence", "greyjoy", "20812", "10807",
      [slot("10807"), slot("10803", ["20805"]), slot("10801"), slot("10805")],
      [ncuSlot("30807"), ncuSlot("30806")],
      `${TEST_PREFIX}player-12`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-12b`, "[TEST] Greyjoy — Theon Reborn", "greyjoy", "20808", "10801",
      [slot("10801", ["20807"]), slot("10809"), slot("10810"), slot("10802")],
      [ncuSlot("30802"), ncuSlot("30808")],
      `${TEST_PREFIX}player-12`
    )
  );

  // ---- MARTELL player 13 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-13a`, "[TEST] Martell — Red Viper", "martell", "20901", "10903",
      [slot("10903", ["20906"]), slot("10901"), slot("10904"), slot("10905")],
      [ncuSlot("30903"), ncuSlot("30901")],
      `${TEST_PREFIX}player-13`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-13b`, "[TEST] Martell — Hotah's Guard", "martell", "20903", "10904",
      [slot("10904", ["20905"]), slot("10902"), slot("10906"), slot("10901")],
      [ncuSlot("30907"), ncuSlot("30906")],
      `${TEST_PREFIX}player-13`
    )
  );

  // ---- MARTELL player 14 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-14a`, "[TEST] Martell — Sand Snakes", "martell", "20909", "10905",
      [slot("10905", ["20910"]), slot("10903"), slot("10909"), slot("10901")],
      [ncuSlot("30905"), ncuSlot("30904")],
      `${TEST_PREFIX}player-14`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-14b`, "[TEST] Martell — Darkstar Rising", "martell", "20921", "10908",
      [slot("10908"), slot("10901", ["20907"]), slot("10906"), slot("10907")],
      [ncuSlot("30902"), ncuSlot("30908")],
      `${TEST_PREFIX}player-14`
    )
  );

  // ---- FREE FOLK player 15 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-15a`, "[TEST] Free Folk — Tormund's Horde", "freefolk", "20301", "10305",
      [slot("10305", ["20302"]), slot("10303"), slot("10304"), slot("10301")],
      [ncuSlot("30301"), ncuSlot("30305")],
      `${TEST_PREFIX}player-15`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-15b`, "[TEST] Free Folk — Thenn Warriors", "freefolk", "20313", "10308",
      [slot("10308", ["20310"]), slot("10303"), slot("10307"), slot("10302")],
      [ncuSlot("30304"), ncuSlot("30303")],
      `${TEST_PREFIX}player-15`
    )
  );

  // ---- FREE FOLK player 16 ----
  lists.push(
    makeList(`${TEST_PREFIX}list-16a`, "[TEST] Free Folk — King Beyond the Wall", "freefolk", "20303", "10304",
      [slot("10304", ["20306"]), slot("10305"), slot("10311"), slot("10317")],
      [ncuSlot("30302"), ncuSlot("30306")],
      `${TEST_PREFIX}player-16`
    )
  );
  lists.push(
    makeList(`${TEST_PREFIX}list-16b`, "[TEST] Free Folk — Rattleshirt's Bones", "freefolk", "20315", "10307",
      [slot("10307"), slot("10302"), slot("10321"), slot("10306")],
      [ncuSlot("30305"), ncuSlot("30301")],
      `${TEST_PREFIX}player-16`
    )
  );

  return lists;
}

// ---------------------------------------------------------------------------
// Tournament round / result builders
// ---------------------------------------------------------------------------

function pairing(
  id: string,
  p1: string,
  p2: string | null,
  result?: MatchResult
): Pairing {
  return { id, player1Id: p1, player2Id: p2, result };
}

function matchResult(
  winnerId: string,
  p1VP: number,
  p2VP: number,
  p1ListId?: string,
  p2ListId?: string
): MatchResult {
  const vpDiff = Math.abs(p1VP - p2VP);
  const sp = Math.min(vpDiff, 4);

  return {
    winnerId,
    player1VP: p1VP,
    player2VP: p2VP,
    player1TP: p1VP > p2VP ? 3 : p1VP === p2VP ? 2 : 1,
    player2TP: p2VP > p1VP ? 3 : p1VP === p2VP ? 2 : 1,
    player1SP: p1VP > p2VP ? sp : 0,
    player2SP: p2VP > p1VP ? sp : 0,
    player1ListId: p1ListId,
    player2ListId: p2ListId,
  };
}

// ---------------------------------------------------------------------------
// Build Tournaments
// ---------------------------------------------------------------------------

function buildCompletedTournament(): Tournament {
  const id = `${TEST_PREFIX}tournament-completed`;
  const players: TournamentPlayer[] = TEST_PLAYERS.slice(0, 8).map((p, i) => {
    const pf = PLAYER_FACTIONS[i];
    return {
      playerId: p.id,
      status: "accepted" as const,
      faction: pf.faction,
      armyListIds: [
        `${TEST_PREFIX}list-${String(i + 1).padStart(2, "0")}a`,
        `${TEST_PREFIX}list-${String(i + 1).padStart(2, "0")}b`,
      ],
      dropped: false,
    };
  });

  const p = (n: number) => `${TEST_PREFIX}player-${String(n).padStart(2, "0")}`;
  const l = (n: number, ab: "a" | "b") =>
    `${TEST_PREFIX}list-${String(n).padStart(2, "0")}${ab}`;

  // Round 1: Random pairings (1v2, 3v4, 5v6, 7v8)
  const round1: Round = {
    roundNumber: 1,
    status: "completed",
    pairings: [
      pairing(`${TEST_PREFIX}r1p1`, p(1), p(2), matchResult(p(1), 8, 3, l(1, "a"), l(2, "a"))),
      pairing(`${TEST_PREFIX}r1p2`, p(3), p(4), matchResult(p(3), 6, 5, l(3, "a"), l(4, "a"))),
      pairing(`${TEST_PREFIX}r1p3`, p(5), p(6), matchResult(p(6), 4, 7, l(5, "a"), l(6, "a"))),
      pairing(`${TEST_PREFIX}r1p4`, p(7), p(8), matchResult(p(7), 9, 2, l(7, "a"), l(8, "a"))),
    ],
  };

  // Round 2: Swiss pairings — winners play winners (1v3, 6v7, losers 2v4, 5v8)
  const round2: Round = {
    roundNumber: 2,
    status: "completed",
    pairings: [
      pairing(`${TEST_PREFIX}r2p1`, p(1), p(3), matchResult(p(1), 7, 4, l(1, "b"), l(3, "b"))),
      pairing(`${TEST_PREFIX}r2p2`, p(6), p(7), matchResult(p(7), 5, 8, l(6, "b"), l(7, "b"))),
      pairing(`${TEST_PREFIX}r2p3`, p(2), p(4), matchResult(p(4), 3, 6, l(2, "b"), l(4, "b"))),
      pairing(`${TEST_PREFIX}r2p4`, p(5), p(8), matchResult(p(5), 7, 3, l(5, "b"), l(8, "b"))),
    ],
  };

  // Round 3: Final swiss (1v7, 3v4, 6v5, 2v8)
  const round3: Round = {
    roundNumber: 3,
    status: "completed",
    pairings: [
      pairing(`${TEST_PREFIX}r3p1`, p(1), p(7), matchResult(p(7), 6, 9, l(1, "a"), l(7, "a"))),
      pairing(`${TEST_PREFIX}r3p2`, p(3), p(4), matchResult(p(3), 8, 5, l(3, "a"), l(4, "a"))),
      pairing(`${TEST_PREFIX}r3p3`, p(6), p(5), matchResult(p(6), 7, 4, l(6, "a"), l(5, "a"))),
      pairing(`${TEST_PREFIX}r3p4`, p(2), p(8), matchResult(p(2), 6, 3, l(2, "a"), l(8, "a"))),
    ],
  };

  return {
    id,
    name: "[TEST] SIFPH Invitational 2026",
    description:
      "A premier 8-player invitational featuring the best commanders from across Westeros.",
    date: "2026-02-15",
    pointLimit: 40,
    numberOfRounds: 3,
    maxPlayers: 8,
    requiredLists: 2,
    adminUserId: `${TEST_PREFIX}admin`,
    listsRevealed: true,
    listsLocked: true,
    lockedLists: [],
    status: "completed",
    players,
    rounds: [round1, round2, round3],
    scoringScheme: {
      winTP: 3,
      drawTP: 2,
      lossTP: 1,
      forfeitTP: 0,
      byeTP: 3,
      byeSP: 4,
    },
    createdAt: "2026-02-01T10:00:00.000Z",
    updatedAt: "2026-02-15T18:00:00.000Z",
  };
}

function buildRegistrantTournament(): Tournament {
  const id = `${TEST_PREFIX}tournament-registrants`;

  // 12 players: first 8 accepted, last 4 pending
  const players: TournamentPlayer[] = TEST_PLAYERS.slice(0, 12).map(
    (p, i) => {
      const pf = PLAYER_FACTIONS[i];
      return {
        playerId: p.id,
        status: (i < 8 ? "accepted" : "pending") as "accepted" | "pending",
        faction: pf.faction,
        armyListIds: [
          `${TEST_PREFIX}list-${String(i + 1).padStart(2, "0")}a`,
          `${TEST_PREFIX}list-${String(i + 1).padStart(2, "0")}b`,
        ],
        dropped: false,
      };
    }
  );

  return {
    id,
    name: "[TEST] Spring Championship 2026",
    description:
      "Open registration for the Spring Championship. 16 slots, first come first served.",
    date: "2026-04-20",
    pointLimit: 40,
    numberOfRounds: 4,
    maxPlayers: 16,
    requiredLists: 2,
    adminUserId: `${TEST_PREFIX}admin`,
    listsRevealed: false,
    listsLocked: false,
    lockedLists: [],
    status: "draft",
    players,
    rounds: [],
    scoringScheme: {
      winTP: 3,
      drawTP: 2,
      lossTP: 1,
      forfeitTP: 0,
      byeTP: 3,
      byeSP: 4,
    },
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-01T10:00:00.000Z",
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SeedResult {
  players: number;
  lists: number;
  tournaments: number;
}

export function seedTestData(): SeedResult {
  const lists = buildAllLists();

  // Save players
  TEST_PLAYERS.forEach((p) => {
    saveEntity(STORAGE_KEYS.PLAYERS, p.id, p);
  });

  // Save army lists
  lists.forEach((l) => {
    saveEntity(STORAGE_KEYS.ARMY_LISTS, l.id, l);
  });

  // Save tournaments
  const completedTournament = buildCompletedTournament();
  const registrantTournament = buildRegistrantTournament();
  saveEntity(STORAGE_KEYS.TOURNAMENTS, completedTournament.id, completedTournament);
  saveEntity(STORAGE_KEYS.TOURNAMENTS, registrantTournament.id, registrantTournament);

  return {
    players: TEST_PLAYERS.length,
    lists: lists.length,
    tournaments: 2,
  };
}

export function removeTestData(): SeedResult {
  let players = 0;
  let lists = 0;
  let tournaments = 0;

  // Remove test players
  const playerIndex = getIndex(STORAGE_KEYS.PLAYERS);
  playerIndex
    .filter((id) => id.startsWith(TEST_PREFIX))
    .forEach((id) => {
      deleteEntity(STORAGE_KEYS.PLAYERS, id);
      players++;
    });

  // Remove test army lists
  const listIndex = getIndex(STORAGE_KEYS.ARMY_LISTS);
  listIndex
    .filter((id) => id.startsWith(TEST_PREFIX))
    .forEach((id) => {
      deleteEntity(STORAGE_KEYS.ARMY_LISTS, id);
      lists++;
    });

  // Remove test tournaments
  const tournamentIndex = getIndex(STORAGE_KEYS.TOURNAMENTS);
  tournamentIndex
    .filter((id) => id.startsWith(TEST_PREFIX))
    .forEach((id) => {
      deleteEntity(STORAGE_KEYS.TOURNAMENTS, id);
      tournaments++;
    });

  return { players, lists, tournaments };
}
