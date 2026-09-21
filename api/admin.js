export default async function handler(req,res){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_ANON_KEY,secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const reply=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
 if(!url||!key)return reply(503,{error:'Account service is not configured.'});
 const authorization=req.headers.authorization||'';
 if(!authorization.startsWith('Bearer '))return reply(401,{error:'Please sign in.'});
 try{
 const auth=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key,Authorization:authorization}});
 if(!auth.ok)return reply(401,{error:'Session expired. Sign in again.'});
 const user=await auth.json();if(user.app_metadata?.role!=='admin')return reply(403,{error:'Administrator access required.'});
 if(!secret)return reply(503,{error:'User management requires SUPABASE_SERVICE_ROLE_KEY on the server.'});
 const call=async(path,options={})=>{const r=await fetch(url+path,{...options,headers:{apikey:secret,Authorization:`Bearer ${secret}`,'Content-Type':'application/json',...options.headers}});const text=await r.text();const data=text?JSON.parse(text):null;if(!r.ok)throw Error(data?.msg||data?.message||'Account operation failed.');return data;};
 if(req.method==='GET') {const accounts=[];for(let page=1;;page++){const result=await call(`/auth/v1/admin/users?page=${page}&per_page=100`);const users=result.users||[];accounts.push(...users.map(u=>({id:u.id,email:u.email,name:u.user_metadata?.name||'',role:u.app_metadata?.role||'user',created_at:u.created_at})));if(users.length<100)break;}return reply(200,{users:accounts});}
 let body=req.body;if(typeof body==='string')body=JSON.parse(body);if(!body){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>10000)return reply(413,{error:'Request too large.'});}body=JSON.parse(raw||'{}');}
 if(req.method==='POST'){const {email,password,name}=body;if(typeof email!=='string'||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=='string'||password.length<8||typeof name!=='string'||!name.trim())return reply(400,{error:'Enter a name, valid email and password of at least 8 characters.'});await call('/auth/v1/admin/users',{method:'POST',body:JSON.stringify({email,password,email_confirm:true,user_metadata:{name:name.trim()},app_metadata:{role:'user'}})});return reply(201,{success:true});}
 if(req.method==='DELETE'){if(typeof body.id!=='string'||! /^[a-f0-9-]{36}$/i.test(body.id))return reply(400,{error:'Invalid user.'});if(body.id===user.id)return reply(400,{error:'You cannot delete your own administrator account.'});const target=await call(`/auth/v1/admin/users/${body.id}`);if(target.app_metadata?.role==='admin')return reply(400,{error:'Administrator accounts cannot be deleted here.'});await call(`/auth/v1/admin/users/${body.id}`,{method:'DELETE'});return reply(200,{success:true});}
 return reply(405,{error:'Method not allowed.'});
 }catch(error){return reply(400,{error:error.message});}
}
