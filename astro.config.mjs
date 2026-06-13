// @ts-check
import { defineConfig } from 'astro/config';

// The public URL of the live site — powers canonical URLs and sharing links.
// On Netlify, the `URL` env var is set automatically to the site's address, so
// this stays correct even if you rename the site. The fallback is used for local
// builds. `SITE_URL` lets you override everything if you add a custom domain.
const SITE =
  process.env.SITE_URL ||
  process.env.URL ||
  'https://brilliant-mermaid-1b9bc0.netlify.app';

export default defineConfig({
  site: SITE,
  // Static output: every page is plain HTML built ahead of time. Fast, free to
  // host, and nothing to hack — there is no server or database at runtime.
  output: 'static',
});
