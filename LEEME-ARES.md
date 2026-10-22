# Ares · demo integrada

## Qué incluye
- Robot Ares y chat que respeta los colores claros/oscuros existentes.
- Búsqueda local por código/descripción, existencia actual, almacenes y precios con las mismas fórmulas del sistema.
- Comparación por código confirmado, presentación, descuentos, forma de pago y cantidad solicitada. Orden por menor desembolso comprando empaques completos; el costo unitario más bajo no siempre implica gastar menos. Valores en dólares o equivalente en dólares; sin flete ni impuestos no registrados.
- Explicaciones generales con Gemini y contexto de hasta seis productos y ocho ofertas. Consultas independientes, sin memoria ni imágenes ni búsqueda web.
- No se envían clientes, ventas completas ni el catálogo completo a Google. Solo la pregunta y los registros seleccionados.
- Contraseña temporal en la página; no se guarda en localStorage ni se incluye en el ZIP.
- Costos de proveedores ocultos en la vista Vendedor. El selector de rol es solo una SIMULACIÓN: los archivos de demostración son públicos. No es seguridad para datos reales.

## 1. Probar ya, sin actualizar Cloudflare
Extrae el ZIP. Ejecuta `npm start` donde está package.json y abre http://localhost:5173.
No hace falta npm install. Pulsa Ares y pregunta por `TUSENC014`. Las consultas locales y comparaciones ya funcionan, sin clave ni consumo de Gemini.
Para GitHub Pages, sube el CONTENIDO de esta carpeta, con index.html en la raíz. Conserva assets, demo, ares y data; no subas solo index.html. Los datos económicos son de prueba; códigos y descripciones proceden del catálogo entregado.

## 2. Actualizar Cloudflare (necesario para Gemini dentro de la página)
Conserva los secretos GEMINI_API_KEY y ARES_ACCESS_KEY del Worker `ares-api`.
No hace falta otra clave de Google.

### Crear el contador compartido
1. En Cloudflare, abre Storage & databases → D1 y crea una base llamada `ares-limites-demo`.
2. Abre su consola SQL y ejecuta el contenido de `cloudflare/schema.sql` (una sola sentencia CREATE TABLE).
3. Abre Workers & Pages → ares-api → Bindings → Add binding → D1 database.
4. Usa exactamente `ARES_DB` como nombre de variable y selecciona `ares-limites-demo`. Guarda/publica el cambio.

### Reemplazar el código
5. Abre Edit code en la versión Latest de ares-api.
6. Reemplaza TODO worker.js por `cloudflare/worker.js` de este ZIP y pulsa Deploy.
7. Abre la demo, pulsa Ares → Conectar Gemini e introduce la contraseña ARES_ACCESS_KEY (NO la clave de Google).
8. Selecciona «Preguntar a Gemini» o consulta un producto y pulsa «Explicar con Gemini».

El servidor solo admite orígenes https://argox03.github.io, su propio dominio y localhost/127.0.0.1:5173. La contraseña también es obligatoria: CORS no sustituye autenticación.
La dirección configurada es https://ares-api.argoxxx-03.workers.dev/chat (ares/chat.js).
El modelo predeterminado es el mismo de la prueba anterior: gemini-3.5-flash-lite. Puedes configurar GEMINI_MODEL como variable de texto si tu proyecto usa otro modelo compatible.
Después del cambio, Visit del Worker muestra un estado JSON: el formulario está ahora en la página de la tornillería.

## Límites
100 intentos autorizados diarios y 5 por minuto entre todos los usuarios, mediante operaciones atómicas en D1. Reinicio diario 00:00 UTC, 20:00 de Venezuela. Intentos rechazados por el minuto y fallos de Google también consumen el contador diario, para ser conservadores.
Si no está ARES_DB o falla la tabla, NO se llama a Google. Límite de entrada 48 KB, pregunta 2000 caracteres, salida 1400 tokens, espera 45 segundos, sin reintentos automáticos.
Esto limita llamadas, no fija un importe exacto en dólares. Cloudflare y Google tienen sus propias cuotas/facturación; no activamos planes ni cuentas por ti.

## Si ya tenías instalada la PWA anterior
Este ZIP de origen NO trae manifest ni service worker. No se añadió ni modificó la PWA, siguiendo lo pedido para esta exportación. La demo es una web responsive; la IA requiere internet.
La PWA antigua puede mostrar archivos antiguos desde caché. Conserva antes lo que necesites de tus pruebas. En Chrome: DevTools → Application → Service Workers, elimina únicamente el registro de /Prueba/. En Storage borra los datos SOLO de esa demo si necesitas empezar desde cero (borra operaciones de prueba). Elimina del repositorio el sw.js, manifest y workbox antiguos si vas a reemplazar esa PWA por esta demo. Otra opción es publicar esta demo en un repositorio nuevo para mantener la anterior intacta.
No mezcles código compilado de la versión vieja con este proyecto.

## Qué sigue pendiente antes de producción
Autenticación real por persona, permisos de servidor, datos privados en servidor, respaldos y validación de sincronización. La contraseña compartida y el rol simulado sirven para probar con datos ficticios. No cargar datos reales en este sitio público.
No se ha desplegado nada desde este trabajo. El código se probó localmente con respuestas de Gemini simuladas; la conexión real y D1 deben comprobarse en tu cuenta tras desplegar.
