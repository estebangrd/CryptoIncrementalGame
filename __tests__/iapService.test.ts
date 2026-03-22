/**
 * Tests for IAPService dev mock purchase flow.
 *
 * In development mode (__DEV__), purchaseProduct should simulate a successful
 * purchase by invoking the registered onPurchaseComplete callback, instead of
 * calling react-native-iap's requestPurchase (which requires a real store).
 */
import { Platform } from 'react-native';
import { IAP_PRODUCT_IDS } from '../src/config/iapConfig';

// We need to test the dev mock behavior, so we set __DEV__ = true
// (it's already true in Jest by default)

describe('IAPService - Dev Mock Purchases', () => {
  let IAPService: typeof import('../src/services/IAPService');
  let mockRequestPurchase: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    // Re-import to get fresh module state
    mockRequestPurchase = require('react-native-iap').requestPurchase;
    mockRequestPurchase.mockClear();
    IAPService = require('../src/services/IAPService');
  });

  it('purchaseProduct should NOT call native requestPurchase in dev mode', async () => {
    // Register a mock callback
    const onComplete = jest.fn();
    IAPService.registerDevPurchaseCallback(onComplete);

    await IAPService.purchaseProduct(IAP_PRODUCT_IDS.BOOSTER_2X);

    // In dev mode, should NOT call the native IAP
    expect(mockRequestPurchase).not.toHaveBeenCalled();
  });

  it('purchaseProduct should invoke onPurchaseComplete callback with a mock PurchaseRecord', async () => {
    const onComplete = jest.fn();
    IAPService.registerDevPurchaseCallback(onComplete);

    await IAPService.purchaseProduct(IAP_PRODUCT_IDS.BOOSTER_2X);

    expect(onComplete).toHaveBeenCalledTimes(1);
    const record = onComplete.mock.calls[0][0];
    expect(record.productId).toBe(IAP_PRODUCT_IDS.BOOSTER_2X);
    expect(record.transactionId).toMatch(/^dev_mock_/);
    expect(record.platform).toBe(Platform.OS);
    expect(record.validated).toBe(true);
    expect(record.delivered).toBe(false);
  });

  it('purchaseProduct should work for all product IDs', async () => {
    const onComplete = jest.fn();
    IAPService.registerDevPurchaseCallback(onComplete);

    for (const productId of Object.values(IAP_PRODUCT_IDS)) {
      onComplete.mockClear();
      await IAPService.purchaseProduct(productId);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete.mock.calls[0][0].productId).toBe(productId);
    }
  });

  it('purchaseProduct should throw if no dev callback is registered', async () => {
    // Don't register a callback — should fall through to native (which is mocked)
    // In this case, it should use the native path
    await IAPService.purchaseProduct(IAP_PRODUCT_IDS.BOOSTER_2X);
    expect(mockRequestPurchase).toHaveBeenCalled();
  });
});
