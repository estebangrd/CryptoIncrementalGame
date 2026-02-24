/**
 * narrativeLogic.ts — Pure functions for the Narrative Events system (Phase 6).
 * Based on spec: specs/game-mechanics/narrative-events.md
 */

import { NarrativeEvent } from '../types/game';
import { NARRATIVE_CONFIG } from '../config/balanceConfig';

/**
 * Checks if any event thresholds have been crossed between the previous and new
 * planet resource values. Returns the newly triggered events (not yet in existingEvents).
 *
 * Trigger condition: prevResources > threshold AND newResources <= threshold
 * and the threshold hasn't been triggered before.
 */
export const checkNarrativeThresholds = (
  prevResources: number,
  newResources: number,
  existingEvents: NarrativeEvent[],
  aiLevel: number,
): NarrativeEvent[] => {
  const triggeredThresholds = new Set(existingEvents.map(e => e.threshold));
  const newEvents: NarrativeEvent[] = [];

  for (const threshold of NARRATIVE_CONFIG.EVENT_THRESHOLDS) {
    if (
      !triggeredThresholds.has(threshold) &&
      prevResources > threshold &&
      newResources <= threshold
    ) {
      newEvents.push({
        threshold,
        triggeredAt: Date.now(),
        planetResourcesAtTrigger: newResources,
        aiActiveAtTrigger: aiLevel === 3,
        dismissed: false,
      });
    }
  }

  return newEvents;
};

/**
 * Returns the first undismissed narrative event, or null if all are dismissed.
 * Used to determine which event modal to show next.
 */
export const getPendingNarrativeEvent = (events: NarrativeEvent[]): NarrativeEvent | null => {
  return events.find(e => !e.dismissed) ?? null;
};

/**
 * Returns the translation key for the event text, accounting for AI variant.
 */
export const getNarrativeEventTextKey = (threshold: number, aiActiveAtTrigger: boolean): string => {
  const events = NARRATIVE_CONFIG.EVENTS;
  const eventConfig = events[threshold as keyof typeof events];
  if (!eventConfig) return '';

  if (eventConfig.hasAIVariant && aiActiveAtTrigger) {
    return (eventConfig as { textKeyWithAI: string }).textKeyWithAI;
  }

  if ('textKey' in eventConfig) {
    return (eventConfig as { textKey: string }).textKey;
  }

  return (eventConfig as { textKeyDefault: string }).textKeyDefault;
};
