import {search,compare} from './search.js';
const endpoint='https://ares-api.argoxxx-03.workers.dev/chat';
const launch=document.createElement('button');launch.id='ares-launch';launch.type='button';launch.innerHTML='<img src="assets/ares.png" alt="">Ares';launch.setAttribute('aria-haspopup','dialog');document.body.append(launch);
const dialog=document.createElement('dialog');dialog.id='ares-dialog';dialog.setAttribute('aria-labelledby','ares-title');
dialog.innerHTML=`<header><img src="assets/ares.png" alt="Robot Ares"><div><h2 id="ares-title">Ares</h2><small>Tu asistente de tornillería</small></div><button id="ares-close" type="button" aria-label="Cerrar Ares">✕</button></header><div id="ares-body"><div class="ares-demo">DEMO · Datos ficticios de este navegador. Consultas de solo lectura.</div><details id="ares-settings"><summary>Conectar Gemini</summary><label for="ares-key">Contraseña de Ares</label><input id="ares-key" type="password" autocomplete="off" maxlength="256" placeholder="Contraseña ARES_ACCESS_KEY"><small>Solo permanece mientras esta página está abierta. Nunca introduzcas aquí la clave de Google.</small><button type="button" id="ares-forget">Olvidar contraseña</button></details><form id="ares-form"><label for="ares-mode">¿Qué necesitas?</label><select id="ares-mode"><option value="auto">Detectar mi consulta</option><option value="inventory">Consultar inventario</option><option value="suppliers">Comparar proveedores</option><option value="general">Preguntar a Gemini</option></select><label for="ares-question">Pregunta, código o descripción</label><textarea id="ares-question" maxlength="2000" required placeholder="¿Tenemos TUSENC014?"></textarea><div id="ares-controls"><div><label for="ares-payment">Pago al proveedor</label><select id="ares-payment"><option value="usd">Divisas</option><option value="bs">Bolívares (equivalente $)</option></select></div><div><label for="ares-quantity">Cantidad</label><input id="ares-quantity" type="number" min="1" max="100000" step="1" value="1"></div></div><p id="ares-example">Prueba «TUSENC014», «productos agotados» o «¿Qué significa UNC?».</p><div class="ares-actions"><button class="primary" id="ares-send" type="submit">Consultar</button><button id="ares-explain" type="button" hidden>Explicar con Gemini</button></div></form><p id="ares-status" role="status" aria-live="polite"></p><div id="ares-results"></div><div id="ares-answer" aria-live="polite"></div><small>Inventario y comparaciones no consumen Gemini. La explicación envía tu pregunta y hasta seis productos relevantes. Sin imágenes ni búsqueda web en esta versión.</small></div>`;
document.body.append(dialog);
const $=id=>document.getElementById('ares-'+id);
let selected=[],lastQuestion='',busy=false;
launch.onclick=()=>{dialog.showModal();$('question').focus()};$('close').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog)dialog.close()};
$('forget').onclick=()=>{$('key').value='';$('answer').textContent='Contraseña olvidada.'};
const money=(v,d=2)=>Number.isFinite(v)?'$ '+v.toLocaleString('es-VE',{minimumFractionDigits:d,maximumFractionDigits:d}):'Sin precio registrado';
function line(parent,text,tag='p'){const el=document.createElement(tag);el.textContent=text;parent.append(el);return el}
function lock(on){busy=on;$('send').disabled=on;$('explain').disabled=on;}
async function snapshot(){return window.AresDemo.snapshot()}
function showProducts(result){
 $('results').replaceChildren();
 $('status').textContent=result.total?`${result.total} coincidencia(s). Mostrando ${result.items.length}. Confirma medidas y características antes de sustituir un producto.`:'No encontré coincidencias. Prueba el código exacto o menos palabras; esto no demuestra que el producto no exista.';
 result.items.forEach(p=>{const card=document.createElement('article');card.className='ares-card';line(card,p.codigo+' · '+p.descripcion,'strong');line(card,`Existencia: ${p.existencia} ${p.unidad} · ${p.existencia<=0?'Agotado':p.existencia<=p.minimo?'Por reponer':'Disponible'}`);line(card,`Venta a BCV: ${money(p.precioBCV)} · Divisas: ${money(p.precioDivisas)}`);if(p.precioBs!=null)line(card,'Venta en Bs: '+p.precioBs.toLocaleString('es-VE',{maximumFractionDigits:2}));line(card,'Ubicación: '+(p.ubicacion||'No registrada'));line(card,p.almacenes.map(a=>`${a.nombre}: ${a.existencia}`).join(' · '));const b=document.createElement('button');b.type='button';b.textContent='Comparar proveedores';b.onclick=()=>{$('mode').value='suppliers';$('question').value=p.codigo;$('form').requestSubmit()};card.append(b);$('results').append(card)});
}
async function explain(question){
 if(!$('key').value){$('settings').open=true;$('key').focus();throw Error('Para usar Gemini, escribe tu contraseña de Ares. La consulta local ya está disponible.');}
 const fresh=await snapshot();const codes=new Set(selected.map(x=>x.codigo));
 const products=fresh.productos.filter(p=>codes.has(p.codigo)).slice(0,6);
 const offers=fresh.admin?products.flatMap(p=>compare(fresh.ofertas,p.codigo,$('payment').value,Number($('quantity').value)).slice(0,8)):[];
 const contexto={demo:true,actualizado:fresh.actualizado,productos:products,ofertas:offers,consultaParcial:true,pago:$('payment').value,cantidad:Number($('quantity').value),nota:'Las ofertas se ordenan por desembolso de empaques completos; sin flete ni impuestos no registrados.'};
 $('status').textContent='Consultando a Gemini…';
 let r;try{r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+$('key').value},body:JSON.stringify({pregunta:question,contexto}),signal:AbortSignal.timeout(55000)})}catch(e){throw Error('No se pudo conectar con Ares. Comprueba internet y que hayas actualizado el Worker de Cloudflare con el archivo incluido.');}
 let data;try{data=await r.json()}catch{throw Error('El servidor no devolvió una respuesta válida.');}
 if(!r.ok)throw Error(data.error||'No se pudo completar la consulta.');
 $('settings').open=false;$('answer').textContent=data.respuesta;$('status').textContent='Respuesta de Gemini · Contexto parcial de la demo. Cada pregunta es independiente.';
}
$('form').onsubmit=async e=>{e.preventDefault();if(busy)return;lock(true);$('answer').textContent='';$('results').replaceChildren();$('explain').hidden=true;
 try{const s=await snapshot(),q=$('question').value.trim();lastQuestion=q;const result=search(s.productos,q);selected=result.items.slice(0,6);let mode=$('mode').value;
 if(mode==='auto')mode=/proveedor|mas barat|mejor precio|comprar/i.test(q)?'suppliers':result.total||/inventario|existencia|tenemos|agotad|stock/i.test(q)?'inventory':'general';
 if(mode==='general'){await explain(q);return;}
 showProducts(result);
 if(mode==='suppliers'){
  if(!s.admin){$('results').replaceChildren();selected=[];throw Error('La comparación de costos está disponible en la vista Administrador de esta demo.');}
  if(result.total!==1){$('status').textContent=result.total?'Selecciona un producto concreto usando su botón «Comparar proveedores».':'No encontré el producto. Busca su código exacto.';return;}
  const p=result.items[0],quantity=Number($('quantity').value);const offers=compare(s.ofertas,p.codigo,$('payment').value,quantity);
  $('status').textContent=offers.length?`Comparación para ${quantity} unidad(es). Ordenada por total de compra, considerando empaques completos y descuentos registrados. No incluye flete ni impuestos no registrados.`:'No hay listas cruzadas con este código. No significa que ningún proveedor lo venda.';
  offers.forEach((o,i)=>{const card=document.createElement('article');card.className='ares-card';line(card,`${i===0&&o.totalCompra!==null?'Menor desembolso registrado · ':''}${o.proveedor}`,'strong');line(card,`${o.codigoProveedor} · ${o.presentacion} · ${o.unidades??'?'} unidades/empaque`);line(card,`Neto por unidad: ${money(o.netoUnidad,4)} · Compra: ${o.unidadesCompra??'sin empaque definido'} unidades · Total: ${money(o.totalCompra,4)}`);line(card,`${o.lista} · ${o.fecha?new Date(o.fecha).toLocaleDateString('es-VE'):'Sin fecha'}`);$('results').append(card)});
 }
 $('explain').hidden=false;
 }catch(e){$('status').textContent=e.message}finally{lock(false);$('status').scrollIntoView({block:'start',behavior:'smooth'})}};
$('explain').onclick=async()=>{if(busy)return;lock(true);try{await explain(lastQuestion)}catch(e){$('status').textContent=e.message}finally{lock(false);$('status').scrollIntoView({block:'start',behavior:'smooth'})}};
