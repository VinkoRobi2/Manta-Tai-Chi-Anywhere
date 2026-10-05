# El instructor: video realista

**Decisión:** Manta no usa un personaje 3D animado en tiempo real. El instructor es **video**: una persona de aspecto real haciendo cada movimiento, de frente y de lado. La figura 3D estilizada se descartó porque no se veía natural.

## Por qué video

- Se ve natural en cualquier teléfono, incluso en uno modesto: no hay motor 3D ni riesgo de que la animación vaya a saltos.
- La app ya está preparada: cada segmento de la clase apunta a un clip (`clip` de frente y `clipSide` de lado). El espejo y la velocidad (0,5× a 1×) los aplica el reproductor.
- Funciona sin internet: los videos viajan dentro del paquete de la clase que se ancla.
- Mientras un movimiento no tenga video, la clase igual funciona con voz, subtítulos y la marea que respira. Es lo que hace hoy la Fase 1.

## Cómo producir los clips

De más confiable a más experimental:

1. **Movimiento real con un avatar realista renderizado.** Se captura el movimiento de un instructor (con captura desde video o con traje), se aplica a un personaje realista (por ejemplo, MetaHuman en Unreal Engine) y se renderiza el video. El movimiento es exacto porque viene de una persona.
2. **Video con IA a partir de un video de referencia.** Herramientas que transfieren el movimiento de un video de referencia a un personaje realista y siempre igual. Es más barato; hay que revisar manos, pies y que el cuerpo no se deforme.
3. **Video generado solo con texto.** Hoy no es confiable para tai chi: los movimientos son largos, simétricos y con manos visibles. Sirve solo para pruebas.

En los tres casos, un instructor de tai chi certificado revisa cada clip antes de publicar.

## Especificaciones de cada clip

- Un clip por movimiento y por vista (frente y lado).
- En bucle sin corte: el primer y el último cuadro coinciden. Duración de un ciclo de respiración completo (8 a 12 s); el reproductor lo repite durante todo el segmento.
- 1080 × 1350 (4:5) o 1080 × 1920, H.264 o HEVC, 24 a 30 cuadros por segundo, **sin audio** (la voz va aparte).
- Fondo oscuro y liso entre `#0B3C49` y `#06232B`, para que la marea del reproductor se funda con el video.
- El mismo personaje, con la misma ropa, en todas las clases.
- El ritmo del clip sigue la respiración del movimiento definida en `content/guiones/movimientos.json`.
- Peso objetivo: 1 a 2 MB por clip. Una clase de 6 a 9 minutos pesa entre 15 y 30 MB.

## Cómo probar un clip en la app hoy

1. Copia el `.mp4` a `apps/mobile/assets/videos/`.
2. En `apps/mobile/src/features/player/InstructorStage.tsx`, agrégalo a `PACKAGED_CLIPS`:
   ```ts
   'comienzo.mp4': require('../../../assets/videos/comienzo.mp4'),
   ```
3. Abre la clase "Primeros movimientos": el segmento Comienzo se verá con video y aparecerán los botones de espejo y de vista.

## Prueba antes de producir todo

Haz un solo clip de 10 segundos y pruébalo en el teléfono de tu papá:

- ¿Se ve fluido y se entiende el movimiento?
- ¿El modo espejo le ayuda a seguirlo?
- ¿Cuánto pesa y cuánta batería gasta en 10 minutos de clase?

Con esas respuestas se decide cómo producir el resto.
