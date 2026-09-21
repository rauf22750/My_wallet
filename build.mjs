import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {config} from './env.mjs';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','app.js','ledger.js','cloud.js','session.js']) await copyFile(file,`dist/${file}`);
await writeFile('dist/config.js',`export default ${JSON.stringify(config)};\n`);
console.log('Built static app in dist/');
