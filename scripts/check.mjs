import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=resolve(root,'dist');
async function files(path){return (await Promise.all((await readdir(path,{withFileTypes:true})).map(d=>d.isDirectory()?files(resolve(path,d.name)):[resolve(path,d.name)]))).flat();}
const all=await files(dist);let count=0;
for(const file of all){
  if(extname(file)==='.js'){execFileSync(process.execPath,['--check',file]);count++;}
  if(!['.js','.html','.css'].includes(extname(file)))continue;
  const content=await readFile(file,'utf8'),refs=[];
  if(extname(file)==='.js')for(const m of content.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g))if(m[1].startsWith('.'))refs.push(resolve(dirname(file),m[1]));
  if(extname(file)==='.html')for(const m of content.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g))refs.push(resolve(dirname(file),m[1]));
  if(extname(file)==='.css')for(const m of content.matchAll(/url\(['"]?(\.\/[^)'" ]+)['"]?\)/g))refs.push(resolve(dirname(file),m[1]));
  for(const ref of refs)if(!(await stat(ref).catch(()=>null))?.isFile())throw new Error(`Missing asset: ${ref}`);
}
const {PORTFOLIO}=await import('../dist/js/portfolio-data.js');
for(const p of PORTFOLIO)for(const image of new Set([p.image,...p.gallery]))if(!(await stat(resolve(dist,image)).catch(()=>null))?.isFile())throw new Error(`Missing portfolio asset: ${image}`);
console.log(`PASS: ${count} JavaScript modules; ${all.length} files; all imports, fonts, and ${PORTFOLIO.length} portfolio galleries resolve.`);
