<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { groupByProblem, type Problem } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';

  // issues: where each problem is tracked, problem → link.
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, string>> } = $props();

  const exported = $derived((reports as Report[]).filter((r) => r.mergedInto === ticket));
  const merged = $derived(uniqueById(exported));
  const groups = $derived(groupByProblem(merged, tenantOf, notes.oneDayMove));
  const list = (n: Record<string, number>) =>
    Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket}
  ({exported.length - merged.length} more rows in the export are the same reports twice) ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>tagged at intake as</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td><strong>{g.reports.length}</strong></td>
        <td title={g.tenants.join(', ')}>{g.tenants.length}</td>
        <td class="small">{list(g.channels)}</td>
        <td class="small">{list(g.taggedAs)}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if g.problem !== 'unplaced' && issues[g.problem]}
            <a href={issues[g.problem]}>{issues[g.problem]?.replace(/^.*\/issues\//, '#')}</a>
          {:else}
            <span class="none">none</span>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>all</td><td><strong>{groups.reduce((n, g) => n + g.reports.length, 0)}</strong></td><td colspan="5"></td></tr>
  </tfoot>
</table>

{#each groups.filter((g) => g.problem !== 'parser' && g.problem !== 'unplaced') as g (g.problem)}
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
  tfoot td { border-top: 2px solid var(--line); }
</style>
