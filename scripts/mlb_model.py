#!/usr/bin/env python3
"""
The Honest Line - MLB win-probability engine (Phase 1 baseline).

Pulls today's MLB schedule + probable starters from the free, official
MLB Stats API (no key required), grabs team season win% and each starter's
season ERA, then produces a transparent baseline P(home win) using:

    log5 (team strength)  +  home-field edge  +  pitcher adjustment

This model is deliberately simple. The whole discipline of the project:
a fancier model only earns its place if it beats THIS one on games it has
never seen. Start here, grade ruthlessly, add complexity only when it pays.

NOTE: the market / closing line is NOT in the MLB Stats API. See fetch_odds()
for where The Odds API (free tier, needs a key) plugs in separately.

Usage:
    python mlb_model.py                  # today's slate
    python mlb_model.py --date 2026-06-12
    python mlb_model.py --demo           # mock data, no network, proves the math
    python mlb_model.py --out preds.json # write JSON for the site to consume
"""

import argparse
import json
import sys
import datetime as dt

try:
    import requests
except ImportError:
    requests = None  # only needed for live pulls, not --demo

API = "https://statsapi.mlb.com/api/v1"
HOME_EDGE = 0.035        # home teams win ~54% historically; documented nudge
LEAGUE_ERA = 4.10        # rough MLB average ERA; refine per-season if you like
TIMEOUT = 15


# ---------------------------------------------------------------- data pulls

def _get(url, params=None):
    if requests is None:
        raise RuntimeError("`requests` not installed. Use --demo, or `pip install requests`.")
    r = requests.get(url, params=params, timeout=TIMEOUT)
    r.raise_for_status()
    return r.json()


def fetch_schedule(date):
    """Today's games with probable starters. Free, official, no key."""
    data = _get(f"{API}/schedule", {
        "sportId": 1,
        "date": date,
        "hydrate": "probablePitcher,team",
    })
    games = []
    for d in data.get("dates", []):
        for g in d.get("games", []):
            home, away = g["teams"]["home"], g["teams"]["away"]
            games.append({
                "gamePk": g.get("gamePk"),
                "gameDate": date,
                "startTime": g.get("gameDate"),
                "home": home["team"]["name"],
                "homeId": home["team"]["id"],
                "away": away["team"]["name"],
                "awayId": away["team"]["id"],
                "homePitcher": (home.get("probablePitcher") or {}).get("fullName"),
                "homePitcherId": (home.get("probablePitcher") or {}).get("id"),
                "awayPitcher": (away.get("probablePitcher") or {}).get("fullName"),
                "awayPitcherId": (away.get("probablePitcher") or {}).get("id"),
            })
    return games


def fetch_team_winpct(season):
    """Map of teamId -> season winning percentage."""
    pct = {}
    try:
        data = _get(f"{API}/standings", {
            "leagueId": "103,104", "season": season, "standingsTypes": "regularSeason",
        })
        for rec in data.get("records", []):
            for t in rec.get("teamRecords", []):
                pct[t["team"]["id"]] = float(t.get("winningPercentage") or 0.5)
    except Exception as e:
        print(f"  (standings unavailable, defaulting to .500: {e})", file=sys.stderr)
    return pct


def fetch_pitcher_era(pid, season):
    """A starter's season ERA, or None if unavailable (early season, call-up, etc.)."""
    if not pid:
        return None
    try:
        data = _get(f"{API}/people/{pid}/stats", {
            "stats": "season", "group": "pitching", "season": season,
        })
        splits = (data.get("stats") or [{}])[0].get("splits", [])
        if not splits:
            return None
        era = splits[0].get("stat", {}).get("era")
        return float(era) if era not in (None, "-", "") else None
    except Exception:
        return None


def fetch_odds(date, api_key=None):
    """
    STUB. The closing line lives outside the MLB Stats API.
    Wire up The Odds API (the-odds-api.com) here:

        GET https://api.the-odds-api.com/v4/sports/baseball_mlb/odds
            ?regions=us&markets=h2h&apiKey=YOUR_KEY

    Convert American odds -> implied probability, de-vig, and attach a
    `pClose` (market P(home win)) to each game. Free tier ~500 calls/month,
    which covers one daily pull. Until then, pClose stays None and the
    'vs market' panels simply read 'no line yet' instead of faking one.
    """
    return {}


# ---------------------------------------------------------------- the model

def log5(a, b):
    """Bill James log5: P(team A beats team B) from their win rates."""
    denom = a + b - 2 * a * b
    return 0.5 if denom == 0 else (a - a * b) / denom


def pitcher_factor(era):
    """ERA vs league -> small, capped win-prob nudge for that pitcher's team."""
    if era is None:
        return 0.0
    nudge = (LEAGUE_ERA - era) * 0.012        # ~1.2 prob points per run of ERA
    return max(-0.06, min(0.06, nudge))       # capped so one number can't dominate


