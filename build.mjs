import {mkdir,copyFile,writeFile,cp} from 'node:fs/promises';
import {config} from './env.mjs';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','app.js','ledger.js','cloud.js','session.js','reports.js','offline.html','pwa.js','sw.js','manifest.webmanifest']) await copyFile(file,`dist/${file}`);
await writeFile('dist/config.js',`export default ${JSON.stringify(config)};\n`);
console.log('Built static app in dist/');

await cp('icons','dist/icons',{recursive:true});

await mkdir('dist/vendor',{recursive:true});
await copyFile('node_modules/jspdf/dist/jspdf.umd.min.js','dist/vendor/jspdf.umd.min.js');
