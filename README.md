# Manta

Tai chi en el espacio que tengas, con o sin internet.

## Estructura

```
manta/
├── apps/
│   ├── mobile/          App iOS + Android (Expo SDK 57, Expo Router, NativeWind)
│   ├── api/             API (NestJS 12 + Prisma 7 + PostgreSQL)
│   └── web/             Landing y lista de espera (Next.js 16 + Tailwind 4)
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
| `pnpm web`                                   | Landing en http://localhost:3001                              |
| `pnpm dev`                                   | API y web juntas                                              |
| `pnpm mobile`                                | Servidor de Expo para la app                                  |
| `pnpm db:migrate`                            | Crea y aplica una migración después de editar `schema.prisma` |
| `pnpm db:seed`                               | Carga programas y clases de ejemplo                           |
| `pnpm db:studio`                             | Explorador visual de la base de datos                         |
| `pnpm typecheck` · `pnpm lint` · `pnpm test` | Lo mismo que corre la CI                                      |

## App en el teléfono

La app usa módulos nativos (video, notificaciones, RevenueCat), así que no corre en Expo Go: necesita un build de desarrollo.

1. `cd apps/mobile && npx eas-cli@latest init`
2. `npx eas-cli@latest build --profile development --platform android` (o `ios`)
3. Instala el build en el teléfono y corre `pnpm mobile`.

En un teléfono físico, `localhost` no es tu computadora: en `apps/mobile/.env.local` pon la IP de tu red local, por ejemplo `http://192.168.1.20:3000/v1`.

## Variables de entorno

| Archivo                  | Contiene                                                             |
| ------------------------ | -------------------------------------------------------------------- |
| `apps/api/.env`          | Base de datos, secreto del webhook de RevenueCat, credenciales de R2 |
| `apps/mobile/.env.local` | URL de la API y llaves públicas de RevenueCat                        |
| `apps/web/.env.local`    | URL de la API                                                        |

Ninguno se sube a git. Las plantillas están en los `.env.example`.

## Antes del primer build para tiendas

- Revisa el ID de la app `com.mantataichi.app` en `apps/mobile/app.json`: no se puede cambiar después de publicar.
- Crea el entitlement `premium` en RevenueCat y configura el webhook hacia `/v1/webhooks/revenuecat`.

## Siguiente paso

Producir el primer clip del instructor y probarlo en el teléfono: [docs/instructor-video.md](docs/instructor-video.md).
