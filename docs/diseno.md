# Diseño de Manta: Tinta y Abisal

La app tiene dos mundos visuales. Sigue al sistema (claro u oscuro) y se puede fijar en Ajustes › Apariencia (Día o Noche).

|                     | Tinta (día)                                                | Abisal (noche, "modo cabina")                              |
| ------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| Idea                | Tinta sobre papel, como la pintura china                   | El mar de noche, con plancton que brilla                   |
| Fondo               | Papel `#F3F3EF`                                            | Mar profundo `#05121D` con luz arriba y puntos de plancton |
| Texto               | Tinta `#17191B`, suave `#55595D`                           | `#E6F6F7`, suave `#93B4BE`                                 |
| Acento              | Bermellón `#B8321F` (el sello)                             | Cian luminoso `#5FE3E8`                                    |
| Botón principal     | Bermellón con texto papel                                  | Menta `#8BF5C8` con brillo                                 |
| "Anclada"           | Tinta azul `#2C4A5A`                                       | Menta                                                      |
| Títulos             | Cormorant Garamond                                         | Sora                                                       |
| Texto de lectura    | Atkinson Hyperlegible Next                                 | Atkinson Hyperlegible Next                                 |
| Paneles             | Papel con filete fino, esquinas casi rectas                | Vidrio oscuro con borde, esquinas de 24                    |
| Respiración         | Ensō: un círculo de una pincelada que se dibuja al inhalar | Anillo de luz que se expande al inhalar                    |
| Mareas de la semana | Sello bermellón 潮 por día practicado                      | Columnas que se llenan de luz                              |
| Espacios            | Su carácter: 坐 silla, 立 en el lugar, 行 forma completa   | Su planta vista desde arriba, luminosa                     |
| Final de clase      | Ensō cerrado con el sello 完                               | La manta que se desliza, luminosa                          |

## Reglas

- Todos los colores, fuentes y tamaños salen de `apps/mobile/src/theme/tokens.ts`. Ninguna pantalla escribe un color a mano, salvo los detalles propios de un mundo (por ejemplo, el ámbar de la campana en Abisal).
- Los componentes de `src/ui` deciden cómo se ve cada mundo (`palette.name === 'tinta' | 'abisal'`). Las pantallas no repiten esas decisiones.
- Cada movimiento lleva su nombre original en chino y en pinyin (`hanzi`, `pinyin` en la línea de tiempo). Tinta los muestra; Abisal muestra solo el pinyin.
- El texto de lectura nunca baja de 18 pt y las áreas táctiles nunca bajan de 44 pt (56 en lo principal).
- El brillo de Abisal (`glowShadow`) va en vistas con fondo; para íconos y figuras se usa `contentGlow`, que solo dibuja en iOS (en Android y web saldría una caja).
- Cormorant usa cifras antiguas: los títulos fuerzan cifras alineadas (`lining-nums`).

La exploración original de las tres direcciones (A · Cartel de puerto, B · Tinta, C · Abisal) está en el lienzo de diseño del proyecto.
