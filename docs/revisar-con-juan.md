# Revisar con Juan (llamada del viernes)

## 1. Honorarios: tres definiciones

Se pueden cambiar después desde Plantillas → Honorarios, sin tocar código.

1. **Obra nueva: ¿60 % proyecto / 40 % dirección, o al revés?** El título del Excel dice 60/40 y las fórmulas calculan 40/60. Ahora está 60/40. El total de proyecto y dirección da igual; cambia solo si se cobra uno de los dos por separado.
2. **Vivienda y reforma de más de 500 m²: ¿qué porcentaje?** Ahora sigue el 15,33 % (el último tramo del Excel).
3. **El 4,5 % de más de 500 m² (no vivienda): ¿sobre toda la obra o solo sobre los m² que pasan de 500?** Hoy una obra de 499 m² paga 15,33 % y una de 501 m², 4,5 %: la más grande termina pagando mucho menos.

## 2. Datos que tiene que cargar el estudio

En el panel, Plantillas → Datos del estudio (está en el manual, sección 02):

- DNI y matrícula de Josefina y de Juan.
- Domicilio legal del estudio (lo pide el contrato CPAU).
- Cada uno cambia su contraseña en el primer ingreso.

## 3. Correos automáticos (avisos de entregas y recordatorio a proveedores)

Hoy el panel no manda correos: falta configurar Resend (gratis hasta 3.000 por mes). Decidir con Juan con qué cuenta se crea (conviene la del estudio).

1. Crear la cuenta en resend.com → Domains → Add Domain → `norestearq.com` (región São Paulo).
2. Copiar los registros DNS que muestra Resend en Vercel → Domains → norestearq.com → DNS Records. Esperar a que Resend marque el dominio como verificado.
3. En Resend → API Keys → crear una clave.
4. En Vercel → Settings → Environment Variables (Production):
   - `RESEND_API_KEY` = la clave del paso 3
   - `CORREO_DE` = `Noreste Arquitectura <avisos@norestearq.com>`
   - `CORREO_SOLO_A` = los mails de Juan y Fefa, separados por coma (modo prueba: solo les llega a ellos)
5. Redeploy y probar: mandar una entrega a revisión y ver que llegue el correo.
6. Cuando esté bien, borrar `CORREO_SOLO_A` y redeploy: los correos empiezan a llegarle a cada persona y a los proveedores.

## 4. Pendiente del estudio

- Una lista de precios de un corralón o casa de materiales con la que trabajen (la que mandaron era de un vivero).
- Entregarle el manual: `docs/Manual del panel - noreste arq.pdf`.
