import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from './api/admin.js';
async function invoke(req){let payload;const res={setHeader(){},end(body){payload=JSON.parse(body);}};await handler(req,res);return{status:res.statusCode,payload};}
test('admin endpoint rejects missing login and ordinary users',async()=>{const oldFetch=globalThis.fetch;const previous={...process.env};process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_ANON_KEY='public';try{assert.equal((await invoke({headers:{},method:'GET'})).status,401);globalThis.fetch=async()=>({ok:true,json:async()=>({id:'member',app_metadata:{role:'user'},user_metadata:{role:'admin'}})});assert.equal((await invoke({headers:{authorization:'Bearer token'},method:'GET'})).status,403);}finally{globalThis.fetch=oldFetch;for(const k of ['SUPABASE_URL','SUPABASE_ANON_KEY']){if(previous[k]===undefined)delete process.env[k];else process.env[k]=previous[k];}}});
