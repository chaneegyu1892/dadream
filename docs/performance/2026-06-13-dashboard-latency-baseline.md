# Dadream dashboard latency baseline

Captured: 2026-06-13 15:56:08 KST

## Context

This is the first baseline after adding route-level loading skeletons. Production pages are protected by Vercel/auth, so this pass measures the database side through Supabase SQL and records the current data shape. A browser/session-based route timing pass should follow with an authenticated account.

## Current data shape

| Area | Rows observed |
| --- | ---: |
| Active members | 350 |
| Active members with `photo_path` | 0 |
| Cells | 46 |
| Events in current calendar window | 0 |
| Confirmed visits in current calendar window | 0 |
| Active visits | 0 |
| Past visits | 1 |
| Service roles | 5 |
| Current-week service assignments | 0 |
| Pending profiles | 0 |
| Linked profiles | 1 |
| Meetings | 0 |

## Initial database timing observations

Representative `EXPLAIN (ANALYZE, BUFFERS)` checks:

| Query shape | Actual execution time |
| --- | ---: |
| `/members` overview active member summary, 350 rows via `members_active_name_idx` | ~5.5 ms on first sampled run |
| `/members` paged grid first 48 active members via `members_active_name_idx` | ~0.15 ms |
| `cells` ordered by `sort_order`, 46 rows | ~2.5 ms |
| `/visits` events date window, currently 0 rows via `events_starts_at_idx` | ~0.14 ms |
| `/visits` active visit requests, currently 0 active rows | ~0.20 ms |

## Early interpretation

- Current production-sized data is small. Database execution time is not obviously the dominant bottleneck yet.
- `/members` overview still fetches all 350 active member summaries. It is acceptable now, but it remains the main growth-sensitive query.
- Photo signed URL generation is currently not a bottleneck because active members have no `photo_path` values.
- `/visits`, `/admin/meetings`, `/admin/approvals`, and `/admin/weddings` currently have very small row counts, so perceived latency there is more likely auth/layout/network/render overhead than table scan cost.

## Next measurement steps

1. Add or run authenticated route-level timing so we can capture full server render time per page, not just database execution.
2. Measure these pages in order: `/members`, `/visits`, `/service`, `/admin/approvals`, `/admin/meetings`, `/admin/weddings`, `/members/[id]`.
3. If route timings show `/members` or `/service` as slow, optimize those first because they touch the largest table (`members`).
4. After route timings, run Supabase advisor review for index/RLS recommendations before adding cache/realtime.
