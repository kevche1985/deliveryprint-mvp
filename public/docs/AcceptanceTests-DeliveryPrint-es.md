Guía de Pruebas de Aceptación — DeliveryPrint (para Usuarios)

Propósito
- Validar que una persona usuaria puede registrarse, personalizar un producto, guardarlo, comprarlo y descargarlo, con mensajes claros y sin pasos técnicos.

Antes de empezar
- Usa el mismo dominio durante todo el proceso (por ejemplo, https://www.groupdeliveryprint.com).
- Crea una cuenta o ten una lista de acceso a mano.
- Ten una imagen ligera para probar (ideal < 8 MB).

Escenario 1: Iniciar sesión
- Entra a “Iniciar sesión”, escribe tu correo y contraseña.
- Esperado: ves tu nombre/correo en la parte superior y puedes navegar sin pedirte login.

Escenario 2: Probar el editor sin estar conectado
- Abre un producto y entra a “Personalizar diseño”.
- Haz clic en “Guardar diseño” sin iniciar sesión.
- Esperado: aparece el mensaje “Please log in to be able to personalize products”.

Escenario 3: Personalizar y guardar (ya conectado)
- Sube una imagen, añade texto o formas y ajusta el tamaño/posición.
- Pulsa “Guardar diseño”.
- Esperado: aparece confirmación de guardado y tu diseño queda disponible (miniatura o vista previa).

Escenario 4: Añadir al carrito y pagar
- Desde el producto personalizado, añade al carrito.
- Ve al carrito y procede al pago.
- Completa el pago según el método disponible (Wompi/PayPal).
- Esperado: confirmación de compra y el pedido aparece en tu cuenta.

Escenario 5: Descargar tu producto digital
- Ve a “Descargas” o a los detalles del pedido y selecciona tu diseño.
- Descarga el archivo (por ejemplo, PNG).
- Esperado: el archivo se descarga correctamente y puedes abrirlo.

Escenario 6: Revisar pedidos
- Entra a “Mis pedidos”.
- Esperado: ves tu pedido con estado actualizado y los artículos correspondientes.

Escenario 7: Cambiar el idioma
- Cambia entre Español e Inglés.
- Esperado: los textos principales (botones, mensajes, editor, checkout) se muestran en el idioma elegido.

Escenario 8 (opcional): Tamaño de imagen grande
- Intenta guardar un diseño con una imagen muy pesada (>8 MB).
- Esperado: mensaje indicando que la imagen es demasiado grande; la app sigue funcionando.

Escenario 9 (opcional): Tiendas/tenants (solo administradores)
- Si tienes acceso de administrador, crea una nueva tienda desde el panel.
- Esperado: creación con mensaje claro y sin errores.

Qué anotar
- Capturas de pantalla de: editor, confirmación de guardado, carrito, pago, descargas y pedidos.
- Breve nota de cualquier mensaje raro o paso confuso.

Problemas frecuentes y solución
- Si te pide iniciar sesión repetidamente: usa el mismo dominio (con o sin “www”) y vuelve a iniciar sesión.
- Si no se guarda el diseño: revisa que estés conectado y que tu imagen no supere el límite.
- Si el pago falla: vuelve a intentar o usa otro método.

Resultado esperado
- Mensajes claros, proceso fluido y diseño disponible para descargar después de la compra.