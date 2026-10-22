> **Integración Ares:** empieza por [LEEME-ARES.md](LEEME-ARES.md). Pruebas y límites en [REVISION-ARES.md](REVISION-ARES.md).

# Tornillería Oriente · DEMO — DATOS DE PRUEBA

Versión de demostración del sistema de Tornillería Oriente (punto de venta, inventario, caja, cobros, compras y reportes) para probar el asistente de IA **Ares**.

> **Todos los datos son ficticios.** Las existencias, costos, precios, clientes, proveedores, listas de precios, ventas, compras, gastos, cobros, caja y tasas fueron inventados. Del catálogo real solo se conservan los códigos, nombres y descripciones (con sus medidas), categorías, estantes y unidades de venta.

El sistema se ve con una franja amarilla arriba que dice **DEMO — DATOS DE PRUEBA** en todas las pantallas.

---

## 1. Cómo abrir la demo

Hace falta un servidor local, porque el navegador no deja leer los datos si se abre el archivo con doble clic.

**Opción A · con Node.js 18 o más reciente (recomendada)**

```bash
npm start
```

Luego abre <http://localhost:5173>. No hay que instalar nada: el proyecto no tiene dependencias de npm.

**Opción B · con Python 3**

```bash
python3 -m http.server 5173
```

Luego abre <http://localhost:5173>.

La primera vez la demo carga `data/demo-db.json` y corre todas las fechas para que el último día de los datos sea **hoy**. Así el Inicio siempre muestra ventas del día, deudas con su antigüedad real y la tasa «al día».

Necesitas internet para tres cosas: las letras del sistema (Google Fonts), crear PDF (jsPDF) y leer o descargar Excel (SheetJS). Sin internet el sistema funciona, pero con letra genérica y sin PDF ni Excel.

## 2. Qué se puede hacer

Todo el sistema funciona: vender, cobrar, fiar, abonar, registrar compras y gastos, abrir y cerrar caja, cambiar la tasa, editar productos, ver reportes y descargar Excel o PDF.

- **Los cambios se guardan solo en ese navegador** (almacenamiento local). Otra persona u otro navegador ve la demo desde cero.
- **Ver como vendedor:** botón «Ver como» en la franja amarilla, o abrir `http://localhost:5173/?rol=vendedor`. El vendedor no ve costos, ganancias ni reportes, igual que en el sistema real.

## 3. Restaurar la demo a su estado inicial

Cualquiera de estas opciones borra los cambios y vuelve a cargar los datos de prueba:

1. Botón **«Restaurar demo»** en la franja amarilla.
2. Abrir `http://localhost:5173/?restaurar=1`.
3. Borrar los datos del sitio en el navegador (Configuración → Privacidad → Datos de sitios → `localhost`).

Para volver a crear los archivos de datos exactamente iguales a los originales:

```bash
pip install openpyxl          # solo para los .xlsx
python3 tools/generar_demo.py
```

El generador usa una semilla fija, así que siempre produce los mismos datos. Para otra variante: `python3 tools/generar_demo.py --semilla 7`. Para otra fecha de referencia: `--fecha 2026-12-15`. Después de regenerar, restaura la demo en el navegador para que tome los archivos nuevos.

## 4. Qué datos trae

| Datos | Cantidad | Detalle |
|---|---|---|
| Productos | 3.214 | 328 categorías. 2.291 disponibles, 496 con poca existencia y 427 agotados. 65 sin costo (se venden con precio a mano) y 482 con precio fijo. |
| Clientes | 40 | Ficticios: 22 personas y 18 empresas. Sin teléfono ni dirección; documentos en el rango V-99… y J-99…, que no está asignado. 3 son contribuyentes especiales. |
| Proveedores | 4 | Tornorte, Pernos Andes, FerreCaribe y AutoTuercas, todos «(DEMO)», cada uno con su descuento pagando en Bs y en divisas. |
| Listas de precios | 3 listas · 1.273 líneas | 760 líneas por unidad y 513 por caja (de 10, 20, 25, 50 o 100 unidades). 160 productos están en los tres proveedores con el mismo código nuestro. |
| Historial de ventas (formato hoja) | 3.405 líneas | Últimos 90 días, de lunes a sábado, con forma de pago, tasa del día y cliente en 3 de cada 10. |
| Ventas del sistema | 21 | Notas V-000001 a V-000021, en bolívares y en divisas, con 2 a crédito, 2 con IVA y 1 anulada. |
| Compras | 6 | A los proveedores demo, de contado y a crédito, pagando en Bs o en divisas. |
| Gastos | 11 | Alquiler, servicios, nómina, transporte y otros, con su cuenta de pago. |
| Cobros y pagos | 3 | Abonos de clientes y un pago a proveedor. |
| Compra de divisas | 3 | Con tasa pagada contra la tasa BCV (diferencial cambiario). |
| Deudas iniciales | 10 por cobrar y 3 por pagar | Como si vinieran de la hoja de cobros. |
| Caja | 5 días | Días anteriores cerrados y hoy abierta con su fondo. |
| Tasa BCV | 33 días hábiles | Ficticia, con su historial de las últimas seis semanas. |
| Cuentas | 6 | Banco Demo (pago móvil y punto), Zelle, Binance, Efectivo $ y Efectivo Bs, con saldos de prueba. |

