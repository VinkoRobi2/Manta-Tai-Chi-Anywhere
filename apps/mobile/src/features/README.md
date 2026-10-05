# Funcionalidades

Cada carpeta es una funcionalidad con su lógica y estado propios. Las pantallas viven en `src/app` (Expo Router) y los componentes visuales compartidos en `src/ui`.

- `catalog/` — catálogo de ejemplo con la forma de `GET /v1/catalog` y las líneas de tiempo empaquetadas (`timelines.generated.ts`, generado con `pnpm content:lessons`).
- `player/` — reproductor: conecta el motor de `@manta/shared` con el reloj, la voz (`voice.ts`), la marea (`Tide.tsx`) y el escenario del instructor (`InstructorStage.tsx`, video realista).
- `downloads/` — clases "ancladas" (disponibles sin señal). Fase 1: descarga simulada con la misma interfaz que tendrá la real.
- `sessions/` — bitácora local (SQLite).
- `settings/` — preferencias guardadas en el teléfono.
- `reminders/` — recordatorio diario local, sin internet.
- `paywall/` — compras. Fase 1: `FakePurchases`; después RevenueCat con la misma interfaz.
- `review/` — pedir reseña en la tienda solo en un buen momento.
