import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.js';
import {search,compare} from '../ares/search.js';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../data/demo-db.json',import.meta.url))).colecciones;
const products=Object.values(data.catalogo).flatMap(c=>Object.values(c.items).map(p=>({codigo:p.codigo,descripcion:p.desc,categoria:p.cat,existencia:p.exist,minimo:5})));
test('exact code inside a natural question',()=>assert.equal(search(products,'¿Tenemos TUSENC014?').items[0].codigo,'TUSENC014'));
test('unknown code and empty input do not return arbitrary catalog',()=>{assert.equal(search(products,'NO_EXISTE_999999').total,0);assert.equal(search(products,'').total,0)});
test('package rounding changes cheapest supplier depending on requested quantity',()=>{
 const o=[{codigo:'X',proveedor:'caja',precioLista:1,unidades:100,precioEmpaque:100,descuentoBs:0,descuentoExtra:0},{codigo:'X',proveedor:'unidad',precioLista:1.5,unidades:1,precioEmpaque:1.5,descuentoBs:0,descuentoExtra:0}];
 assert.equal(compare(o,'X','usd',30)[0].proveedor,'unidad');assert.equal(compare(o,'X','usd',100)[0].proveedor,'caja');assert.equal(compare(o,'X','usd',101)[0].proveedor,'unidad');
});
test('consecutive discounts are multiplicative, missing pack is not a guaranteed lowest outlay',()=>{
 const o=compare([{codigo:'X',precioLista:10,descuentoBs:.4,descuentoExtra:.2,presentacion:'NO INDICADA'}],'X');assert.equal(o[0].netoUnidad,4.8);assert.equal(o[0].totalCompra,null);
});
const env={GEMINI_API_KEY:'fake-google-key',ARES_ACCESS_KEY:'test-password'};
function req({origin='https://argox03.github.io',password='test-password',body={pregunta:'Hola'}}={}){return new Request('https://ares-api.argoxxx-03.workers.dev/chat',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+password,'Content-Type':'application/json'},body:JSON.stringify(body)})}
test('CORS, authorization, missing counter and input limits fail before upstream',async()=>{
 assert.equal((await worker.fetch(req({origin:'https://evil.example'}),env)).status,403);
 assert.equal((await worker.fetch(req({password:'wrong'}),env)).status,401);
 assert.equal((await worker.fetch(req(),env)).status,503);
 assert.equal((await worker.fetch(req({body:{pregunta:'a'.repeat(2001)}}),env)).status,400);
 assert.equal((await worker.fetch(req({body:{pregunta:'a',extra:'x'.repeat(49000)}}),env)).status,400);
 const r=await worker.fetch(new Request('https://ares-api.argoxxx-03.workers.dev/chat',{method:'OPTIONS',headers:{Origin:'https://argox03.github.io'}}),env);assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://argox03.github.io');
});
test('exhausted quota blocks upstream; valid reply hides reasoning and secrets',async()=>{
 const old=globalThis.fetch;let called=0;
 globalThis.fetch=async(url,opts)=>{called++;assert.equal(opts.headers['x-goog-api-key'],'fake-google-key');return Response.json({candidates:[{content:{parts:[{thought:true,text:'private reasoning'},{text:'Respuesta pública'}]}}]})};
 try{
 const blocked={...env,ARES_DB:{prepare:()=>({bind:()=>({first:async()=>null})})}};
 assert.equal((await worker.fetch(req(),blocked)).status,429);assert.equal(called,0);
 const ok={...env,ARES_DB:{prepare:()=>({bind:()=>({first:async()=>({n:1})})})}};
 const r=await worker.fetch(req(),ok);assert.equal(r.status,200);assert.deepEqual(await r.json(),{respuesta:'Respuesta pública'});assert.equal(called,1);
 }finally{globalThis.fetch=old}
});
