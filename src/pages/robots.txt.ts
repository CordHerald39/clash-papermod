import {indexable,config} from '../lib/content.mjs';
export const GET=()=>new Response(indexable?'User-agent: *\nAllow: /\nSitemap: '+new URL('sitemap.xml',config.site).href+'\n':'User-agent: *\nDisallow: /\n');
