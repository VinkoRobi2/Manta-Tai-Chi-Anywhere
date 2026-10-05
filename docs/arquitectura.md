# Arquitectura de Manta

## Principios

1. **Offline primero.** Todo lo necesario para practicar vive en el teléfono: paquetes de clases, progreso (SQLite) y acceso premium (caché de RevenueCat). La red solo se usa para descargar y sincronizar.
2. **Las clases son datos.** La app es un reproductor de líneas de tiempo. Una clase nueva es un paquete nuevo en el bucket más una fila en la base de datos; no requiere publicar otra versión de la app.
3. **Backend pequeño.** La API hace cuatro cosas: catálogo, enlaces de descarga firmados, webhooks de RevenueCat y lista de espera.

## Piezas

| Pieza           | Tecnología                                        | Responsabilidad                                    |
| --------------- | ------------------------------------------------- | -------------------------------------------------- |
| apps/mobile     | Expo SDK 57, Expo Router, expo-sqlite, expo-video | Experiencia completa, offline                      |
| apps/api        | NestJS 12, Prisma 7, PostgreSQL                   | Catálogo, descargas, compras, lista de espera      |
| apps/web        | Next.js 16, Tailwind 4                            | Landing y lista de espera                          |
| packages/shared | TypeScript + Zod                                  | Contratos entre app y API                          |
| Contenido       | Cloudflare R2 + CDN                               | Paquetes de clases                                 |
| Pagos           | RevenueCat                                        | Suscripción anual/mensual y pago único de por vida |

## Decisiones

- **NestJS y no Go para la API:** Prisma Client Go fue archivado en 2025 y no es compatible con Prisma 7.
- **Prisma solo en el servidor:** en el teléfono se usa SQLite directo con migraciones numeradas (src/db/database.ts).
- **NativeWind 4 (estable)** en vez de la v5, que sigue en release candidate.
- **Dos mundos visuales, Tinta de día y Abisal de noche:** ver [diseno.md](diseno.md).
- **Instructor en video realista, no 3D en tiempo real:** se ve natural en cualquier teléfono y no depende de un motor 3D. Ver [instructor-video.md](instructor-video.md).
- **Motor del reproductor puro en @manta/shared:** recibe el tiempo desde afuera, así que se prueba con tests sin teléfono.
- **Las líneas de tiempo se generan desde guiones** (`content/guiones`) con `pnpm content:lessons`. La app solo las lee.
- **Puerto 5433 para Postgres local:** evita chocar con un Postgres que ya tengas instalado.

## Seguridad

- Ningún secreto en la app: solo las llaves públicas de RevenueCat.
- Contenido premium solo mediante enlaces firmados que caducan (SIGNED_URL_TTL_SECONDS).
- Webhook de RevenueCat protegido con secreto en la cabecera Authorization (comparación en tiempo constante).
- Helmet, CORS restringido, validación estricta de entradas (class-validator y Zod) y límite de peticiones por IP.
- Variables de entorno validadas al arrancar.
- **Límite conocido:** `x-app-user-id` identifica, no autentica. Alguien que comparta su ID podría compartir su acceso premium. Es aceptable para lanzar; si se abusa, el siguiente paso es consultar la API de RevenueCat en cada descarga o agregar cuentas.
- Cualquier app offline permite, con esfuerzo, extraer archivos ya descargados. Se protege la puerta (pagos y descargas), no cada archivo.
