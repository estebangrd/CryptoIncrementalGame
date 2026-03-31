/**
 * Tests for market event toast notification bug:
 * - Toast animation restarts on every parent re-render because onDismiss
 *   is an unstable reference (new arrow function on every render).
 * - filterExpiredEvents returns a new array reference even when nothing
 *   was filtered, causing the market event detection useEffect to fire
 *   on every production tick.
 *
 * Based on spec: specs/game-mechanics/market-price-unification.md
 */

import { filterExpiredEvents } from '../src/utils/marketEventLogic';
import { ActiveMarketEvent } from '../src/types/game';

describe('filterExpiredEvents referential stability', () => {
  const now = Date.now();
  const activeEvent: ActiveMarketEvent = {
    id: 'media_hype',
    multiplier: 1.18,
    activatedAt: now - 60_000,
    expiresAt: now + 240_000, // 4 min left
    labelKey: 'marketEvent.mediaHype',
  };

  it('returns the SAME array reference when no events are expired', () => {
    const events = [activeEvent];
    const result = filterExpiredEvents(events, now);
    expect(result).toBe(events); // toBe checks referential equality
  });

  it('returns a NEW array when some events expired', () => {
    const expiredEvent: ActiveMarketEvent = {
      id: 'whale_dump',
      multiplier: 0.85,
      activatedAt: now - 300_000,
      expiresAt: now - 1000, // expired
      labelKey: 'marketEvent.whaleDump',
    };
    const events = [activeEvent, expiredEvent];
    const result = filterExpiredEvents(events, now);
    expect(result).not.toBe(events);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('media_hype');
  });

  it('returns the same empty array reference for empty input', () => {
    const events: ActiveMarketEvent[] = [];
    const result = filterExpiredEvents(events, now);
    expect(result).toBe(events);
  });

  it('keeps permanent events (expiresAt === null)', () => {
    const permanent: ActiveMarketEvent = {
      id: 'ai_autonomous',
      multiplier: 1.15,
      activatedAt: now - 100_000,
      expiresAt: null,
      labelKey: 'marketEvent.aiAutonomous',
    };
    const events = [permanent, activeEvent];
    const result = filterExpiredEvents(events, now);
    expect(result).toBe(events); // nothing expired, same ref
  });
});
