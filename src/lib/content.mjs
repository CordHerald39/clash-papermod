import fs from 'node:fs';import path from 'node:path';import {parse} from 'yaml';import {marked} from 'marked';import savedConfig from '../../site.config.json';
const siteUrl=new URL(process.env.SITE_URL||savedConfig.site);
const deployBase=process.env.DEPLOY_BASE||siteUrl.pathname||'/';
const config={...savedConfig,site:new URL(deployBase.replace(/\/?$/,'/'),siteUrl.origin).href};
export const indexable=process.env.ALLOW_INDEX==='true'&&Boolean(process.env.SITE_URL)&&!/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(config.site);
const root=path.resolve('content');const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
export const base=import.meta.env.BASE_URL;export const href=p=>base.replace(/\/$/,'')+'/'+p.replace(/^\//,'');
export const pages=walk(root).filter(f=>f.endsWith('.md')).map(f=>{const raw=fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'');const m=raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);if(!m)throw new Error('Invalid content '+f);const data=parse(m[1]);const rel=path.relative(root,f).replaceAll('\\','/');const slug=rel.replace(/(?:\/)?_index\.md$/,'').replace(/\.md$/,'');let body=m[2].replace(/{{<\s*relref\s+"([^"]+)"\s*>}}/g,(_,p)=>href(p+'/'));const toc=[];let i=0;const renderer=new marked.Renderer();renderer.heading=function({tokens,depth}){const text=this.parser.parseInline(tokens),id='section-'+i++;toc.push({id,text:text.replace(/<[^>]*>/g,''),depth});return '<h'+depth+' id="'+id+'">'+text+'</h'+depth+'>'};return {...data,slug,body,html:slug?marked(body,{renderer}):'',toc};}).filter(p=>!p.draft);
export const articles=pages.filter(p=>p.slug.startsWith('blog/'));export {config};