def model_prob(g, winpct):
    a = winpct.get(g["homeId"], 0.5)
    b = winpct.get(g["awayId"], 0.5)
    base = log5(a, b)                         # team strength only
    p = base + HOME_EDGE
    p += pitcher_factor(g.get("homeEra"))     # home starter helps home
    p -= pitcher_factor(g.get("awayEra"))     # away starter helps away
    p = max(0.05, min(0.95, p))
    # keep the pieces so the site can render an honest "why"
    g["components"] = {
        "homeWinPct": round(a, 3),
        "awayWinPct": round(b, 3),
        "log5_base": round(base, 3),
        "home_edge": HOME_EDGE,
        "home_pitcher_adj": round(pitcher_factor(g.get("homeEra")), 3),
        "away_pitcher_adj": round(-pitcher_factor(g.get("awayEra")), 3),
    }
    return round(p, 3)


def explain(g):
    """Plain-English 'why', built from the components."""
    c = g["components"]
    bits = []
    diff = c["homeWinPct"] - c["awayWinPct"]
    if abs(diff) >= 0.04:
        bits.append(f"{'home' if diff > 0 else 'away'} team the stronger club so far")
    if g.get("homeEra") is not None and g.get("awayEra") is not None:
        bits.append(f"starters {g['homeEra']:.2f} vs {g['awayEra']:.2f} ERA")
    bits.append("home-field edge")
    return "; ".join(bits)


# ---------------------------------------------------------------- run

def build_predictions(date, season):
    games = fetch_schedule(date)
    if not games:
        return []
    winpct = fetch_team_winpct(season)
    for g in games:
        g["homeEra"] = fetch_pitcher_era(g.get("homePitcherId"), season)
        g["awayEra"] = fetch_pitcher_era(g.get("awayPitcherId"), season)
        g["pHome"] = model_prob(g, winpct)
        g["pClose"] = None                    # filled once fetch_odds() is wired up
        g["why"] = explain(g)
        g["result"] = None                    # graded later, after the game
    return games


def demo_games():
    """Mock slate so you can see the math run with zero network calls."""
    raw = [
        # home, hWin%, hPitcherERA, away, aWin%, aPitcherERA
        ("Dodgers", .604, 2.91, "Padres", .540, 3.85),
        ("Yankees", .560, 4.40, "Red Sox", .505, 3.10),
        ("Mets", .480, 4.95, "Braves", .585, 2.70),
        ("Mariners", .520, 3.30, "Astros", .560, 3.60),
    ]
    games = []
    for i, (h, hw, he, a, aw, ae) in enumerate(raw):
        g = {
            "gamePk": 700000 + i, "gameDate": "DEMO", "startTime": None,
            "home": h, "homeId": 100 + i, "away": a, "awayId": 200 + i,
            "homePitcher": f"{h} SP", "homePitcherId": None,
            "awayPitcher": f"{a} SP", "awayPitcherId": None,
            "homeEra": he, "awayEra": ae,
        }
        winpct = {100 + i: hw, 200 + i: aw}
        g["pHome"] = model_prob(g, winpct)
        g["pClose"] = None
        g["why"] = explain(g)
        g["result"] = None
        games.append(g)
    return games


def print_table(games):
    print(f"\n{'MATCHUP':<26}{'MODEL P(HOME)':>14}{'MARKET':>9}{'EDGE':>8}")
    print("-" * 57)
    for g in games:
        line = f"{g['away']} @ {g['home']}"
        market = f"{g['pClose']*100:.0f}%" if g.get("pClose") is not None else "  -"
        edge = f"{(g['pHome']-g['pClose'])*100:+.0f}%" if g.get("pClose") is not None else "  -"
        print(f"{line:<26}{g['pHome']*100:>12.0f}%{market:>9}{edge:>8}")
        print(f"    why: {g['why']}")
    print()


def main():
    ap = argparse.ArgumentParser(description="The Honest Line - MLB win-probability engine")
    ap.add_argument("--date", default=dt.date.today().isoformat(), help="YYYY-MM-DD")
    ap.add_argument("--demo", action="store_true", help="run on mock data, no network")
    ap.add_argument("--out", help="write predictions JSON to this path")
    args = ap.parse_args()

    if args.demo:
        print("Running in DEMO mode (mock data, no network).")
        games = demo_games()
        date = "DEMO"
    else:
        season = int(args.date[:4])
        print(f"Pulling MLB slate for {args.date} ...")
        games = build_predictions(args.date, season)
        date = args.date
        if not games:
            print("No games scheduled (or none returned). Nothing to predict.")
            return

    print_table(games)

    if args.out:
        # what the site commits to the public repo = the timestamped, locked ledger
        payload = {
            "date": date,
            "generatedAt": dt.datetime.utcnow().isoformat() + "Z",
            "model": "honest-line-v1",
            "games": games,
        }
        with open(args.out, "w") as f:
            json.dump(payload, f, indent=2)
        print(f"Wrote {len(games)} predictions -> {args.out}")


if __name__ == "__main__":
    main()
