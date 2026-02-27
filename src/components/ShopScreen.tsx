import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useGame } from '../contexts/GameContext';

import { purchaseProduct } from '../services/IAPService';
import { IAP_PRODUCT_IDS, IAP_PRICES } from '../config/iapConfig';
import { BOOSTER_CONFIG, STARTER_PACK_REWARDS } from '../config/balanceConfig';

// ─── helpers ──────────────────────────────────────────────────────────────────

const formatTime = (ms: number): string => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

interface BadgeProps { label: string; color: string; }
const Badge: React.FC<BadgeProps> = ({ label, color }) => (
  <View style={[styles.badge, { backgroundColor: color }]}>
    <Text style={styles.badgeText}>{label}</Text>
  </View>
);

// ─── Main Component ──────────────────────────────────────────────────────────

type ShopTab = 'removeAds' | 'boosters' | 'packs';

const ShopScreen: React.FC = () => {
  const { gameState, dispatch, showToast } = useGame();
  const [activeTab, setActiveTab] = useState<ShopTab>('removeAds');
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const iapState = gameState.iapState;

  const doPurchase = useCallback(async (productId: string) => {
    if (iapState.isPurchasing || purchasing) return;
    try {
      setPurchasing(productId);
      dispatch({ type: 'SET_IAP_PURCHASING', payload: true });
      await purchaseProduct(productId);
      // Result handled via purchaseUpdatedListener in GameContext
    } catch (error: any) {
      if (error?.code !== 'E_USER_CANCELLED') {
        showToast(error?.message || 'Purchase failed', 'error');
      }
      dispatch({ type: 'SET_IAP_PURCHASING', payload: false });
    } finally {
      setPurchasing(null);
    }
  }, [iapState.isPurchasing, purchasing, dispatch, showToast]);

  const confirmPurchase = useCallback((productId: string) => {
    doPurchase(productId);
  }, [doPurchase]);

  // ── Remove Ads tab ───────────────────────────────────────────────────────

  const renderRemoveAds = () => {
    const purchased = iapState.removeAdsPurchased;
    return (
      <View style={styles.card}>
        <Text style={styles.cardIcon}>🚫</Text>
        <Text style={styles.cardTitle}>Remove Ads</Text>
        {purchased && <Badge label="Purchased ✓" color="#00ff88" />}
        <View style={styles.benefitBox}>
          <Text style={styles.benefitText}>✓ No more banner ads</Text>
          <Text style={styles.benefitText}>✓ No more interstitial ads</Text>
          <Text style={styles.benefitText}>✓ Rewarded ads still available</Text>
        </View>
        <Text style={styles.priceText}>${IAP_PRICES.REMOVE_ADS.toFixed(2)}</Text>
        <TouchableOpacity
          style={[styles.buyButton, purchased && styles.buyButtonDisabled]}
          onPress={() => !purchased && confirmPurchase(IAP_PRODUCT_IDS.REMOVE_ADS)}
          disabled={purchased || !!purchasing}
        >
          {purchasing === IAP_PRODUCT_IDS.REMOVE_ADS
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buyButtonText}>{purchased ? 'Purchased' : `Buy $${IAP_PRICES.REMOVE_ADS.toFixed(2)}`}</Text>
          }
        </TouchableOpacity>
      </View>
    );
  };

  // ── Boosters tab ─────────────────────────────────────────────────────────

  const renderBoosters = () => {
    const now = Date.now();
    const b2x = iapState.booster2x;
    const b5x = iapState.booster5x;
    const perm = iapState.permanentMultiplierPurchased;

    const b2xRemaining = b2x.isActive && b2x.expiresAt ? Math.max(0, b2x.expiresAt - now) : 0;
    const b5xRemaining = b5x.isActive && b5x.expiresAt ? Math.max(0, b5x.expiresAt - now) : 0;

    return (
      <ScrollView>
        {/* 2x Booster */}
        <View style={[styles.card, { borderColor: '#FFD700' }]}>
          <Text style={styles.cardIcon}>⚡</Text>
          <Text style={styles.cardTitle}>2x Production Booster</Text>
          {b2x.isActive && b2xRemaining > 0 && <Badge label={`Active — ${formatTime(b2xRemaining)}`} color="#FFD700" />}
          <View style={styles.benefitBox}>
            <Text style={styles.benefitText}>⚡ 2x production for {BOOSTER_CONFIG.BOOSTER_2X.durationMs / 3600000}h</Text>
            <Text style={styles.benefitText}>✓ Stacks with prestige & ad boost</Text>
            <Text style={styles.benefitText}>✓ Can be purchased multiple times</Text>
          </View>
          <Text style={styles.priceText}>${IAP_PRICES.BOOSTER_2X.toFixed(2)}</Text>
          <TouchableOpacity
            style={[styles.buyButton, styles.buyButtonGold, !!purchasing && styles.buyButtonDisabled]}
            onPress={() => confirmPurchase(IAP_PRODUCT_IDS.BOOSTER_2X)}
            disabled={!!purchasing}
          >
            {purchasing === IAP_PRODUCT_IDS.BOOSTER_2X
              ? <ActivityIndicator color="#000" />
              : <Text style={[styles.buyButtonText, { color: '#000' }]}>{`Buy $${IAP_PRICES.BOOSTER_2X.toFixed(2)}`}</Text>
            }
          </TouchableOpacity>
        </View>

        {/* 5x Booster */}
        <View style={[styles.card, { borderColor: '#a855f7' }]}>
          <Text style={styles.cardIcon}>🚀</Text>
          <Text style={styles.cardTitle}>5x Production Booster</Text>
          {b5x.isActive && b5xRemaining > 0 && <Badge label={`Active — ${formatTime(b5xRemaining)}`} color="#a855f7" />}
          <View style={styles.benefitBox}>
            <Text style={styles.benefitText}>🚀 5x production for {BOOSTER_CONFIG.BOOSTER_5X.durationMs / 3600000}h</Text>
            <Text style={styles.benefitText}>✓ Stacks with prestige & ad boost</Text>
            <Text style={styles.benefitText}>✓ Can be purchased multiple times</Text>
          </View>
          <Text style={styles.priceText}>${IAP_PRICES.BOOSTER_5X.toFixed(2)}</Text>
          <TouchableOpacity
            style={[styles.buyButton, styles.buyButtonPurple, !!purchasing && styles.buyButtonDisabled]}
            onPress={() => confirmPurchase(IAP_PRODUCT_IDS.BOOSTER_5X)}
            disabled={!!purchasing}
          >
            {purchasing === IAP_PRODUCT_IDS.BOOSTER_5X
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buyButtonText}>{`Buy $${IAP_PRICES.BOOSTER_5X.toFixed(2)}`}</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Permanent 2x */}
        <View style={[styles.card, { borderColor: '#00ff88' }]}>
          <Text style={styles.cardIcon}>♾️</Text>
          <Text style={styles.cardTitle}>Permanent 2x Multiplier</Text>
          {perm && <Badge label="Purchased ✓" color="#00ff88" />}
          <View style={styles.benefitBox}>
            <Text style={styles.benefitText}>♾️ PERMANENTLY double production</Text>
            <Text style={styles.benefitText}>✓ Stacks with ALL other multipliers</Text>
            <Text style={styles.benefitText}>✓ Survives prestige resets</Text>
          </View>
          <Text style={styles.priceText}>${IAP_PRICES.PERMANENT_MULTIPLIER.toFixed(2)}</Text>
          <TouchableOpacity
            style={[styles.buyButton, perm && styles.buyButtonDisabled]}
            onPress={() => !perm && confirmPurchase(IAP_PRODUCT_IDS.PERMANENT_MULTIPLIER)}
            disabled={perm || !!purchasing}
          >
            {purchasing === IAP_PRODUCT_IDS.PERMANENT_MULTIPLIER
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buyButtonText}>{perm ? 'Purchased' : `Buy $${IAP_PRICES.PERMANENT_MULTIPLIER.toFixed(2)}`}</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // ── Starter Packs tab ────────────────────────────────────────────────────

  type PackKey = 'small' | 'medium' | 'large' | 'mega';

  const packs: Array<{
    key: PackKey;
    productId: string;
    icon: string;
    title: string;
    badge?: string;
    price: number;
  }> = [
    { key: 'small',  productId: IAP_PRODUCT_IDS.STARTER_SMALL,  icon: '💼', title: 'Small Pack',  price: IAP_PRICES.STARTER_SMALL },
    { key: 'medium', productId: IAP_PRODUCT_IDS.STARTER_MEDIUM, icon: '📦', title: 'Medium Pack', price: IAP_PRICES.STARTER_MEDIUM, badge: 'Most Popular' },
    { key: 'large',  productId: IAP_PRODUCT_IDS.STARTER_LARGE,  icon: '🏆', title: 'Large Pack',  price: IAP_PRICES.STARTER_LARGE },
    { key: 'mega',   productId: IAP_PRODUCT_IDS.STARTER_MEGA,   icon: '💎', title: 'Mega Pack',   price: IAP_PRICES.STARTER_MEGA, badge: 'Best Value' },
  ];

  const renderPacks = () => (
    <View style={styles.packsGrid}>
      {packs.map((pack) => {
        const owned = iapState.starterPacksPurchased[pack.key];
        const rewards = STARTER_PACK_REWARDS[pack.key];
        return (
          <View key={pack.key} style={styles.packCard}>
            <Text style={styles.packIcon}>{pack.icon}</Text>
            <Text style={styles.packTitle}>{pack.title}</Text>
            {pack.badge && !owned && <Badge label={pack.badge} color="#FFD700" />}
            {owned && <Badge label="Owned ✓" color="#555" />}
            <View style={styles.packRewards}>
              <Text style={styles.packRewardText}>🪙 {(rewards.cryptoCoins / 1000).toFixed(0)}K CC</Text>
              <Text style={styles.packRewardText}>💵 ${rewards.realMoney.toLocaleString()}</Text>
            </View>
            <Text style={styles.packPrice}>${pack.price.toFixed(2)}</Text>
            <TouchableOpacity
              style={[styles.packBuyButton, owned && styles.buyButtonDisabled]}
              onPress={() => !owned && confirmPurchase(pack.productId)}
              disabled={owned || !!purchasing}
            >
              {purchasing === pack.productId
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.packBuyButtonText}>{owned ? 'Owned' : `Buy $${pack.price.toFixed(2)}`}</Text>
              }
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

  // ── Tabs & render ─────────────────────────────────────────────────────────

  const tabs: Array<{ id: ShopTab; label: string }> = [
    { id: 'removeAds', label: '🚫 No Ads' },
    { id: 'boosters',  label: '⚡ Boosters' },
    { id: 'packs',     label: '📦 Packs' },
  ];

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab.id && styles.tabBtnTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'removeAds' && renderRemoveAds()}
        {activeTab === 'boosters' && renderBoosters()}
        {activeTab === 'packs' && renderPacks()}
      </ScrollView>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#00ff88' },
  tabBtnText: { fontSize: 12, color: '#666' },
  tabBtnTextActive: { color: '#00ff88', fontWeight: 'bold' },

  content: { flex: 1 },
  contentContainer: { padding: 16 },

  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  cardIcon: { fontSize: 40, marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#000' },

  benefitBox: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 10, width: '100%', marginBottom: 12 },
  benefitText: { fontSize: 13, color: '#aaa', marginBottom: 2 },

  priceText: { fontSize: 24, fontWeight: 'bold', color: '#FFD700', marginBottom: 12 },

  buyButton: {
    backgroundColor: '#00aa55',
    borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24,
    width: '100%', alignItems: 'center',
  },
  buyButtonGold: { backgroundColor: '#FFD700' },
  buyButtonPurple: { backgroundColor: '#a855f7' },
  buyButtonDisabled: { backgroundColor: '#444' },
  buyButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  packsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  packCard: {
    width: '48%', backgroundColor: '#2a2a2a', borderRadius: 12,
    padding: 12, marginBottom: 12, alignItems: 'center',
    borderWidth: 1, borderColor: '#333',
  },
  packIcon: { fontSize: 32, marginBottom: 4 },
  packTitle: { fontSize: 14, fontWeight: 'bold', color: '#fff', marginBottom: 6, textAlign: 'center' },
  packRewards: { backgroundColor: '#1a1a1a', borderRadius: 6, padding: 6, width: '100%', marginBottom: 6 },
  packRewardText: { fontSize: 12, color: '#aaa', textAlign: 'center' },
  packPrice: { fontSize: 16, fontWeight: 'bold', color: '#FFD700', marginBottom: 8 },
  packBuyButton: {
    backgroundColor: '#00aa55', borderRadius: 6, paddingVertical: 8,
    width: '100%', alignItems: 'center',
  },
  packBuyButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});

export default ShopScreen;
