# Esquema de datos · Tornillería Oriente (DEMO — DATOS DE PRUEBA)

La base es de documentos: **colecciones** que contienen **documentos** con un id. En `data/demo-db.json` está todo junto como `colecciones.<colección>.<id> = documento`, y en `data/json/<colección>.json` hay un archivo por colección.

Fechas: los campos `t`, `at`, `creado`, `saldoAt`, `tasaAt` y `fecha` son milisegundos desde 1970 (hora de Venezuela, UTC−4). Los campos `dia` son texto `AAAA-MM-DD`. Los montos sin moneda indicada están en dólares (`$`); `mon` dice si un pago es en `USD` o en `BS`.

## Reglas de precio (las mismas del sistema real)

| Nombre | Fórmula | Significado |
|---|---|---|
| `costo` (G) | dato del producto | Precio de lista del proveedor |
| H | `costo × (1 − d1)` | Costo real pagando al proveedor en bolívares (`d1` = 0,53) |
| I | `H × (1 − d2)` | Costo real pagando en divisas (`d2` = 0,25) |
| J | `H × (1 + margen)` = H × 4 | **Precio de venta a tasa BCV**, en $. En Bs: J × tasa del día |
| Precio en divisas | `J × (1 − d2)` | Para quien paga en efectivo $, Zelle o Binance |
| `fijo` | dato del producto | Si existe, es el precio de venta y reemplaza a J |

Existencia que se muestra = `exist` del producto − unidades vendidas en ventas del sistema no anuladas. Por debajo de `minimo` (o de 5 si no tiene) se considera «por reponer»; en 0 o menos, «agotado».

## Colecciones

### `config/general`
`d1`, `d2`, `margen`, `minimo`, `tasa` (tasa BCV actual), `tasaAt`, `tasaPor`, `empresa` {`razon`, `rif`, `tel`, `dir`, `correo`, `validez` (días de los presupuestos), `pie`, `retPct`}.

### `catalogo/cNN`
`{ items: { <pid>: producto } }`, en grupos de unos 100 productos. Producto: `codigo`, `desc` (descripción con medidas), `cat` (categoría), `ubic` (estante), `unidad` (unidad de venta; vacío = unidad), `exist`, `costo`, `fijo`, `minimo`, `d1`/`d2` (descuento propio, `null` = el general), `base` (`H`), `ultCompra` {`prov`, `G`, `descBs`, `descExtra`, `dia`} si se le compró.

### `clientes/<clave>`
Clave = documento sin guiones (`V99000101`, `J990000102`). Campos: `nombre`, `doc`, `tel` (vacío), `dir` (vacío), `notas`, `creado`, `especial` y `retPct` si es contribuyente especial.

### `proveedores/<id>`
`nombre`, `corto`, `descBs` (descuento pagando en Bs), `descExtra` (descuento extra pagando en divisas), `creado`.

### `listas/<proveedor>-general`
`prov`, `nombre`, `fecha`, `cols` y `items`. Cada línea de `items` es una lista:

| Posición | Campo | Nota |
|---|---|---|
| 0 | código del proveedor | Las cajas terminan en `-C<unidades>` |
| 1 | descripción | Las cajas dicen «· CAJA x N» |
| 2 | precio por **unidad** en $ | Es el que usa el sistema para comparar costos |
| 3 | nuestro código | Cruce con el catálogo |
| 4 | oferta | 0 |
| 5 | sugerido | vacío |
| 6 | confianza | 1 |
| 7 | presentación | `UNIDAD` o `CAJA` (columna extra de la demo) |
| 8 | unidades por empaque | 1 o 10, 20, 25, 50, 100 |
| 9 | precio por empaque en $ | Precio de la caja completa |

