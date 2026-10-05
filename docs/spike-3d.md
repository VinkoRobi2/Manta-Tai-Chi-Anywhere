# Prueba del motor 3D (hacer primero)

Objetivo: confirmar que un personaje con una animación de tai chi corre fluido en teléfonos modestos, empezando por el de tu papá. Se hace en una rama aparte para que, si la librería nativa da problemas, el resto del proyecto no se frene.

## Pasos

1. `git switch -c spike/motor-3d`
2. `cd apps/mobile && npx expo install react-native-filament react-native-worklets-core`
3. Configura el plugin de Babel de worklets-core según la documentación actual de react-native-filament y verifica que conviva con Reanimated 4.
4. Pon un personaje `.glb` con un clip de tai chi en `assets/models/`.
5. Crea `src/features/player/stage.tsx` con `FilamentScene`, `FilamentView`, `Camera`, `DefaultLight` y `Model`.
6. Haz un build de desarrollo (`npx eas-cli@latest build --profile development --platform android`) e instálalo en el teléfono.

## Criterios de éxito

- Animación fluida y estable durante 10 minutos, sin que el teléfono se caliente.
- El modelo carga desde un archivo descargado (no solo desde los assets de la app).
- La voz suena sincronizada con el movimiento.

## Plan B

Si no se cumple: prerrenderizar cada clase como video en tres ángulos (frontal, lateral y espejo). Pesa más, pero funciona en cualquier teléfono.
