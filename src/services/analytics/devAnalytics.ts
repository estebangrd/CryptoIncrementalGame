import { IAnalyticsProvider, AnalyticsEventName, AnalyticsEventMap } from './types';

/**
 * Development analytics provider — logs all events to console.
 * Swap to FirebaseAnalyticsProvider in production.
 */
export class DevAnalyticsProvider implements IAnalyticsProvider {
  async initialize(): Promise<void> {
    console.log('[Analytics] DevAnalyticsProvider initialized');
  }

  logEvent<K extends AnalyticsEventName>(name: K, params: AnalyticsEventMap[K]): void {
    console.log(`[Analytics] ${name}`, JSON.stringify(params));
  }

  setUserProperties(properties: Record<string, string | number | boolean>): void {
    console.log('[Analytics] setUserProperties', JSON.stringify(properties));
  }
}