### `ventas/<id>`
`n` (`V-000001`), `nro`, `t`, `dia`, `cliente`, `clienteId`, `clienteDoc`, `modo` (`bs` = precio BCV, `usd` = precio en divisas), `tasa`, `subtotal`, `baseImponible`, `iva`, `ivaTasa`, `igtf`, `total`, `totalBs`, `credito` (monto fiado), `anulada`, `items` [{`id`, `codigo`, `desc`, `ubic`, `cant`, `precio`, `costo` (H al vender), `total`}], `pagos` [{`metodo`, `cuenta`, `cuentaNombre`, `mon`, `monto`, `ref`}], `retencion` y `neto` si aplica.

### `historial/AAAA-MM`
Ventas anotadas en la hoja de Google (en la demo, inventadas). `lineas`: [día del mes, código, cantidad, total $, total Bs, tasa, pago móvil Bs, efectivo Bs, efectivo $, punto Bs, índice del cliente en `nombres` o −1]. `nombres`: clientes del mes.

### `compras/<id>`
`n` (`C-…`), `t`, `dia`, `proveedorId`, `proveedorNombre`, `factura`, `pagoEn` (`bs`/`usd`), `condicion` (`contado`/`credito`), `descBs`, `descExtra`, `total`, `pago`, `items` [{`id`, `codigo`, `desc`, `cant`, `G` (precio de lista), `costoReal`}].

### `gastos/<id>`
`n` (`G-…`), `t`, `dia`, `categoria`, `desc`, `pago` {`key`, `label`, `mon`, `monto`, `usd`, `tasa`}.

### `abonos/<id>`
`n` (`R-…`), `tipo` (`cxc` = cobro a cliente, `cxp` = pago a proveedor), `ref` (id de la venta o compra), `t`, `dia`, `quien`, `pago`.

### `movcta/<id>`
Compra de divisas: `n` (`M-…`), `a`/`aNombre`/`aMon`/`montoA` (de dónde sale), `key`/`nombre`/`mon`/`monto` (a dónde entra), `tasa` (pagada), `tasaBcv`.

### `deudas/hoja`
`items` [{`id`, `tipo` (`cxc`/`cxp`), `t`, `quien`, `ref`, `total`, `detalle`}]: saldos iniciales traídos de la hoja.

### `cajas/<AAAA-MM-DD>`
`apertura` {`usd`, `bs`, `at`} y `cierre` {`at`, `ventas`, `total`, `totalBs`, `notas`, …}.

### `cuentas/<id>`
`nombre`, `banco`, `tipo`, `mon`, `saldoIni`, `saldoAt`, `fijo` (efectivo). Saldo = `saldoIni` + movimientos posteriores a `saldoAt`.

### Otras
`tasas/<id>` {`tasa`, `anterior`, `at`, `por`}, `correlativos/<tipo>` {`ultimo`}, `avisos/importacion`, `cambios`, `cruces`, `presupuestos` y `traspasos` (vacías al empezar).

## CSV (`data/csv/`)

| Archivo | Una fila por… |
|---|---|
| `productos.csv` | producto, con existencia, estado, costos (G, H, I) y precios (BCV y divisas) ya calculados |
| `clientes.csv` | cliente ficticio |
| `proveedores.csv` | proveedor ficticio y sus descuentos |
| `listas_precios.csv` | línea de lista: proveedor, código, presentación, unidades por empaque, precio por empaque y por unidad, nuestro código |
| `productos_en_varios_proveedores.csv` | producto que está en más de un proveedor |
| `historial_ventas_hoja.csv` | línea vendida en los últimos 90 días |
| `ventas_sistema.csv` y `ventas_sistema_lineas.csv` | nota de venta y sus productos |
| `compras.csv` | producto comprado en cada compra |
| `gastos.csv`, `cobros_y_pagos.csv`, `deudas_iniciales.csv`, `movimientos_divisas.csv`, `tasas_bcv.csv`, `cuentas.csv` | un movimiento cada uno |

Las fechas de los CSV y JSON son las de referencia (`meta.fechaReferencia`). Dentro del sistema se ven corridas para que ese día sea hoy.
