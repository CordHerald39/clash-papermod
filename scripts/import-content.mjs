import {readFile,mkdir,writeFile,rename,unlink} from 'node:fs/promises';import path from 'node:path';
const source=process.argv[2];if(!source)throw new Error('Usage: node scripts/import-content.mjs <JSON-file>');
const a=JSON.parse(await readFile(source,'utf8'));const string=(v,k)=>{if(typeof v!=='string'||!v.trim())throw new Error(`Missing ${k}`);return v.trim()};
const slug=string(a.slug,'slug');if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>120)throw new Error('Invalid slug');
const date=(v,k)=>{string(v,k);if(!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v.slice(0,10)+'T00:00:00Z').toISOString().slice(0,10)!==v.slice(0,10))throw new Error(`Invalid ${k}`);return v};
string(a.id,'id');string(a.title,'title');string(a.description,'description');string(a.body,'body');string(a.category,'category');date(a.publishedAt,'publishedAt');date(a.updatedAt,'updatedAt');if(Date.parse(a.updatedAt)<Date.parse(a.publishedAt))throw new Error('updatedAt precedes publishedAt');if(!['draft','published'].includes(a.status))throw new Error('Invalid status');if(!Array.isArray(a.tags)||a.tags.some(t=>typeof t!=='string'))throw new Error('Invalid tags');if(!Array.isArray(a.sources))throw new Error('Invalid sources');
const escape=s=>s.replace(/[\[\]\\]/g,'\\$&').replace(/[\r\n]/g,' ');
const refs=a.sources.map(s=>{string(s.title,'source title');const url=new URL(s.url);if(!['https:','http:'].includes(url.protocol))throw new Error('Invalid source protocol');return `- [${escape(s.title)}](<${url.href}>)`});
const base=path.resolve(import.meta.dirname,'..');const config=JSON.parse(await readFile(path.join(base,'site.config.json'),'utf8'));
const meta={title:a.title,description:a.description,date:a.publishedAt,lastmod:a.updatedAt,draft:a.status==='draft',tags:a.tags,categories:[a.category],contentId:a.id,type:'post'};
const text='---\n'+JSON.stringify(meta,null,2)+'\n---\n\n'+a.body+(refs.length?'\n\n## 资料来源\n\n'+refs.join('\n'):'')+'\n';const dir=path.join(base,'content/blog');await mkdir(dir,{recursive:true});const target=path.join(dir,slug+'.md');const temp=target+'.tmp-'+process.pid;try{await writeFile(temp,text,{flag:'wx'});await rename(temp,target)}catch(e){await unlink(temp).catch(()=>{});throw e}console.log(`Imported ${slug} (${a.status})`);

