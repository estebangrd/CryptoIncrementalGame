// Google UMP (User Messaging Platform) consent flow.
// Wraps AdsConsent so AdMob initialization can gate on a valid consent state.
import {
  AdsConsent,
  AdsConsentStatus,
  AdsConsentPrivacyOptionsRequirementStatus,
} from 'react-native-google-mobile-ads';
import { logEvent } from './analytics';

/**
 * Runs the UMP consent flow before AdMob is initialized.
 *
 * Calls `requestInfoUpdate` and, if a form is required, presents it. Returns
 * `canRequestAds` so the caller can decide whether to proceed with ad
 * initialization. On error we still return `canRequestAds: true` so the rest
 * of AdMob can boot — Google's SDK will fall back to non-personalized ads in
 * regulated regions when no valid TCString is available.
 */
export const ensureConsentFlow = async (): Promise<{ canRequestAds: boolean }> => {
  try {
    const info = await AdsConsent.gatherConsent();
    return { canRequestAds: info.canRequestAds };
  } catch (error: any) {
    logEvent('error', {
      category: 'ad',
      message: error?.message || 'UMP consent flow failed',
      context: 'ensureConsentFlow',
    });
    return { canRequestAds: true };
  }
};

/**
 * Whether the privacy options form must be reachable from Settings.
 * Per Google policy, EEA/UK/CH users need persistent access to revisit their
 * choice; for others the entry point should be hidden.
 */
export const isPrivacyOptionsRequired = async (): Promise<boolean> => {
  try {
    const info = await AdsConsent.getConsentInfo();
    return (
      info.privacyOptionsRequirementStatus ===
      AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
    );
  } catch (error: any) {
    logEvent('error', {
      category: 'ad',
      message: error?.message || 'UMP getConsentInfo failed',
      context: 'isPrivacyOptionsRequired',
    });
    return false;
  }
};

/**
 * Re-presents the privacy options form. Safe to call only when
 * `isPrivacyOptionsRequired()` returned true.
 */
export const showPrivacyOptionsForm = async (): Promise<void> => {
  try {
    await AdsConsent.showPrivacyOptionsForm();
  } catch (error: any) {
    logEvent('error', {
      category: 'ad',
      message: error?.message || 'UMP showPrivacyOptionsForm failed',
      context: 'showPrivacyOptionsForm',
    });
  }
};

export { AdsConsentStatus };
