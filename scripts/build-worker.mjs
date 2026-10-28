import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const compile=src=>ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const game=compile(readFileSync('src/game.ts','utf8')).replace(/export /g,'');
const api=compile(readFileSync('src/api.ts','utf8')).replace(/import .*?from ['"]\.\/game['"];?\n/g,'').replace(/export /g,'');
const assets={};
function collect(dir){for(const ent of readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,ent.name);if(ent.isDirectory())collect(file);else{const key='/'+path.relative('dist/client',file).split(path.sep).join('/');assets[key]={body:readFileSync(file,'utf8'),type:key.endsWith('.html')?'text/html; charset=utf-8':key.endsWith('.js')?'application/javascript; charset=utf-8':key.endsWith('.css')?'text/css; charset=utf-8':'text/plain; charset=utf-8'};}}}
collect('dist/client');assets['/']=assets['/index.html'];
const handler=`\nconst assets=${JSON.stringify(assets)};\nexport default {async fetch(request){const p=new URL(request.url).pathname;if(p==='/api/board'){if(request.method==='GET')return GET(request);if(request.method==='POST')return POST(request);return new Response('Method not allowed',{status:405});}const a=assets[p];if(!a)return new Response('Not found',{status:404});if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});return new Response(request.method==='HEAD'?null:a.body,{headers:{'Content-Type':a.type,'X-Content-Type-Options':'nosniff','Cache-Control':p.startsWith('/assets/')?'public,max-age=31536000,immutable':'no-cache','Referrer-Policy':'same-origin'}});}};\n`;
mkdirSync('dist',{recursive:true});writeFileSync('dist/worker.js',game+'\n'+api+handler);console.log('Built standalone Worker with '+Object.keys(assets).length+' asset routes.');
