# The Honest Line

A public, daily-updating **honesty meter for MLB predictions** — not a betting service.

Every game gets a model win probability that is **posted before first pitch, never edited,
never deleted**, and committed to this public repository. The commit history is the
tamper-evident proof of what we predicted and when. We grade every call in the open and
track how accurate the model really is — including when it's wrong.

## How it works (no database, no accounts)

1. **The model** (`scripts/mlb_model.py`) pulls today's real MLB slate and probable
   starters from the free MLB Stats API and outputs each game's `P(home win)` plus a
   plain-English "why."
2. **The ledger** is git itself. Each morning a GitHub Action runs the model, writes
   `src/data/predictions/YYYY-MM-DD.json`, and commits it *before games start*. Nothing is
   ever deleted.
3. **The site** is a static Astro build. It reads the committed JSON files at build time and
   turns them into the homepage and one page per matchup. Plain HTML — fast and free to host.
4. **Deploy** is automatic: every commit (including the daily one) triggers a rebuild on
   Vercel/Netlify.

## Local development

```bash
npm install        # one time
npm run dev        # local preview at http://localhost:4321
npm run build      # production build into dist/
```

To regenerate today's predictions locally:

```bash
pip install -r requirements.txt
python scripts/mlb_model.py --date 2026-06-13 --out src/data/predictions/2026-06-13.json
```

## The market line (optional)

The MLB Stats API has **no betting odds**. To show a market probability for the
"model vs market" calibration comparison, set an API key from
[the-odds-api.com](https://the-odds-api.com) as a repository secret named `ODDS_API_KEY`.
Without it, the site honestly shows "no market line yet" — it never fakes a number.

## Roadmap

- **Phase 1 (now):** today's games + model probabilities, live.
- **Phase 2:** grade finished games, Brier score + calibration diagram, the Truth Meter.
- **Phase 3:** full searchable archive (by date and team).
- **Phase 4:** polish, sitemap, market line.
- **v2.1 (later, out of scope):** accounts, paid tiers, newsletter, social cards, etc.
