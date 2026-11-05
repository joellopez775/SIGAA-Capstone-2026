// Layout the editable DOT diagrams using Graphviz WebAssembly.
// Set SIGAA_VIZ_MODULE when @viz-js/viz is installed outside this workspace.
import {readFile,writeFile} from 'node:fs/promises';
const {instance}=await import(process.env.SIGAA_VIZ_MODULE??'@viz-js/viz');
const v=await instance(),root=new URL('../',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('tmp/schema-diagram/manifest.json',root),'utf8'));
for(const m of manifest){
 const source=await readFile(new URL('docs/design/database/'+m.file+'.dot',root),'utf8');
 await writeFile(new URL('tmp/schema-diagram/'+m.file+'.json',root),v.renderString(source,{format:'json'}));
 console.log('Laid out',m.file);
}
