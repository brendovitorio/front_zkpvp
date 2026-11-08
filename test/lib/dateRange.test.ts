import { describe, expect, test } from 'vitest'
import { getCurrentWeekRange } from '../../src/lib/dateRange'

describe('getCurrentWeekRange', () => {
  test('returns the Monday-Sunday window for a mid-week reference date', () => {
    // Wednesday, 2026-11-04 (Nov 2026: 1st is a Sunday, so the 2nd is
    // Monday and the 8th is Sunday — matches design.md's own example
    // week, "02 A 08 DE NOVEMBRO").
    const wednesday = new Date(2026, 10, 4, 15, 30)

    expect(getCurrentWeekRange(wednesday)).toEqual({
      from: '2026-11-02',
      to: '2026-11-08',
    })
  })

  test('returns the same-week Monday when the reference date is a Sunday', () => {
    // Sunday 2026-11-08 belongs to the week starting Monday 2026-11-02,
    // not the week after — this is the edge case `getDay() === 0` needs
    // the `-6` offset for, not `1 - 0 = 1` (which would roll forward).
    const sunday = new Date(2026, 10, 8, 9, 0)

    expect(getCurrentWeekRange(sunday)).toEqual({
      from: '2026-11-02',
      to: '2026-11-08',
    })
  })

  test('returns the same-week Sunday when the reference date is a Saturday', () => {
    const saturday = new Date(2026, 10, 7, 23, 59)

    expect(getCurrentWeekRange(saturday)).toEqual({
      from: '2026-11-02',
      to: '2026-11-08',
    })
  })
})
