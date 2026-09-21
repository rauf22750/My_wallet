import '../env.mjs';
import pg from 'pg';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const connectionString=process.env.DATABASE_URL;
if(!connectionString||/YOUR|REPLACE/.test(connectionString))throw Error('Set the actual DATABASE_URL in .env first.');
const parts=connectionString.match(/^postgres(?:ql)?:\/\/([^:]+):([\s\S]*)@([^/:]+):(\d+)\/([^?]+)(?:\?.*)?$/);
if(!parts)throw Error('DATABASE_URL format is invalid. Use the Supabase Connect connection string.');
let password=parts[2];try{password=decodeURIComponent(password);}catch{}
const certificatePath=resolve(fileURLToPath(new URL('../',import.meta.url)),process.env.DATABASE_SSL_CA_PATH||'supabase/prod-ca-2021.crt');
const client=new pg.Client({user:parts[1],password,host:parts[3],port:Number(parts[4]),database:parts[5],ssl:{rejectUnauthorized:true,ca:await readFile(certificatePath,'utf8')},connectionTimeoutMillis:15000});
let transaction=false;
try{
 await client.connect();
 await client.query('BEGIN');transaction=true;
 await client.query("SELECT pg_advisory_xact_lock(736281004)");
 await client.query('CREATE SCHEMA IF NOT EXISTS wallet_internal');
 await client.query('REVOKE ALL ON SCHEMA wallet_internal FROM PUBLIC, anon, authenticated');
 await client.query('CREATE TABLE IF NOT EXISTS wallet_internal.migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
 const directory=new URL('../supabase/migrations/',import.meta.url);
 const files=(await readdir(directory)).filter(f=>/^\d+_.+\.sql$/.test(f)).sort();
 if(!files.length)throw Error('No migration files found.');
 for(const file of files){
  const sql=await readFile(new URL(file,directory),'utf8');
  const checksum=createHash('sha256').update(sql).digest('hex');
  const {rows}=await client.query('SELECT checksum FROM wallet_internal.migrations WHERE name=$1',[file]);
  if(rows.length){if(rows[0].checksum!==checksum)throw Error(`Applied migration ${file} was changed. Add a new migration instead.`);console.log('Already applied:',file);continue;}
  await client.query(sql);
  await client.query('INSERT INTO wallet_internal.migrations(name,checksum) VALUES($1,$2)',[file,checksum]);
  console.log('Applied:',file);
 }
 await client.query("NOTIFY pgrst, 'reload schema'");
 await client.query('COMMIT');transaction=false;
 const result=await client.query("SELECT relrowsecurity FROM pg_class WHERE oid='public.wallets'::regclass");
 if(!result.rows[0]?.relrowsecurity)throw Error('Wallet row-level security is not enabled.');
 console.log('Migrations complete. Wallet table and row-level security verified.');
}catch(e){if(transaction)await client.query('ROLLBACK').catch(()=>{});console.error('Migration failed:',e.code||'',e.message.replace(connectionString,'[database URL]').replace(password,'[redacted]'));if(e.code==='ENOTFOUND'||e.code==='ENETUNREACH')console.error('Use Supabase Connect > Session pooler connection string in DATABASE_URL; the direct database host is unreachable.');process.exitCode=1;}finally{await client.end();}
