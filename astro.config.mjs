// @ts-check
import { defineConfig } from 'astro/config';

// The public URL of the live site. Update this once you know your Vercel/Netlify
// domain — it powers canonical URLs and the sitemap. Safe to leave as-is for now.
const SITE = process.env.SITE_URL || 'https://the-honest-line.vercel.app';

export default defineConfig({
  site: SITE,
  // Static output: every page is plain HTML built ahead of time. Fast, free to
  // host, and nothing to hack — there is no server or database at runtime.
  output: 'static',
});