## 5. Dónde están los datos (para Ares)

| Carpeta | Para qué |
|---|---|
| `data/demo-db.json` | La base completa que carga la demo: `{ meta, colecciones }`. |
| `data/json/*.json` | La misma base, un archivo por colección (productos, ventas, clientes…). |
| `data/csv/*.csv` | Tablas planas listas para Excel o para Ares. Entre ellas: `productos.csv` con existencia, estado, costos y precios ya calculados, `listas_precios.csv` con presentación y unidades por caja, y `productos_en_varios_proveedores.csv`. |
| `data/listas-proveedores/*.xlsx` | Las listas de Tornorte, Pernos Andes y FerreCaribe en Excel, con código del proveedor, presentación, unidades por empaque, precio por empaque, precio por unidad y nuestro código. |
| `data/base/productos_base.csv` | Catálogo base (código, descripción, categoría, estante, unidad) más un costo de referencia **ficticio** que usa el generador. |
| `docs/ESQUEMA_DATOS.md` | Qué significa cada colección y cada campo, y las reglas de precio. |

## 6. Estructura del proyecto

```
index.html                 el sistema completo (HTML, CSS y JavaScript en un archivo)
demo/runtime.js            entorno local de la demo: base de datos, usuario, descargas y franja DEMO
data/                      datos de prueba (ver sección 5)
tools/servidor.mjs         servidor local sin dependencias (npm start)
tools/generar_demo.py      genera todos los datos de prueba
assets/                    logos de Tornillería Oriente
docs/ESQUEMA_DATOS.md      esquema de los datos
package.json               comandos: npm start y npm run generar
```

## 7. Versión incluida y qué cambió para la demo

`index.html` es la versión más reciente del sistema: la de Claude, con el **nuevo Inicio** (módulos que se pueden mover y ocultar, con detalle al pasar el mouse) y los **nuevos Reportes** (secciones laterales, período compacto, clases A, B y C, costos que no cuadran, clientes que dejaron de comprar y margen por categoría), más el modo noche en grafito medio. El diseño, los colores y las funciones son los actuales.

Para la demo solo se hicieron dos cambios en `index.html`:

1. Una línea en `<head>` que carga `demo/runtime.js`.
2. `SHEET_ID` quedó vacío, para que la demo no apunte a la hoja de Google real.

Para volver a usar el archivo dentro de Claude como artifact, borra la línea de `demo/runtime.js` y vuelve a poner el identificador de tu hoja en `SHEET_ID`.

No se agregó ni se modificó nada de la versión PWA (Vite + Firebase). Esa versión es un proyecto aparte y no forma parte de este ZIP.

## 8. Cargar los datos de prueba en un artifact de Claude (opcional)

Si quieres la demo dentro de Claude en lugar de en tu computadora:

1. Publica `index.html` sin la línea de `demo/runtime.js` como un artifact **nuevo**, con las capacidades `db`, `user` y `downloads`.
2. Pídele a Claude que cargue cada archivo de `data/json/` en la colección del mismo nombre de ese artifact. Cada clave del archivo es el id de un documento. `catalogo.json` va en grupos de unos 100 productos y `historial.json` va por meses.
3. Antes de cargar, Claude debe correr las fechas a hoy: `meta.fechaReferencia` dice qué día representa «hoy» en los datos. Si no se corren, el sistema mostrará los datos como si fueran de esa fecha.

Nunca lo cargues en el artifact del sistema real: reemplazaría tus datos.

## 9. Lo que no se pudo exportar o no funciona en la demo

- **Datos reales:** no se incluyen a propósito. Eso abarca existencias, costos, ventas, clientes, deudas, gastos, cuentas bancarias, proveedores y sus listas, el registro de cambios y la tasa real.
- **Sincronización con la hoja de Google:** no está disponible. Necesita el conector de Google Sheets de Claude y la hoja real. El botón «Sincronizar ahora» avisa que no hay conexión.
- **Leer facturas con foto:** no está disponible. Usa a Claude (capacidad `sample`). Sí funcionan la entrada por Excel o CSV y la entrada a mano.
- **Tasa BCV automática:** la tarea programada de Claude que la actualiza cada mañana no se incluye. La tasa se cambia a mano.
- **Varias personas a la vez:** en la demo los datos viven en un solo navegador; no hay usuarios reales ni permisos por organización. El cambio de rol es solo para probar.
- **Presentaciones (unidad o caja):** el sistema no tiene un campo para eso. En las listas de la demo cada presentación es una línea aparte, con su precio por unidad para que los costos cuadren, y las columnas extra `presentacion`, `unidadesPorEmpaque` y `precioEmpaque`, que el sistema guarda pero no muestra. Los Excel y CSV sí las muestran.
- **Sin datos de ejemplo:** presupuestos, traspasos entre almacenes y registro de cambios empiezan vacíos. Se pueden crear desde la demo.
- **Respaldos de GitHub, scripts de importación de la hoja real y documentos internos del proyecto:** no se incluyen, porque contienen o apuntan a datos reales.
- **Claves y contraseñas:** el proyecto no usa ni incluye ninguna.
