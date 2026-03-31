import { ActiveMarketEvent, MarketEventId } from '../types/game';
import { MARKET_EVENT_CONFIG } from '../config/balanceConfig';

/**
 * Multiply all active event multipliers together.
 * Returns 1.0 if no events are active.
 */
export const getCompositeMultiplier = (events: ActiveMarketEvent[]): number => {
  if (!events || events.length === 0) return 1.0;
  return events.reduce((acc, e) => acc * e.multiplier, 1.0);
};

/**
 * Remove expired events. Permanent events (expiresAt === null) are kept.
 */
export const filterExpiredEvents = (
  events: ActiveMarketEvent[],
  now: number,
): ActiveMarketEvent[] => {
  if (!events || events.length === 0) return [];
  return events.filter(e => e.expiresAt === null || e.expiresAt > now);
};

/**
 * Add a new event or refresh (extend) an existing one's duration.
 * If the event already exists, its expiresAt is updated.
 * Returns a new array (immutable).
 */
export const addOrRefreshEvent = (
  events: ActiveMarketEvent[],
  id: MarketEventId,
  now: number,
): ActiveMarketEvent[] => {
  const config = MARKET_EVENT_CONFIG[id] as {
    multiplier: number;
    durationMs?: number;
    labelKey: string;
  };
  if (!config) return events;

  const expiresAt = config.durationMs ? now + config.durationMs : null;
  const existing = (events ?? []).find(e => e.id === id);

  if (existing) {
    return (events ?? []).map(e =>
      e.id === id ? { ...e, expiresAt, activatedAt: now } : e
    );
  }

  return [
    ...(events ?? []),
    {
      id,
      multiplier: config.multiplier,
      activatedAt: now,
      expiresAt,
      labelKey: config.labelKey,
    },
  ];
};

/**
 * Explicitly remove an event by ID.
 */
export const removeEvent = (
  events: ActiveMarketEvent[],
  id: MarketEventId,
): ActiveMarketEvent[] => {
  if (!events || events.length === 0) return [];
  return events.filter(e => e.id !== id);
};

/**
 * Check if a specific event is currently active.
 */
export const isEventActive = (
  events: ActiveMarketEvent[],
  id: MarketEventId,
): boolean => {
  if (!events || events.length === 0) return false;
  return events.some(e => e.id === id);
};
