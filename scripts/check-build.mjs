import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
assert.equal(readFileSync('docs/CNAME', 'utf8').trim(), 'www.schoensaufen.at');
const html = readFileSync('docs/index.html', 'utf8');
assert.match(html, /lang="de"/);
assert.doesNotMatch(html, /src\/main/);
for (const [, path] of html.matchAll(/(?:src|href)="(\/[^\"]+)"/g)) {
  assert.ok(readFileSync(`docs${path}`).length, `Missing asset: ${path}`);
}
const js = readdirSync('docs/assets').filter(name => name.endsWith('.js'))
  .map(name => readFileSync(`docs/assets/${name}`, 'utf8')).join('\n');
for (const marker of ['Bier-Routenplaner', 'Bier-Spots im Radius', 'overpass-api.de', 'router.project-osrm.org']) {
  assert.ok(js.includes(marker), `Planner missing from build: ${marker}`);
}
console.log('Published planner, domain and asset references verified.');
