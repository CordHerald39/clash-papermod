import {defineConfig} from 'astro/config';
import config from './site.config.json' with {type:'json'};
export default defineConfig({site:process.env.SITE_URL||config.site,base:process.env.DEPLOY_BASE||'/',output:'static',trailingSlash:'always'});
