#!/usr/bin/env node
/**
 * Lightweight Dadream route timing baseline helper.
 *
 * Public routes are measured by default. To measure protected routes from a logged-in
 * browser session, pass cookies via DADREAM_COOKIE; the value is sent as a Cookie
 * header but never printed.
 *
 * Usage:
 *   node scripts/perf-baseline.mjs
 *   DADREAM_BASE_URL=https://dadream-pi.vercel.app node scripts/perf-baseline.mjs
 *   DADREAM_COOKIE='name=value; ...' node scripts/perf-baseline.mjs
 */

const baseUrl = process.env.DADREAM_BASE_URL ?? 'https://dadream-pi.vercel.app';
const cookie = process.env.DADREAM_COOKIE;
const publicPaths = ['/launch', '/login', '/manifest.webmanifest'];
const protectedPaths = cookie ? ['/', '/members', '/visits'] : [];
const paths = [...publicPaths, ...protectedPaths];
const runs = Number.parseInt(process.env.DADREAM_PERF_RUNS ?? '3', 10);

async function measure(path) {
  const url = new URL(path, baseUrl);
  const samples = [];

  for (let i = 0; i < runs; i += 1) {
    const start = performance.now();
    const response = await fetch(url, {
      redirect: 'manual',
      headers: cookie ? { cookie } : undefined,
    });
    const firstByteMs = performance.now() - start;
    samples.push({ status: response.status, firstByteMs });
    // Drain the body so the connection can be reused without measuring full render as TTFB.
    await response.arrayBuffer().catch(() => undefined);
  }

  const avg = samples.reduce((sum, s) => sum + s.firstByteMs, 0) / samples.length;
  const statuses = [...new Set(samples.map((s) => s.status))].join(',');
  return { path, statuses, avg: Math.round(avg), samples: samples.map((s) => Math.round(s.firstByteMs)) };
}

console.log(`Dadream route timing baseline: ${baseUrl}`);
console.log(`runs=${runs} protected=${cookie ? 'yes' : 'no (set DADREAM_COOKIE to include /, /members, /visits)'}`);

for (const path of paths) {
  const result = await measure(path);
  console.log(`${result.path.padEnd(22)} status=${result.statuses.padEnd(7)} avg_ttfb=${String(result.avg).padStart(4)}ms samples=${result.samples.join(',')}ms`);
}
