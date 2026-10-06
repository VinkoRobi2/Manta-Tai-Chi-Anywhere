# Manta

Tai chi en el espacio que tengas, con o sin internet.

## Estructura

```
manta/
├── apps/
│   ├── mobile/          App iOS + Android: por ahora, el onboarding con cuenta (Expo SDK 57, Expo Router)
│   └── api/             API (NestJS 12 + Prisma 7 + PostgreSQL)
├── packages/
│   └── shared/          Tipos y esquemas Zod compartidos
├── content/             Producción de clases (ver content/README.md)
├── infra/               docker-compose con PostgreSQL
├── docs/                Arquitectura, instructor en video y prompt de la Fase 1
└── .github/workflows/   CI
```

## Requisitos

- Node 22 LTS (o 20.19+) y pnpm 10.34.6
- Docker Desktop (para PostgreSQL)
- Cuenta de Expo para builds: `npx eas-cli@latest login`

## Comandos del día a día

| Comando                                      | Qué hace                                                      |
| -------------------------------------------- | ------------------------------------------------------------- |
| `pnpm db:up`                                 | Levanta PostgreSQL en Docker (puerto 5433)                    |
| `pnpm api`                                   | API en http://localhost:3000/v1 con recarga automática        |
| `pnpm dev`                                   | La API a través de turbo                                      |
| `pnpm mobile`                                | Servidor de Expo para la app                                  |
| `pnpm db:migrate`                            | Crea y aplica una migración después de editar `schema.prisma` |
| `pnpm db:seed`                               | Carga programas y clases de ejemplo                           |
| `pnpm db:studio`                             | Explorador visual de la base de datos                         |
| `pnpm typecheck` · `pnpm lint` · `pnpm test` | Lo mismo que corre la CI                                      |

## App en el teléfono

La app corre en Expo Go: `cd apps/mobile && npx expo start --go`. Entrar con Apple funciona en Expo Go (iPhone); entrar con Google necesita un build de desarrollo:

1. `cd apps/mobile && npx eas-cli@latest init`
2. `npx eas-cli@latest build --profile development --platform ios` (o `android`)
3. Instala el build en el teléfono y corre `pnpm mobile`.

En desarrollo la app encuentra sola la API en tu computadora (usa la misma IP que Expo), aunque `.env.local` diga `localhost`. Si Windows lo pregunta, deja que Node reciba conexiones en redes privadas.

## Entrar con Apple y Google

Sin internet se entra como invitado: el progreso se guarda en el teléfono y se sube a la nube al entrar con una cuenta. Para las cuentas:

1. **Base de datos:** `pnpm db:up` y `pnpm db:migrate` (crea las tablas `Account` y `UserProgress`).
2. **API** (`apps/api/.env`): `AUTH_JWT_SECRET` (genéralo con `openssl rand -base64 48`), `APPLE_AUDIENCES` y `GOOGLE_CLIENT_IDS`.
3. **Google Cloud** (APIs y servicios > Credenciales > ID de cliente de OAuth):
   - _Web_: su ID va en `GOOGLE_CLIENT_IDS` (API) y en `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (app).
   - _iOS_, con el bundle `com.mantataichi.app`: su ID va en `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (también activa el plugin de Google, ver `apps/mobile/app.config.ts`).
   - _Android_, con el paquete `com.mantataichi.app` y el SHA-1 de la firma (`npx eas-cli@latest credentials`).
4. **Apple:** EAS activa "Sign in with Apple" para `com.mantataichi.app` al compilar. En producción quita `host.exp.Exponent` (Expo Go) de `APPLE_AUDIENCES`.

## Variables de entorno

| Archivo                  | Contiene                                                      |
| ------------------------ | ------------------------------------------------------------- |
| `apps/api/.env`          | Base de datos, sesiones, Apple y Google, RevenueCat y R2      |
| `apps/mobile/.env.local` | URL de la API (opcional en desarrollo) y Client IDs de Google |

Ninguno se sube a git. Las plantillas están en los `.env.example`.

## Antes del primer build para tiendas

- Revisa el ID de la app `com.mantataichi.app` en `apps/mobile/app.json`: no se puede cambiar después de publicar.
- Crea el entitlement `premium` en RevenueCat y configura el webhook hacia `/v1/webhooks/revenuecat`.

## Siguiente paso

La app hoy es el onboarding: bienvenida, cuenta, cinco preguntas y el plan. Lo siguiente se construye a partir del plan (`apps/mobile/src/app/bienvenida/plan.tsx`), donde «Empezar primera clase» todavía vuelve a la bienvenida.
