import '../env.mjs';
import {randomBytes} from 'node:crypto';
const email=process.argv[2];
if(!email)throw Error('Provide the administrator email.');
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!key)throw Error('Set SUPABASE_SERVICE_ROLE_KEY first.');
async function request(path,options={}){const r=await fetch(process.env.SUPABASE_URL+path,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'}});const data=await r.json();if(!r.ok)throw Error(data.msg||data.message||'Account setup failed.');return data;}
let existing;
for(let page=1;;page++){const {users}=await request(`/auth/v1/admin/users?page=${page}&per_page=100`);existing=users.find(u=>u.email?.toLowerCase()===email.toLowerCase());if(existing||users.length<100)break;}
const password=randomBytes(18).toString('base64url')+'aA7!';
const body={email,password,email_confirm:true,app_metadata:{...existing?.app_metadata,role:'admin'}};
const user=await request(existing?`/auth/v1/admin/users/${existing.id}`:'/auth/v1/admin/users',{method:existing?'PUT':'POST',body:JSON.stringify(body)});
const login=await fetch(process.env.SUPABASE_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:process.env.SUPABASE_ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
const result=await login.json();if(!login.ok||result.user?.app_metadata?.role!=='admin')throw Error('Administrator sign-in verification failed.');
console.log(JSON.stringify({email:user.email,temporaryPassword:password,verifiedAdminLogin:true}));
