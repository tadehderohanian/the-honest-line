// Loads the daily prediction files that the Python model commits to the repo.
// These JSON files ARE the public ledger: once committed before first pitch,
// git's history is the tamper-evident proof of what we predicted and when.
//
// Everything here runs at BUILD time, not in the browser. The output is plain
// static HTML, so there is no server or database to maintain or secure.

import { teamSlug } from './teams';

/** One game's "why" breakdown, straight from the model. */
export interface Components {
  homeWinPct: number;
  awayWinPct: number;
  log5_base: number;
  home_edge: number;
  home_pitcher_adj: number;
  away_pitcher_adj: number;
}

/** Final result of a graded game (filled in after the game ends). */
export interface GameResult {
  homeScore: number;
  awayScore: number;
  homeWin: boolean;       // did the home team win?
  status: string;         // e.g. "Final"
  gradedAt: string;       // ISO timestamp when we recorded the result
}

/** A single prediction as written by mlb_model.py. */
export interface Game {
  gamePk: number;
  gameDate: string;       // YYYY-MM-DD
  startTime: string | null; // ISO first-pitch time (UTC)
  home: string;
  homeId: number;
  away: string;
  awayId: number;
  homePitcher: string | null;
  homePitcherId: number | null;
  awayPitcher: string | null;
  awayPitcherId: number | null;
  homeEra: number | null;
  awayEra: number | null;
  components: Components;
  pHome: number;          // model P(home win), 0..1
  pClose: number | null;  // market P(home win) once The Odds API is wired up
  why: string;
  result: GameResult | null;
}

/** The full daily file. */
export interface DayFile {
  date: string;
  generatedAt: string;
  model: string;
  games: Game[];
}

/** A game enriched with display-ready fields the templates need. */
export interface GameView extends Game {
  date: string;           // the day this prediction belongs to
  slug: string;           // url path segment, e.g. dodgers-vs-padres-2026-06-13
  edge: number | null;    // pHome - pClose, when a market line exists
}

// Eagerly import every committed day file at build time.
const files = import.meta.glob<DayFile>('../data/predictions/*.json', {
  eager: true,
  import: 'default',
});

/** Build a stable, readable slug. Doubleheaders get a -2 suffix to stay unique. */
function buildSlugs(day: DayFile): GameView[] {
  const seen = new Map<string, number>();
  return day.games.map((g) => {
    const base = `${teamSlug(g.homeId, g.home)}-vs-${teamSlug(g.awayId, g.away)}-${day.date}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const slug = n === 1 ? base : `${base}-${n}`;
    return {
      ...g,
      date: day.date,
      slug,
      edge: g.pClose != null ? Number((g.pHome - g.pClose).toFixed(3)) : null,
    };
  });
}

/** All days, newest first. */
export function allDays(): DayFile[] {
  return Object.values(files).sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Every prediction across every day, enriched for display. */
export function allGames(): GameView[] {
  return allDays().flatMap(buildSlugs);
}

/** The most recent day we have predictions for (today, normally). */
export function latestDay(): DayFile | null {
  const days = allDays();
  return days.length ? days[0] : null;
}

/** Enriched games for the most recent day. */
export function latestGames(): GameView[] {
  const day = latestDay();
  return day ? buildSlugs(day) : [];
}
