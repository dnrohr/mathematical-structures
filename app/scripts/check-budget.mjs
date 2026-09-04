/**
 * The JS budget gate (ARCHITECTURE.md §5.1, ROADMAP M6 exit criterion):
 * total app JavaScript ≤ 200 KB gzipped, excluding data. Run after
 * `npm run build`; CI runs it on every push so the budget is enforced,
 * not aspirational. Data artifacts (dist/data) are reported for the §4.5
 * split decision but never counted against the JS budget.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 200;

const distAssets = new URL('../../dist/assets/', import.meta.url);
const distData = new URL('../../dist/data/', import.meta.url);

const gzipKb = (url) => gzipSync(readFileSync(url), { level: 9 }).length / 1024;

let names;
try {
  names = readdirSync(distAssets);
} catch {
  console.error('dist/assets not found — run `npm run build` first.');
  process.exit(2);
}

let totalKb = 0;
for (const name of names.filter((n) => n.endsWith('.js')).sort()) {
  const kb = gzipKb(new URL(name, distAssets));
  totalKb += kb;
  console.log(`js  ${name}  ${kb.toFixed(1)} KB gzipped`);
}

for (const name of readdirSync(distData).sort()) {
  const file = new URL(name, distData);
  console.log(
    `data  ${name}  ${(statSync(file).size / 1024).toFixed(1)} KB raw, ` +
      `${gzipKb(file).toFixed(1)} KB gzipped (not counted)`,
  );
}

console.log(
  `\nJS total: ${totalKb.toFixed(1)} KB gzipped — budget ${String(BUDGET_KB)} KB ` +
    `(${((totalKb / BUDGET_KB) * 100).toFixed(0)}% used)`,
);
if (totalKb > BUDGET_KB) {
  console.error(`over budget by ${(totalKb - BUDGET_KB).toFixed(1)} KB`);
  process.exit(1);
}
