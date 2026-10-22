export const norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const stop = new Set('que cual cuales como tenemos tengo tiene hay el la los las un una unos unas de del en con por para al y o me mi nuestro nuestra nuestros nuestras inventario producto productos codigo existencia existencias precio precios cuanto cuantos cuesta cuestan quedan disponible disponibles busca buscar buscame dime muestra mostrar mejor proveedor proveedores barato barata comprar comparar unidad unidades divisas bolivares bs'.split(' '));
export function search(products, query) {
 const q=norm(query), compact=q.replace(/[^a-z0-9]/g,'');
 const exact=products.filter(p=>norm(p.codigo)===q.trim()||q.split(/[^a-z0-9_-]+/).includes(norm(p.codigo)));
 if(exact.length)return {total:exact.length,items:exact.slice(0,12),exact:true};
 const tokens=q.replace(/[^a-z0-9/.-]/g,' ').split(/\s+/).filter(t=>t&&!stop.has(t));
 const filtered=products.filter(p=>{
   if(/agotad|sin existencia|sin stock/.test(q)&&p.existencia>0)return false;
   if(/poca existencia|por reponer/.test(q)&&!(p.existencia>0&&p.existencia<=p.minimo))return false;
   const hay=norm([p.codigo,p.descripcion,p.categoria].join(' '));
   const terms=tokens.filter(t=>!['agotados','agotado','sin','stock','poca','reponer'].includes(t));
   return terms.length?terms.every(t=>hay.includes(t)||(/^tornillos?$/.test(t)&&/\btor/.test(hay))||(/^tuercas?$/.test(t)&&/\btuerca/.test(hay))):/agotad|sin existencia|sin stock|poca existencia|por reponer/.test(q);
 });
 return {total:filtered.length,items:filtered.slice(0,12),exact:false};
}
export function compare(offers,code,payment='usd',quantity=1) {
 return offers.filter(o=>norm(o.codigo)===norm(code)&&Number.isFinite(o.precioLista)&&o.precioLista>=0).map(o=>{
  const validPack=Number.isFinite(o.unidades)&&o.unidades>=1&&Number.isFinite(o.precioEmpaque)&&o.precioEmpaque>=0;
  // Prioridad al precio real del empaque: evita errores de redondeo de precioUnidad.
  const base=validPack?o.precioEmpaque/o.unidades:o.precioLista;
  const factor=(1-o.descuentoBs)*(payment==='usd'?1-o.descuentoExtra:1);
  const unidadesCompra=validPack?Math.ceil(quantity/o.unidades)*o.unidades:null;
  return {...o,netoUnidad:base*factor,unidadesCompra,totalCompra:unidadesCompra===null?null:unidadesCompra*base*factor};
 }).sort((a,b)=>(a.totalCompra??Infinity)-(b.totalCompra??Infinity)||a.netoUnidad-b.netoUnidad);
}
