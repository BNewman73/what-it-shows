<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { problemRows, type Problem } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';

  type Track = { issue: string; status: string };
  // Where each problem is tracked and where it stands: problem → { issue link, status }.
  let { ticket, tracked = {} }: { ticket: number; tracked?: Partial<Record<Problem, Track>> } = $props();

  const exported = $derived((reports as Report[]).filter((r) => r.mergedInto === ticket));
  const merged = $derived(uniqueById(exported));
  const rows = $derived(problemRows(merged, tenantOf, notes.oneDayMove));
  const list = (n: Record<string, number>) =>
    Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket}
  ({exported.length - merged.length} more rows in the export are the same reports twice) ·
  <strong>{rows.length}</strong>
  {rows.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>tagged at intake as</th><th>seen</th><th>ticket</th><th>status</th></tr>
  </thead>
  <tbody>
    {#each rows as g (g.problem)}
      {@const t = tracked[g.problem]}
      <tr class:open={!t || t.status === 'open'}>
        <td><code>{g.problem}</code></td>
        <td>
          <strong>{g.reports.length}</strong>
          {#if g.alsoIn.length}<span class="small">(also in {g.alsoIn.join(', ')})</span>{/if}
        </td>
        <td title={g.tenants.join(', ')}>{g.tenants.length}</td>
        <td class="small">{list(g.channels)}</td>
        <td class="small">{list(g.taggedAs)}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>{#if t}<a href={t.issue}>{t.issue.replace(/^.*\/issues\//, '#')}</a>{:else}<span class="none">none</span>{/if}</td>
        <td class="status">{t?.status ?? 'open'}</td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>all</td><td><strong>{merged.length}</strong></td><td colspan="6"></td></tr>
  </tfoot>
</table>

{#each rows.filter((g) => g.problem !== 'parser') as g (g.problem)}
  <details>
    <summary><code>{g.problem}</code>: the {g.reports.length} reports, by id</summary>
    <p class="ids">{g.reports.map((r) => r.id).join(' ')}</p>
  </details>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
  .ids { font: 0.8rem var(--mono); color: var(--muted); }
  .open td { background: var(--warn-bg); }
  .open .status { color: var(--warn); font-weight: 600; }
  tfoot td { border-top: 2px solid var(--line); }
</style>
