import { IAnalyticsProvider, AnalyticsEventName, AnalyticsEventMap } from './types';
import { DevAnalyticsProvider } from './devAnalytics';

// ── Singleton provider ────────────────────────────────────────────────────────

let _provider: IAnalyticsProvider = new DevAnalyticsProvider();

export const setAnalyticsProvider = (provider: IAnalyticsProvider): void => {
  _provider = provider;
};

export const initializeAnalytics = async (): Promise<void> => {
  try {
    await _provider.initialize();
  } catch (_e) {
    // Analytics must never crash the game
  }
};

export const logEvent = <K extends AnalyticsEventName>(
  name: K,
  params: AnalyticsEventMap[K],
): void => {
  try {
    _provider.logEvent(name, params);
  } catch (_e) {
    // Analytics must never crash the game
  }
};

export const setUserProperties = (
  properties: Record<string, string | number | boolean>,
): void => {
  try {
    _provider.setUserProperties(properties);
  } catch (_e) {
    // Analytics must never crash the game
  }
};

export type { IAnalyticsProvider, AnalyticsEventName, AnalyticsEventMap };
