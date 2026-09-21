import http from 'node:http';
import admin from './api/admin.js';
import {config} from './env.mjs';
import {readFile} from 'node:fs/promises';
const files={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/ledger.js':'ledger.js','/cloud.js':'cloud.js','/session.js':'session.js','/config.js':'config.js','/style.css':'style.css'};
http.createServer(async(req,res)=>{try{if(new URL(req.url,'http://localhost').pathname==='/api/admin')return await admin(req,res);const file=files[new URL(req.url,'http://localhost').pathname];if(!file){res.writeHead(404);return res.end('Not found');}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.setHeader('Cache-Control','no-store');res.end(file==='config.js'?`export default ${JSON.stringify(config)};`:await readFile(new URL(file,import.meta.url)));}catch{res.writeHead(500);res.end('Server error');}}).listen(process.env.PORT||3000,()=>console.log(`My Wallet: http://localhost:${process.env.PORT||3000}`));
