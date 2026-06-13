// Stable MLB team reference, keyed by the team IDs the MLB Stats API returns.
// We key on ID (not name) because IDs never change, while names occasionally do.
// `slug` powers clean, readable URLs; `abbr` is handy for compact UI later.

export interface Team {
  id: number;
  name: string;   // full name as the API reports it
  slug: string;   // url-safe nickname, e.g. "dodgers", "red-sox"
  abbr: string;   // 2–3 letter code
}

export const TEAMS: Record<number, Team> = {
  108: { id: 108, name: 'Los Angeles Angels', slug: 'angels', abbr: 'LAA' },
  109: { id: 109, name: 'Arizona Diamondbacks', slug: 'diamondbacks', abbr: 'ARI' },
  110: { id: 110, name: 'Baltimore Orioles', slug: 'orioles', abbr: 'BAL' },
  111: { id: 111, name: 'Boston Red Sox', slug: 'red-sox', abbr: 'BOS' },
  112: { id: 112, name: 'Chicago Cubs', slug: 'cubs', abbr: 'CHC' },
  113: { id: 113, name: 'Cincinnati Reds', slug: 'reds', abbr: 'CIN' },
  114: { id: 114, name: 'Cleveland Guardians', slug: 'guardians', abbr: 'CLE' },
  115: { id: 115, name: 'Colorado Rockies', slug: 'rockies', abbr: 'COL' },
  116: { id: 116, name: 'Detroit Tigers', slug: 'tigers', abbr: 'DET' },
  117: { id: 117, name: 'Houston Astros', slug: 'astros', abbr: 'HOU' },
  118: { id: 118, name: 'Kansas City Royals', slug: 'royals', abbr: 'KC' },
  119: { id: 119, name: 'Los Angeles Dodgers', slug: 'dodgers', abbr: 'LAD' },
  120: { id: 120, name: 'Washington Nationals', slug: 'nationals', abbr: 'WSH' },
  121: { id: 121, name: 'New York Mets', slug: 'mets', abbr: 'NYM' },
  133: { id: 133, name: 'Athletics', slug: 'athletics', abbr: 'ATH' },
  134: { id: 134, name: 'Pittsburgh Pirates', slug: 'pirates', abbr: 'PIT' },
  135: { id: 135, name: 'San Diego Padres', slug: 'padres', abbr: 'SD' },
  136: { id: 136, name: 'Seattle Mariners', slug: 'mariners', abbr: 'SEA' },
  137: { id: 137, name: 'San Francisco Giants', slug: 'giants', abbr: 'SF' },
  138: { id: 138, name: 'St. Louis Cardinals', slug: 'cardinals', abbr: 'STL' },
  139: { id: 139, name: 'Tampa Bay Rays', slug: 'rays', abbr: 'TB' },
  140: { id: 140, name: 'Texas Rangers', slug: 'rangers', abbr: 'TEX' },
  141: { id: 141, name: 'Toronto Blue Jays', slug: 'blue-jays', abbr: 'TOR' },
  142: { id: 142, name: 'Minnesota Twins', slug: 'twins', abbr: 'MIN' },
  143: { id: 143, name: 'Philadelphia Phillies', slug: 'phillies', abbr: 'PHI' },
  144: { id: 144, name: 'Atlanta Braves', slug: 'braves', abbr: 'ATL' },
  145: { id: 145, name: 'Chicago White Sox', slug: 'white-sox', abbr: 'CWS' },
  146: { id: 146, name: 'Miami Marlins', slug: 'marlins', abbr: 'MIA' },
  147: { id: 147, name: 'New York Yankees', slug: 'yankees', abbr: 'NYY' },
  158: { id: 158, name: 'Milwaukee Brewers', slug: 'brewers', abbr: 'MIL' },
};

/** Generic slugify fallback for any name not in the table (keeps URLs sane). */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** URL-safe nickname for a team, by id (preferred) with a name fallback. */
export function teamSlug(id: number | null | undefined, name: string): string {
  if (id != null && TEAMS[id]) return TEAMS[id].slug;
  return slugify(name);
}
