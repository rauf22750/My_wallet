import {loadEnvFile} from 'node:process';
try { loadEnvFile(new URL('.env', import.meta.url)); } catch(error) { if(error.code !== 'ENOENT') throw error; }
export const config = {supabaseUrl:process.env.SUPABASE_URL||'',supabaseKey:process.env.SUPABASE_ANON_KEY||''};
if(Boolean(config.supabaseUrl)!==Boolean(config.supabaseKey)) throw Error('Set both SUPABASE_URL and SUPABASE_ANON_KEY');
