import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { CountdownTimer } from '../../src/components/CountdownTimer'

/**
 * Dedicated coverage for the countdown's two load-bearing behaviors that
 * the page-level tests don't exercise: it genuinely re-renders over time
 * (not a static snapshot of `Date.now()` at mount), and it clears its
 * `setInterval` on unmount. An interval leak here would keep firing in
 * every subsequent test file in this process, not just this one.
 */
describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  test('ticks down every second while mounted', () => {
    const target = new Date(Date.now() + 5000).toISOString()
    render(<CountdownTimer targetIso={target} />)

    const before = screen.getByTestId('countdown-timer').textContent

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    const after = screen.getByTestId('countdown-timer').textContent
    expect(after).not.toBe(before)
  })

  test('clears its interval on unmount (no leaked setState)', () => {
    const target = new Date(Date.now() + 5000).toISOString()
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

    const { unmount } = render(<CountdownTimer targetIso={target} />)
    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()

    // If the interval had leaked, this would call `setState` on an
    // unmounted component and React would warn/throw.
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(5000)
      })
    }).not.toThrow()

    clearIntervalSpy.mockRestore()
  })
})
