import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const ts=require('typescript');
const dir=mkdtempSync(join(tmpdir(),'fooswins-test-'));let sqlite=new DatabaseSync(join(dir,'test.sqlite'));
sqlite.exec(readFileSync('migrations/0001_initial.sql','utf8'));
function prepared(sql,args=[]){return {bind(...a){return prepared(sql,a)},async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return {results:sqlite.prepare(sql).all(...args)}},async run(){return sqlite.prepare(sql).run(...args)},_sql:sql,_args:args};}
globalThis.__TEST_ENV={DB:{prepare:prepared,async batch(statements){sqlite.exec('BEGIN');try{const res=statements.map(s=>sqlite.prepare(s._sql).run(...s._args));sqlite.exec('COMMIT');return res;}catch(e){sqlite.exec('ROLLBACK');throw e;}}},ADMIN_PASSCODE:process.env.TEST_ADMIN_SECRET};
const routeSource=readFileSync('src/api.ts','utf8').replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__TEST_ENV;').replace("'./game'","'./game.mjs'");
writeFileSync(join(dir,'route.mjs'),ts.transpileModule(routeSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
writeFileSync(join(dir,'game.mjs'),ts.transpileModule(readFileSync('src/game.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
const {POST,GET}=await import(join(dir,'route.mjs')),game=await import(join(dir,'game.mjs'));let ip=1;
async function post(body,status=201,client=ip++){const r=await POST(new Request('https://test.local/api/board',{method:'POST',headers:{'content-type':'application/json','cf-connecting-ip':String(client)},body:JSON.stringify(body)}));const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
async function get(query=''){const r=await GET(new Request('https://test.local/api/board'+query));assert.equal(r.status,200);return r.json();}
const single=(w='JZ',l='Nolan',more={})=>({format:'singles',winners:[w],losers:[l],...more});
await post(single(' ＪＺ ',' nOLAn ',{winnerScore:10,loserScore:5}));
await post(single('Justin','Nolan Kha'));
await post(single('Justin Zhu','Chad'));
await post(single('CHADD','Nolan'));
let d=await get();assert.equal(d.players.length,3);assert.deepEqual(d.players.map(p=>p.name).sort(),['Chadd','Justin Zhu','Nolan Kha']);
await post(single('Nolan','Nolan Kha'),400);await post(single('', 'Alex'),400);await post(single('Amy','Bob',{winnerScore:11}),400);await post(single('Amy','Bob',{winnerScore:-1}),400);await post(single('Amy','Bob',{winnerScore:9.5}),400);await post(single('Amy','Bob',{winnerScore:3,loserScore:5}),400);
await post({format:'doubles',winners:['Justin','Nolan'],losers:['Chad','Alex'],winnerScore:10,loserScore:0});
await post({format:'doubles',winners:['Nolan Kha','Justin Zhu'],losers:['Alex','Chadd']});
d=await get();let rows=game.standings(d.matches,d.players);assert.equal(rows.length,5);const team=rows.find(r=>r.format==='doubles'&&r.wins===2);assert.equal(team.matches,2);assert.equal(team.rate,null);assert.equal(rows.find(r=>r.name==='Nolan Kha').wins,0);
for(let i=0;i<7;i++)await post(single());d=await get();rows=game.standings(d.matches,d.players);assert.equal(rows.find(r=>r.name==='Justin Zhu').rate,100);assert.equal(rows.find(r=>r.name==='Justin Zhu').matches,10);assert.equal(rows.find(r=>r.format==='doubles'&&r.wins===2).rate,null);
const justin=d.players.find(p=>p.name==='Justin Zhu').id;const rec=game.record([justin],d.matches);assert.equal(rec.history.length,12);assert(Object.values(rec.breakdown[justin]).some(x=>x.format==='doubles'));const tr=game.record(team.ids,d.matches);assert.equal(tr.history.length,2);assert(tr.history.every(m=>m.format==='doubles'));assert.equal(Object.keys(tr.breakdown).length,2);
// Half-open day boundaries, independent of server timezone.
const start=new Date(2026,9,27).getTime(),end=new Date(2026,9,28).getTime();const ms=d.matches.slice(0,4);for(let i=0;i<4;i++)sqlite.prepare('UPDATE matches SET created_at=? WHERE id=?').run([start-1,start,end-1,end][i],ms[i].id);const today=await get(`?start=${start}&end=${end}`);assert(today.matches.some(m=>m.id===ms[1].id));assert(today.matches.some(m=>m.id===ms[2].id));assert(!today.matches.some(m=>m.id===ms[0].id||m.id===ms[3].id));
// Reopen the file to verify persisted references and results.
const before=await get();sqlite.close();sqlite=new DatabaseSync(join(dir,'test.sqlite'));assert.deepEqual(await get(),before);
await post({winners:['change Justin to Jay'],passcode:'incorrect'},403);await post({winners:['change Justin to Jay'],passcode:process.env.TEST_ADMIN_SECRET},200);d=await get();assert.equal(d.matches.length,before.matches.length);assert(d.players.some(p=>p.id===justin&&p.name==='Jay'));await post(single('JZ','Nolan'));d=await get();assert.equal(d.players.length,4);assert(game.standings(d.matches,d.players).some(r=>r.name==='Jay + Nolan Kha'||r.name==='Nolan Kha + Jay'));
await post({winners:['change Jay to Chadd'],passcode:process.env.TEST_ADMIN_SECRET},409);
for(let i=0;i<5;i++)await post({winners:['delete Jay'],passcode:'incorrect'},403,999);await post({winners:['delete Jay'],passcode:process.env.TEST_ADMIN_SECRET},429,999);
await post({winners:['delete Jay'],passcode:process.env.TEST_ADMIN_SECRET},200);d=await get();assert(!d.players.some(p=>p.id===justin));assert(!d.matches.some(m=>[m.w1,m.w2,m.l1,m.l2].includes(justin)));assert.equal(d.matches.length,1);
assert.equal(game.baseKey('  ＪＵＳＴＩＮ   ＺＨＵ '),game.baseKey('JZ'));assert.notEqual(game.baseKey('John'),game.baseKey('Jon'));
console.log('PASS: validation, Unicode aliases, singles/doubles standings, rate threshold, records, day boundaries, SQLite persistence, rename/history, deletion, passcode protection, and rate limits.');
sqlite.close();rmSync(dir,{recursive:true});
