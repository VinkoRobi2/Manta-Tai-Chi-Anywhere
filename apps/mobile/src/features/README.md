# Funcionalidades

Las pantallas viven en `src/app` (Expo Router) y los componentes visuales compartidos en `src/ui`.

- `onboarding/` — bienvenida con fotos de tai chi, cinco preguntas, "Creando tu plan" y el plan (`src/app/bienvenida`). Las respuestas se guardan en el teléfono al terminar. `responsive.ts` tiene los cortes por tamaño de pantalla (teléfono bajo, teléfono, tablet, apaisado). `motion.tsx` es el lenguaje de movimiento: todo respira (inhalar 4 s, exhalar 5 s): el sol con halo, las ondas, los títulos palabra por palabra, las estelas, las chispas. Todo respeta "Reducir movimiento".
- `home/`, `catalog/`, `practice/` — Inicio, el catálogo que la app lleva dentro y las prácticas (en el teléfono y, con cuenta, en la nube).
- `settings/` — las respuestas del onboarding, guardadas en el teléfono.
