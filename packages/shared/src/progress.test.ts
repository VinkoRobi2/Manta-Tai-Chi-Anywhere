import { describe, expect, it } from 'vitest';
import { groupByDay, practiceTotals, startOfWeek, tideWeek, type PracticeRecord } from './progress.js';

// Fechas locales para que los tests no dependan de la zona horaria de la máquina.
const at = (day: number, hour = 8, minute = 0) => new Date(2026, 9, day, hour, minute);
const NOW = at(8, 12); // jueves 8 de octubre de 2026

const RECORDS: PracticeRecord[] = [
  { completedAt: at(5, 6, 55), durationSec: 360, mood: 'MODERATE' }, // lunes
  { completedAt: at(7, 18, 10), durationSec: 480, mood: 'SLIGHT' }, // miércoles
  { completedAt: at(8, 7, 32), durationSec: 420, mood: 'CALM' }, // jueves
  { completedAt: at(8, 9, 0), durationSec: 300, mood: 'CALM' }, // jueves otra vez
  { completedAt: at(1, 9), durationSec: 600, mood: 'CALM' }, // semana anterior, mismo mes
  { completedAt: new Date(2026, 8, 28, 9), durationSec: 600 }, // septiembre
];

describe('startOfWeek', () => {
  it('empieza el lunes a medianoche', () => {
    expect(startOfWeek(NOW)).toEqual(new Date(2026, 9, 5));
    expect(startOfWeek(at(11, 23))).toEqual(new Date(2026, 9, 5)); // domingo
  });
});

describe('tideWeek', () => {
  it('cuenta días con práctica, no sesiones', () => {
    const week = tideWeek(RECORDS, NOW);
    expect(week.days).toEqual([true, false, true, true, false, false, false]);
    expect(week.count).toBe(3);
    expect(week.todayIndex).toBe(3);
    expect(week.reached).toBe(true);
  });

  it('una semana vacía no es un fracaso, solo empieza en cero', () => {
    const week = tideWeek([], NOW);
    expect(week.count).toBe(0);
    expect(week.reached).toBe(false);
  });
});

describe('practiceTotals', () => {
  it('suma minutos de la semana y del mes', () => {
    const totals = practiceTotals(RECORDS, NOW);
    expect(totals.weekMinutes).toBe(26);
    expect(totals.monthMinutes).toBe(36);
    expect(totals.sessions).toBe(6);
    expect(totals.frequentMood).toBe('CALM');
  });

  it('en empate elige el mar más tranquilo', () => {
    const tie: PracticeRecord[] = [
      { completedAt: at(6), durationSec: 60, mood: 'ROUGH' },
      { completedAt: at(7), durationSec: 60, mood: 'SLIGHT' },
    ];
    expect(practiceTotals(tie, NOW).frequentMood).toBe('SLIGHT');
  });

  it('sin estados registrados no hay mar frecuente', () => {
    expect(practiceTotals([], NOW).frequentMood).toBeNull();
  });
});

describe('groupByDay', () => {
  it('agrupa por día, del más reciente al más antiguo', () => {
    const groups = groupByDay(RECORDS);
    expect(groups.map((group) => group.key)).toEqual([
      '2026-10-08',
      '2026-10-07',
      '2026-10-05',
      '2026-10-01',
      '2026-09-28',
    ]);
    expect(groups[0]!.records.map((record) => record.completedAt.getHours())).toEqual([9, 7]);
  });
});
