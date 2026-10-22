# Revisión de Ares · 22 de octubre de 2026

## Cambios
Se integró un asistente independiente en ares/ y un puente de lectura en index.html. El diseño previo conserva sus estilos; el panel usa sus variables de color y el robot creado para Ares.
La existencia y precios usan calc() y stockAlm() del sistema. Se eliminó la carga limitada de ventas y se cambió por una suscripción completa en esta demo local, para reflejar anulaciones de ventas antiguas y evitar stock incompleto. También se retiraron límites de clientes y colecciones de movimientos que podían omitir registros.
No se modificaron los archivos de datos de origen. Los cambios de pruebas se hicieron únicamente en un navegador de pruebas.

## Validación
- 6 pruebas automatizadas: búsquedas exactas/desconocidas, comparación de cajas y unidades, descuentos, permisos de API, origen, límites de entrada, cuota agotada y respuesta de Gemini simulada.
- Consulta TUSENC014: 5 ofertas; para 30 unidades, menor desembolso FerreCaribe, aunque otra caja tenga menor costo por unidad.
- Se comprobó que una venta de prueba descuenta 2 unidades en Ares sin recargar los datos iniciales.
- Vista Vendedor: cero ofertas de proveedores en el contexto.
- Navegador en 390 px y 1440 px; sin errores de JavaScript, sin desbordamiento horizontal móvil. Panel revisado visualmente.
- SQL del contador probado en SQLite: 100 intentos permitidos, intento 101 bloqueado, nuevo día reinicia.
- No se detectaron patrones de claves de Google/Anthropic, claves privadas ni enlaces de hojas de Google en los archivos de texto revisados. No equivale a una auditoría completa de privacidad.

## Límites de lo comprobado
Gemini se simuló: no se utilizaron las claves del usuario. No se publicó en GitHub ni Cloudflare ni se creó D1. La integración real se valida después de seguir LEEME-ARES.md.
La búsqueda de texto es por términos; códigos exactos ofrecen mejores resultados. No es una búsqueda semántica completa ni garantiza equivalencias técnicas.
El proyecto es una DEMO local pública, con permisos simulados. No está listo para datos reales. No incluye instalación PWA, imágenes para Gemini, conversación con memoria ni búsqueda web.
