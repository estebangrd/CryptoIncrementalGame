// LinearGradient mock
jest.mock('react-native-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ children, ...props }) => React.createElement(View, props, children);
});

// AsyncStorage mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Gesture Handler mock
require('react-native-gesture-handler/jestSetup');

// Safe Area Context mock
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: View,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// AdMob mock
jest.mock('react-native-google-mobile-ads', () => ({
  default: jest.fn(() => ({
    initialize: jest.fn(() => Promise.resolve()),
    setRequestConfiguration: jest.fn(() => Promise.resolve()),
  })),
  MobileAds: jest.fn(() => ({
    initialize: jest.fn(() => Promise.resolve()),
    setRequestConfiguration: jest.fn(() => Promise.resolve()),
  })),
  BannerAd: 'BannerAd',
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER', SMART_BANNER: 'SMART_BANNER' },
  RewardedAd: {
    createForAdRequest: jest.fn(() => ({
      load: jest.fn(),
      show: jest.fn(() => Promise.resolve()),
      addAdEventListener: jest.fn(),
      loaded: false,
    })),
  },
  InterstitialAd: {
    createForAdRequest: jest.fn(() => ({
      load: jest.fn(),
      show: jest.fn(() => Promise.resolve()),
      addAdEventListener: jest.fn(),
      loaded: false,
    })),
  },
  AdEventType: { LOADED: 'loaded', ERROR: 'error', CLOSED: 'closed' },
  RewardedAdEventType: { LOADED: 'loaded', EARNED_REWARD: 'rewarded' },
  TestIds: { BANNER: 'test-banner', REWARDED: 'test-rewarded', INTERSTITIAL: 'test-interstitial' },
  AdsConsent: {
    requestInfoUpdate: jest.fn(() => Promise.resolve({ status: 'NOT_REQUIRED', canRequestAds: true, isConsentFormAvailable: false, privacyOptionsRequirementStatus: 'NOT_REQUIRED' })),
    showForm: jest.fn(() => Promise.resolve({ status: 'NOT_REQUIRED', canRequestAds: true, isConsentFormAvailable: false, privacyOptionsRequirementStatus: 'NOT_REQUIRED' })),
    showPrivacyOptionsForm: jest.fn(() => Promise.resolve({ status: 'NOT_REQUIRED', canRequestAds: true, isConsentFormAvailable: false, privacyOptionsRequirementStatus: 'NOT_REQUIRED' })),
    loadAndShowConsentFormIfRequired: jest.fn(() => Promise.resolve({ status: 'NOT_REQUIRED', canRequestAds: true, isConsentFormAvailable: false, privacyOptionsRequirementStatus: 'NOT_REQUIRED' })),
    getConsentInfo: jest.fn(() => Promise.resolve({ status: 'NOT_REQUIRED', canRequestAds: true, isConsentFormAvailable: false, privacyOptionsRequirementStatus: 'NOT_REQUIRED' })),
    gatherConsent: jest.fn(() => Promise.resolve({ status: 'NOT_REQUIRED', canRequestAds: true, isConsentFormAvailable: false, privacyOptionsRequirementStatus: 'NOT_REQUIRED' })),
    reset: jest.fn(),
  },
  AdsConsentStatus: { UNKNOWN: 'UNKNOWN', REQUIRED: 'REQUIRED', NOT_REQUIRED: 'NOT_REQUIRED', OBTAINED: 'OBTAINED' },
  AdsConsentPrivacyOptionsRequirementStatus: { UNKNOWN: 'UNKNOWN', REQUIRED: 'REQUIRED', NOT_REQUIRED: 'NOT_REQUIRED' },
}));

// IAP mock
jest.mock('react-native-iap', () => ({
  initConnection: jest.fn(() => Promise.resolve(true)),
  endConnection: jest.fn(() => Promise.resolve()),
  getProducts: jest.fn(() => Promise.resolve([])),
  fetchProducts: jest.fn(() => Promise.resolve([])),
  requestPurchase: jest.fn(() => Promise.resolve()),
  getAvailablePurchases: jest.fn(() => Promise.resolve([])),
  purchaseUpdatedListener: jest.fn(() => ({ remove: jest.fn() })),
  purchaseErrorListener: jest.fn(() => ({ remove: jest.fn() })),
  finishTransaction: jest.fn(() => Promise.resolve()),
}));

// CryptoAPI mock (external fetch)
jest.mock('./src/services/cryptoAPI', () => ({
  fetchCryptoPrices: jest.fn(() => Promise.resolve([])),
  shouldUpdatePrices: jest.fn(() => false),
}));
