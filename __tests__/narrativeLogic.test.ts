/**
 * Unit tests for Narrative Events system (Phase 6).
 * Based on spec: specs/game-mechanics/narrative-events.md
 */

import {
  checkNarrativeThresholds,
  getPendingNarrativeEvent,
  getNarrativeEventTextKey,
} from '../src/utils/narrativeLogic';
import { NarrativeEvent } from '../src/types/game';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeEvent = (threshold: number, dismissed = false): NarrativeEvent => ({
  threshold,
  triggeredAt: Date.now(),
  planetResourcesAtTrigger: threshold - 1,
  aiActiveAtTrigger: false,
  dismissed,
});

// ─── checkNarrativeThresholds ────────────────────────────────────────────────

describe('checkNarrativeThresholds', () => {
  it('returns no events when resources stay above all thresholds', () => {
    const events = checkNarrativeThresholds(90, 85, [], 0);
    expect(events).toHaveLength(0);
  });

  it('triggers event when crossing 80% threshold downward', () => {
    const events = checkNarrativeThresholds(80.5, 79.7, [], 0);
    expect(events).toHaveLength(1);
    expect(events[0].threshold).toBe(80);
  });

  it('triggers event when crossing 60% threshold', () => {
    const events = checkNarrativeThresholds(61, 59, [], 0);
    expect(events).toHaveLength(1);
    expect(events[0].threshold).toBe(60);
  });

  it('triggers event when crossing 40% threshold', () => {
    const events = checkNarrativeThresholds(41, 39, [], 0);
    expect(events).toHaveLength(1);
    expect(events[0].threshold).toBe(40);
  });

  it('triggers event when crossing 20% threshold', () => {
    const events = checkNarrativeThresholds(21, 19, [], 0);
    expect(events).toHaveLength(1);
    expect(events[0].threshold).toBe(20);
  });

  it('triggers event when crossing 5% threshold', () => {
    const events = checkNarrativeThresholds(5.5, 4.8, [], 0);
    expect(events).toHaveLength(1);
    expect(events[0].threshold).toBe(5);
  });

  it('does not repeat event that was already triggered', () => {
    const existing = [makeEvent(80)];
    const events = checkNarrativeThresholds(79, 78, existing, 0);
    expect(events).toHaveLength(0);
  });

  it('can trigger multiple thresholds in a single large drop', () => {
    // Drop from 85 all the way to 15 — crosses 80, 60, 40, 20
    const events = checkNarrativeThresholds(85, 15, [], 0);
    const thresholds = events.map(e => e.threshold).sort((a, b) => b - a);
    expect(thresholds).toEqual([80, 60, 40, 20]);
  });

  it('does not trigger threshold when resources stay exactly at it', () => {
    // prevResources must be ABOVE threshold for trigger
    const events = checkNarrativeThresholds(80, 80, [], 0);
    expect(events).toHaveLength(0);
  });

  it('triggers at exactly 0 — threshold 5 fires when crossing below 5', () => {
    const events = checkNarrativeThresholds(5.1, 0, [], 0);
    expect(events.some(e => e.threshold === 5)).toBe(true);
  });

  it('records aiActiveAtTrigger as true when aiLevel === 3', () => {
    const events = checkNarrativeThresholds(41, 39, [], 3);
    expect(events[0].aiActiveAtTrigger).toBe(true);
  });

  it('records aiActiveAtTrigger as false when aiLevel < 3', () => {
    const events = checkNarrativeThresholds(41, 39, [], 2);
    expect(events[0].aiActiveAtTrigger).toBe(false);
  });

  it('records the actual new resources value at trigger', () => {
    const events = checkNarrativeThresholds(80.5, 79.2, [], 0);
    expect(events[0].planetResourcesAtTrigger).toBeCloseTo(79.2);
  });

  it('does not deplete without non-renewables (semantic check — threshold guard)', () => {
    // If resources never change, no thresholds are crossed
    const events = checkNarrativeThresholds(100, 100, [], 0);
    expect(events).toHaveLength(0);
  });
});

// ─── getPendingNarrativeEvent ─────────────────────────────────────────────────

describe('getPendingNarrativeEvent', () => {
  it('returns null for empty event list', () => {
    expect(getPendingNarrativeEvent([])).toBeNull();
  });

  it('returns null when all events are dismissed', () => {
    const events = [makeEvent(80, true), makeEvent(60, true)];
    expect(getPendingNarrativeEvent(events)).toBeNull();
  });

  it('returns first undismissed event', () => {
    const events = [makeEvent(80, true), makeEvent(60, false), makeEvent(40, false)];
    const pending = getPendingNarrativeEvent(events);
    expect(pending?.threshold).toBe(60);
  });

  it('returns the only undismissed event', () => {
    const events = [makeEvent(80, false)];
    const pending = getPendingNarrativeEvent(events);
    expect(pending?.threshold).toBe(80);
  });
});

// ─── getNarrativeEventTextKey ─────────────────────────────────────────────────

describe('getNarrativeEventTextKey', () => {
  it('returns standard textKey for non-AI-variant events', () => {
    expect(getNarrativeEventTextKey(80, false)).toBe('narrative.event80.text');
    expect(getNarrativeEventTextKey(60, false)).toBe('narrative.event60.text');
    expect(getNarrativeEventTextKey(20, false)).toBe('narrative.event20.text');
    expect(getNarrativeEventTextKey(5, false)).toBe('narrative.event5.text');
  });

  it('returns textKeyWithAI for threshold 40 when AI was active', () => {
    expect(getNarrativeEventTextKey(40, true)).toBe('narrative.event40.textWithAI');
  });

  it('returns textKeyDefault for threshold 40 when AI was not active', () => {
    expect(getNarrativeEventTextKey(40, false)).toBe('narrative.event40.textDefault');
  });

  it('returns empty string for unknown threshold', () => {
    expect(getNarrativeEventTextKey(99, false)).toBe('');
  });
});

// ─── Collapse trigger logic (via threshold check) ────────────────────────────

describe('collapse trigger (via threshold boundaries)', () => {
  it('triggers threshold 5 event before resources reach 0', () => {
    // Resources cross from above 5% to 0
    const events = checkNarrativeThresholds(5.2, 0, [], 0);
    expect(events.some(e => e.threshold === 5)).toBe(true);
  });

  it('no new events when resources are already at 0', () => {
    // All thresholds already triggered, nothing new
    const existing = [80, 60, 40, 20, 5].map(t => makeEvent(t, true));
    const events = checkNarrativeThresholds(0, 0, existing, 0);
    expect(events).toHaveLength(0);
  });
});
