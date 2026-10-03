const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const raw = html.match(/<script id="atlas-data" type="application\/json">([\s\S]*?)<\/script>/)[1];
const data = JSON.parse(raw);
const source = fs.readFileSync(path.join(root,'app/app.js'),'utf8');
const marker = 'window.PsychologyAtlas={data:D,search:searchCards,related};';
assert.ok(source.includes(marker));
const context = {window:{},document:{getElementById:()=>({textContent:raw})},location:{hash:''},URLSearchParams};
vm.runInNewContext(source.slice(0,source.indexOf(marker)+marker.length)+'\n})();',context);
const atlas = context.window.PsychologyAtlas;
const checks = [];
function check(query,expected){
  const top=atlas.search(query).slice(0,8).map(x=>x.card.title);
  assert.ok(top.some(t=>expected.test(t)),`${query}: ${top.join(' / ')}`);
  checks.push({query,top:top.slice(0,3)});
}
check('工作记忆',/工作记忆/);
check('cognitive dissonance',/认知失调/);
check('为什么会习惯',/习惯化/);
check('群体压力',/规范性社会影响|从众/);
check('分心',/注意负荷|注意/);
check('为什么失去比得到更难受',/前景|损失/);
check('如何调节情绪',/情绪调节/);
check('如果遇到某种情况就采取行动',/实施意图/);
check('desensitization',/去敏化/);
check('去敏化',/去敏化/);
check('看多了以后不再震惊',/去敏化/);
check('情绪劳动',/情绪劳动/);
check('阻断效应',/阻断/);
check('认知重评',/认知重评/);
assert.equal(atlas.search('xqzunfindable7193').length,0);
const ids = new Set(data.cards.map(c=>c.id));
assert.equal(ids.size,data.cards.length);
assert.equal(data.books.length,5);
assert.equal(data.chapters.length,81);
for(const ch of data.chapters){assert.ok(ch.cardIds.length>=2,`Empty chapter ${ch.id}`);for(const id of ch.cardIds)assert.ok(ids.has(id),id)}
const pairs = new Set();
for(const r of data.relations){assert.ok(ids.has(r.source)&&ids.has(r.target));assert.notEqual(r.source,r.target);const key=[r.source,r.target].sort().join('|');assert.ok(!pairs.has(key));pairs.add(key);assert.ok(r.reason)}
for(const c of data.collections){assert.ok(c.cardIds.length>0);for(const id of c.cardIds)assert.ok(ids.has(id))}
const backup=fs.readFileSync(path.join(root,'backups/心理学知识库.md'),'utf8');
for(const c of data.cards){assert.ok(backup.includes(`## ${c.title} · ${c.english}`));assert.ok(c.sources.length);assert.ok(c.sections.length>=3)}
assert.ok(!/<script[^>]+src=/.test(html),'Unexpected external script');
assert.ok(!html.includes('__DATA__')&&!html.includes('__APP__')&&!html.includes('__STYLE__'));
console.log(JSON.stringify({passed:true,cards:data.cards.length,chapters:data.chapters.length,relations:data.relations.length,searchChecks:checks},null,2));
