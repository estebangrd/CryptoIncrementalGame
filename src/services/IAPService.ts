// Servicio de In-App Purchases
// Patrón: funciones puras async, igual que cryptoAPI.ts
// Adaptado a react-native-iap@14 (API basada en Nitro modules)
import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  Purchase,
  Product,
} from 'react-native-iap';
import { IAP_PRODUCT_IDS, ALL_PRODUCT_IDS } from '../config/iapConfig';
import { PurchaseRecord } from '../types/game';

/**
 * Determina si un producto es consumible (puede comprarse múltiples veces).
 * Los boosters son consumibles; non-consumables y one-time packs no lo son.
 */
const isConsumableProduct = (productId: string): boolean => {
  return (
    productId === IAP_PRODUCT_IDS.BOOSTER_2X ||
    productId === IAP_PRODUCT_IDS.BOOSTER_5X
  );
};

/**
 * Determina si un producto es non-consumable permanente (REMOVE_ADS, PERMANENT_MULTIPLIER).
 */
export const isNonConsumableProduct = (productId: string): boolean => {
  return (
    productId === IAP_PRODUCT_IDS.REMOVE_ADS ||
    productId === IAP_PRODUCT_IDS.PERMANENT_MULTIPLIER
  );
};

/**
 * Determina si un producto es un starter pack.
 */
export const isStarterPack = (productId: string): boolean => {
  return (
    productId === IAP_PRODUCT_IDS.STARTER_SMALL ||
    productId === IAP_PRODUCT_IDS.STARTER_MEDIUM ||
    productId === IAP_PRODUCT_IDS.STARTER_LARGE ||
    productId === IAP_PRODUCT_IDS.STARTER_MEGA
  );
};

/**
 * Inicializa la conexión con la tienda (App Store / Google Play).
 * Debe llamarse una vez al arrancar la app antes de cualquier otra operación IAP.
 * @returns true si la conexión fue exitosa, false si falló.
 */
export const initializeIAP = async (): Promise<boolean> => {
  try {
    await initConnection();
    return true;
  } catch (error) {
    console.warn('[IAPService] Failed to initialize IAP connection:', error);
    return false;
  }
};

/**
 * Obtiene la lista de productos in-app disponibles en la tienda.
 * @returns Array de Product o [] si la llamada falla.
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const products = await fetchProducts({ skus: ALL_PRODUCT_IDS });
    return products as Product[];
  } catch (error) {
    console.warn('[IAPService] Failed to fetch products:', error);
    return [];
  }
};

/**
 * Inicia el flujo de compra nativo para el producto dado.
 * Lanza el error para que el caller pueda manejarlo (mostrar alerta, etc.).
 * @param productId - SKU del producto a comprar.
 */
export const purchaseProduct = async (productId: string): Promise<void> => {
  try {
    await requestPurchase({
      type: 'in-app',
      request: {
        apple: {
          sku: productId,
          andDangerouslyFinishTransactionAutomatically: false,
        },
        google: {
          skus: [productId],
        },
      },
    });
  } catch (error) {
    // Relanzar para que el caller lo maneje
    throw error;
  }
};

/**
 * Finaliza una transacción y construye el PurchaseRecord correspondiente.
 * @param purchase - Objeto de compra recibido del listener de react-native-iap.
 * @returns PurchaseRecord si la transacción se completó, null si falló.
 */
export const completePurchase = async (purchase: Purchase): Promise<PurchaseRecord | null> => {
  try {
    await finishTransaction({
      purchase,
      isConsumable: isConsumableProduct(purchase.productId),
    });

    const record: PurchaseRecord = {
      productId: purchase.productId,
      // transactionId es string en iOS pero string|null|undefined en Android
      transactionId: purchase.transactionId ?? '',
      purchaseDate: purchase.transactionDate ?? Date.now(),
      price: 0, // El precio real no está disponible en cliente
      currency: '',
      platform: Platform.OS as 'ios' | 'android',
      // purchaseToken sirve como recibo en v14 (reemplaza transactionReceipt)
      receipt: purchase.purchaseToken ?? '',
      validated: false,
      delivered: false,
    };

    return record;
  } catch (error) {
    console.warn('[IAPService] Failed to complete purchase:', error);
    return null;
  }
};

/**
 * Restaura las compras previas del usuario (non-consumables).
 * @returns Array de compras disponibles o [] si la llamada falla.
 */
export const restorePurchases = async (): Promise<Purchase[]> => {
  try {
    const purchases = await getAvailablePurchases();
    return purchases;
  } catch (error) {
    console.warn('[IAPService] Failed to restore purchases:', error);
    return [];
  }
};

/**
 * Cierra la conexión con la tienda.
 * Debe llamarse al desmontar el componente raíz o al apagar la app.
 */
export const terminateIAP = async (): Promise<void> => {
  try {
    await endConnection();
  } catch {
    // Silencioso — no hay acción recuperable aquí
  }
};
