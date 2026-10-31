// One ticket per problem. The causes are counted the desk's way (causes.ts, as CauseTable does).
// Reports the desk read as a one-day move (desk-notes.json) stay counted under their cause, but they
// are a problem of their own: no parser or hint fix touches a date that moved by one day.
import { groupByCause, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'unplaced' | 'one-day';

export type ProblemRow = {
  problem: Problem;
  reports: Report[];
  taggedAs: Record<string, number>;
  tenants: string[];
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
  // The cause these reports are also counted under, when they are.
  alsoIn: Problem[];
};

const tally = (rs: Report[], key: (r: Report) => string) =>
  rs.reduce<Record<string, number>>((n, r) => ({ ...n, [key(r)]: (n[key(r)] ?? 0) + 1 }), {});

function row(problem: Problem, rs: Report[], alsoIn: Problem[] = []): ProblemRow {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    taggedAs: tally(rs, (r) => r.meta.intakeTag),
    tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
    channels: tally(rs, (r) => r.channel),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
    alsoIn,
  };
}

export function problemRows(reports: Report[], tenantOf: (r: Report) => Tenant | undefined, oneDayMove: readonly string[]): ProblemRow[] {
  const groups = groupByCause(reports, tenantOf);
  const rows = groups.map((g) => row(g.cause, g.reports));
  const moved = reports.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) {
    const alsoIn = groups.filter((g) => g.reports.some((r) => oneDayMove.includes(r.id))).map((g) => g.cause);
    rows.push(row('one-day', moved, alsoIn));
  }
  return rows;
}
