import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { useGame, pendingBoosterMetaRef } from '../contexts/GameContext';
import { purchaseProduct } from '../services/IAPService';
import { IAP_PRODUCT_IDS, IAP_PRICES } from '../config/iapConfig';
import { BOOSTER_CONFIG, PACK_CONFIG } from '../config/balanceConfig';
import { colors, fonts } from '../config/theme';
import { computeHasActiveSale, shouldRollFlashSale } from '../utils/flashSaleLogic';

// ── Animated background ───────────────────────────────────────────────────────

const { width: SHOP_W, height: SHOP_H } = Dimensions.get('window');
const SHOP_GRID = 40;
const SHOP_H_LINES = Math.ceil(SHOP_H / SHOP_GRID) + 2;
const SHOP_V_LINES = Math.ceil(SHOP_W / SHOP_GRID) + 1;

const ShopGrid: React.FC = () => {
  const shift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shift, { toValue: SHOP_GRID, duration: 20000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [shift]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: shift }] }]} pointerEvents="none">
      {Array.from({ length: SHOP_H_LINES }, (_, i) => (
        <View key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: i * SHOP_GRID, height: 1, backgroundColor: 'rgba(0,255,136,0.025)' }} />
      ))}
      {Array.from({ length: SHOP_V_LINES }, (_, i) => (
        <View key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: i * SHOP_GRID, width: 1, backgroundColor: 'rgba(0,255,136,0.025)' }} />
      ))}
    </Animated.View>
  );
};

const ShopScanline: React.FC = () => {
  const scan = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(scan, { toValue: SHOP_H, duration: 7000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [scan]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,255,136,0.05)', transform: [{ translateY: scan }] }} />
  );
};

const SHOP_PARTICLES = [
  { left: '15%', duration: 10000, delay: 0, color: colors.ng },
  { left: '40%', duration: 14000, delay: 3000, color: colors.nc },
  { left: '65%', duration: 11000, delay: 6000, color: colors.ng },
  { left: '85%', duration: 13000, delay: 2000, color: colors.nc },
];

const ShopParticle: React.FC<{ left: string; duration: number; delay: number; color: string }> = ({ left, duration, delay, color }) => {
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = () => {
      float.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(float, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) run(); });
    };
    run();
    return () => float.stopAnimation();
  }, [float, delay, duration]);
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [SHOP_H, -20] });
  const opacity = float.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.4, 0.2, 0] });
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', left: left as any, width: 3, height: 3, borderRadius: 1.5, backgroundColor: color, transform: [{ translateY }], opacity }} />
  );
};

// ── helpers ──────────────────────────────────────────────────────────────────

const formatTime = (ms: number): string => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ── Pack metadata (static) ────────────────────────────────────────────────────

type PackKey = 'small' | 'medium' | 'large' | 'mega';

interface PackContent {
  emoji: string;
  val: string;
  lbl: string;
  color: string;
}

interface PackMeta {
  key: PackKey;
  productId: string;
  name: string;
  eyebrowKey: string;
  wasPrice: number;
  price: number;
  unlockNoteKey: string;
}

const PK_META: PackMeta[] = [
  { key: 'small',  productId: IAP_PRODUCT_IDS.STARTER_SMALL,  name: 'Starter Pack',   eyebrowKey: 'shop.packs.small.eyebrow',  wasPrice: 1.99,  price: IAP_PRICES.STARTER_SMALL,  unlockNoteKey: 'shop.packs.small.unlockNote' },
  { key: 'medium', productId: IAP_PRODUCT_IDS.STARTER_MEDIUM, name: 'Growth Pack',    eyebrowKey: 'shop.packs.medium.eyebrow', wasPrice: 4.99,  price: IAP_PRICES.STARTER_MEDIUM, unlockNoteKey: 'shop.packs.medium.unlockNote' },
  { key: 'large',  productId: IAP_PRODUCT_IDS.STARTER_LARGE,  name: 'Mining Empire',  eyebrowKey: 'shop.packs.large.eyebrow',  wasPrice: 7.99,  price: IAP_PRICES.STARTER_LARGE,  unlockNoteKey: 'shop.packs.large.unlockNote' },
  { key: 'mega',   productId: IAP_PRODUCT_IDS.STARTER_MEGA,   name: 'Crypto Titan',   eyebrowKey: 'shop.packs.mega.eyebrow',   wasPrice: 14.99, price: IAP_PRICES.STARTER_MEGA,   unlockNoteKey: 'shop.packs.mega.unlockNote' },
];

// ── Main Component ────────────────────────────────────────────────────────────

type ShopTab = 'removeAds' | 'boosters' | 'packs';

const ShopScreen: React.FC = () => {
  const { gameState, dispatch, showToast, t } = useGame();
  const [activeTab, setActiveTab] = useState<ShopTab>('removeAds');
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const iapState = gameState.iapState;

  // Pre-roll extended offers for offline miner and market pump (decided when tab opens)
  const [offlineMinerExtended, setOfflineMinerExtended] = useState(() => Math.random() < BOOSTER_CONFIG.OFFLINE_MINER.extendedOfferChance);
  const [marketPumpExtended, setMarketPumpExtended] = useState(() => Math.random() < BOOSTER_CONFIG.MARKET_PUMP.extendedOfferChance);

  // TEMP: demo toggle for No Ads tab (remove before ship)
  const [demoForcePromo, setDemoForcePromo] = useState<boolean>(false);

  // Re-roll when boosters tab becomes active (fresh offer each visit)
  useEffect(() => {
    if (activeTab !== 'boosters') return;
    setOfflineMinerExtended(Math.random() < BOOSTER_CONFIG.OFFLINE_MINER.extendedOfferChance);
    setMarketPumpExtended(Math.random() < BOOSTER_CONFIG.MARKET_PUMP.extendedOfferChance);
  }, [activeTab]);

  // ── No Ads: flash sale logic ─────────────────────────────────────────────────
  const [flashTimerDisplay, setFlashTimerDisplay] = useState<string>('');
  const [flashTimerColor, setFlashTimerColor] = useState<string>(colors.ny);
  const flashTimerPulse = useRef(new Animated.Value(1)).current;
  const stepGlowAnim = useRef(new Animated.Value(0)).current;
  const noAdsBtnShimmerAnim = useRef(new Animated.Value(-300)).current;
  const noAdsBtnScaleAnim = useRef(new Animated.Value(1)).current;

  const hasActiveSale = computeHasActiveSale({
    flashSaleExpiresAt: iapState.flashSaleExpiresAt,
    removeAdsPurchased: iapState.removeAdsPurchased,
  });

  // Ref that always holds the latest iapState so the roll effect can read it
  // without subscribing to every flash-sale field change.
  const iapStateRef = useRef(iapState);
  iapStateRef.current = iapState;

  // Roll sale ONLY when the removeAds tab becomes active — not on every state change.
  // Reading iapState via ref avoids re-triggering when flashSaleExpiresAt or
  // flashSaleCooldownUntil change (e.g. after LOAD_GAME or after a sale expires),
  // which was causing unintended re-rolls and made the discounted offer appear too often.
  useEffect(() => {
    if (activeTab !== 'removeAds') return;
    const now = Date.now();
    const snap = iapStateRef.current;
    if (shouldRollFlashSale({
      removeAdsPurchased: snap.removeAdsPurchased,
      flashSaleExpiresAt: snap.flashSaleExpiresAt,
      flashSaleCooldownUntil: snap.flashSaleCooldownUntil,
      now,
    }) && Math.random() < 0.35) {
      const durationMs = (8 + Math.floor(Math.random() * 7)) * 60 * 1000; // 8–14 minutes
      dispatch({ type: 'SET_FLASH_SALE', payload: { expiresAt: now + durationMs, cooldownUntil: 0 } });
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown tick
  useEffect(() => {
    if (iapState.removeAdsPurchased || iapState.flashSaleExpiresAt === 0) return;
    const update = () => {
      const now = Date.now();
      const remaining = Math.max(0, iapState.flashSaleExpiresAt - now);
      if (remaining === 0) {
        dispatch({
          type: 'SET_FLASH_SALE',
          payload: { expiresAt: 0, cooldownUntil: now + 24 * 60 * 60 * 1000 },
        });
        return;
      }
      const totalSec = Math.ceil(remaining / 1000);
      const mm = Math.floor(totalSec / 60).toString().padStart(2, '0');
      const ss = (totalSec % 60).toString().padStart(2, '0');
      setFlashTimerDisplay(`${mm}:${ss}`);
      setFlashTimerColor(remaining < 60000 ? colors.nr : colors.ny);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [iapState.removeAdsPurchased, iapState.flashSaleExpiresAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer pulse animation (mirrors CSS tpulse)
  useEffect(() => {
    if (!hasActiveSale) {
      flashTimerPulse.stopAnimation();
      flashTimerPulse.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(flashTimerPulse, { toValue: 0.5, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(flashTimerPulse, { toValue: 1.0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [hasActiveSale, flashTimerPulse]);

  // Active step glow pulse (matches spec stepGlow animation)
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(stepGlowAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(stepGlowAnim, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [stepGlowAnim]);

  // No Ads buy button shimmer loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(noAdsBtnShimmerAnim, { toValue: -300, duration: 0, useNativeDriver: true }),
        Animated.timing(noAdsBtnShimmerAnim, { toValue: 500, duration: 3000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [noAdsBtnShimmerAnim]);

  // ── Packs: offer roll when packs tab becomes active ──────────────────────
  useEffect(() => {
    if (activeTab !== 'packs') return;
    const now = Date.now();

    // Determine currently eligible pack
    const ownedCount = (id: string) => gameState.hardware.find(h => h.id === id)?.owned ?? 0;
    const purchased = iapState.starterPacksPurchased;
    let eligibleKey: PackKey | null = null;
    if (!purchased.small && ownedCount('asic_gen3') === 0) eligibleKey = 'small';
    else if (!purchased.medium && ownedCount('asic_gen3') >= 1 && ownedCount('quantum_miner') === 0) eligibleKey = 'medium';
    else if (!purchased.large && ownedCount('quantum_miner') >= 1 && ownedCount('supercomputer') === 0) eligibleKey = 'large';
    else if (!purchased.mega && ownedCount('supercomputer') >= 1) eligibleKey = 'mega';

    if (!eligibleKey) return; // no eligible pack at this stage

    const hasActiveOffer = iapState.packOfferExpiresAt > 0 && now < iapState.packOfferExpiresAt;
    const inCooldown = iapState.packNextOfferAt > 0 && now < iapState.packNextOfferAt;

    if (hasActiveOffer || inCooldown) return; // already has offer or waiting

    // Roll new offer
    const cfg = PACK_CONFIG[eligibleKey];
    const randInRange = (range: readonly [number, number]) =>
      Math.round(range[0] + Math.random() * (range[1] - range[0]));

    const cc = randInRange(cfg.ccRange);
    const cash = randInRange(cfg.cashRange);
    const hasNonRenewableEnergyNow = Object.values(gameState.energy?.sources ?? {})
      .some(s => !s.isRenewable && s.quantity > 0);
    const electricityHours = 'electricityHoursRange' in cfg && hasNonRenewableEnergyNow
      ? randInRange(cfg.electricityHoursRange as [number, number])
      : 0;

    dispatch({
      type: 'SET_PACK_OFFER',
      payload: {
        expiresAt: now + PACK_CONFIG.OFFER_DURATION_MS,
        nextOfferAt: 0,
        cc,
        cash,
        electricityHours,
      },
    });
  }, [activeTab, iapState.starterPacksPurchased, iapState.packOfferExpiresAt, iapState.packNextOfferAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Packs: real offer countdown using persisted timestamp ─────────────────
  const [pkTimerDisplay, setPkTimerDisplay] = useState<string>('');
  const [pkTimerExpired, setPkTimerExpired] = useState<boolean>(false);

  useEffect(() => {
    if (iapState.packOfferExpiresAt === 0) {
      setPkTimerExpired(true);
      return;
    }
    const update = () => {
      const now = Date.now();
      const remaining = Math.max(0, iapState.packOfferExpiresAt - now);
      if (remaining === 0) {
        setPkTimerExpired(true);
        // Set cooldown
        dispatch({
          type: 'SET_PACK_OFFER',
          payload: { expiresAt: 0, nextOfferAt: now + PACK_CONFIG.COOLDOWN_MS, cc: 0, cash: 0, electricityHours: 0 },
        });
        return;
      }
      setPkTimerExpired(false);
      const totalSec = Math.ceil(remaining / 1000);
      const mm = Math.floor(totalSec / 60).toString().padStart(2, '0');
      const ss = (totalSec % 60).toString().padStart(2, '0');
      setPkTimerDisplay(`${mm}:${ss}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [iapState.packOfferExpiresAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Packs: tick to refresh next offer countdown ───────────────────────────
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    if (iapState.packNextOfferAt === 0 || Date.now() >= iapState.packNextOfferAt) return;
    const id = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [iapState.packNextOfferAt]);

  // ── Packs: animations ─────────────────────────────────────────────────────
  const pkBadgePulse = useRef(new Animated.Value(1)).current;
  const pkTimerOpacity = useRef(new Animated.Value(1)).current;
  const pkBuyShimmerAnim = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pkBadgePulse, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pkBadgePulse, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pkTimerOpacity, { toValue: 0.5, duration: 900, useNativeDriver: true }),
        Animated.timing(pkTimerOpacity, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pkBuyShimmerAnim, { toValue: -200, duration: 0, useNativeDriver: true }),
        Animated.timing(pkBuyShimmerAnim, { toValue: 300, duration: 3000, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, [pkBadgePulse, pkTimerOpacity, pkBuyShimmerAnim]);

  // ── Purchase logic ────────────────────────────────────────────────────────
  const doPurchase = useCallback(async (productId: string) => {
    if (iapState.isPurchasing || purchasing) return;
    try {
      setPurchasing(productId);
      dispatch({ type: 'SET_IAP_PURCHASING', payload: true });
      await purchaseProduct(productId);
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

  // ── Lucky Block block count ───────────────────────────────────────────────
  const getLuckyBlockCount = (): number => {
    const hashRate = gameState.totalHashRate ?? 0;
    if (hashRate < BOOSTER_CONFIG.LUCKY_BLOCK.earlyHashThreshold) return BOOSTER_CONFIG.LUCKY_BLOCK.earlyBlocks;
    if (hashRate < BOOSTER_CONFIG.LUCKY_BLOCK.lateHashThreshold) return BOOSTER_CONFIG.LUCKY_BLOCK.midBlocks;
    return BOOSTER_CONFIG.LUCKY_BLOCK.lateBlocks;
  };

  // ── New booster purchase handlers ─────────────────────────────────────────
  const purchaseOfflineMiner = useCallback(() => {
    const durationMs = offlineMinerExtended
      ? BOOSTER_CONFIG.OFFLINE_MINER.extendedDurationMs
      : BOOSTER_CONFIG.OFFLINE_MINER.baseDurationMs;
    pendingBoosterMetaRef.current = { ...pendingBoosterMetaRef.current, offlineMinerDurationMs: durationMs };
    doPurchase(IAP_PRODUCT_IDS.OFFLINE_MINER);
  }, [offlineMinerExtended, doPurchase]);

  const purchaseLuckyBlock = useCallback(() => {
    doPurchase(IAP_PRODUCT_IDS.LUCKY_BLOCK);
  }, [doPurchase]);

  const purchaseMarketPump = useCallback(() => {
    const durationMs = marketPumpExtended
      ? BOOSTER_CONFIG.MARKET_PUMP.extendedDurationMs
      : BOOSTER_CONFIG.MARKET_PUMP.baseDurationMs;
    pendingBoosterMetaRef.current = { ...pendingBoosterMetaRef.current, marketPumpDurationMs: durationMs };
    doPurchase(IAP_PRODUCT_IDS.MARKET_PUMP);
  }, [marketPumpExtended, doPurchase]);

  // ══════════════════════════════════════════════════════════════════════════
  // NO ADS TAB
  // ══════════════════════════════════════════════════════════════════════════

  const renderNoAds = () => {
    const purchased = iapState.removeAdsPurchased;
    const purchaseCount = iapState.purchaseHistory.length;

    const getStepState = (stepNumber: number): 'done' | 'active' | 'locked' => {
      if (purchaseCount >= stepNumber) return 'done';
      if (purchaseCount === stepNumber - 1) return 'active';
      return 'locked';
    };

    const step1 = getStepState(1);
    const step2 = getStepState(2);
    const step3 = getStepState(3);

    const stepContainerStyle = (s: 'done' | 'active' | 'locked') => {
      if (s === 'done') return [st.na_step, st.na_stepDone];
      if (s === 'active') return [st.na_step, st.na_stepActive];
      return [st.na_step];
    };

    const stepPctColor = (s: 'done' | 'active' | 'locked'): string => {
      if (s === 'done') return colors.ng;
      if (s === 'active') return colors.ny;
      return 'rgba(255,255,255,0.18)';
    };

    const effectiveSale = demoForcePromo;

    const getUnlockNoteParts = () => {
      if (purchaseCount === 0) return { pre: t('shop.noAds.unlockNote.pre0'), pct: t('shop.noAds.unlockNote.pct50'), post: t('shop.noAds.unlockNote.post') };
      if (purchaseCount === 1) return { pre: t('shop.noAds.unlockNote.preNext'), pct: t('shop.noAds.unlockNote.pct75'), post: t('shop.noAds.unlockNote.post') };
      return { pre: t('shop.noAds.unlockNote.preNext'), pct: t('shop.noAds.unlockNote.pct100'), post: t('shop.noAds.unlockNote.post') };
    };
    const noteParts = getUnlockNoteParts();

    return (
      <View>
        {/* === TEMP DEBUG TOGGLE (remove before ship) === */}
        <View style={st.na_demoToggle}>
          <View style={[st.na_demoToggleBtnOuter, !demoForcePromo && st.na_demoToggleBtnOuterActive]}>
            <TouchableOpacity
              style={[st.na_demoToggleBtnInner, !demoForcePromo && st.na_demoToggleBtnInnerActive]}
              onPress={() => setDemoForcePromo(false)}
              activeOpacity={0.8}
            >
              <Text style={[st.na_demoToggleBtnText, !demoForcePromo && st.na_demoToggleBtnTextActive]}>
                Sin promo activa
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[st.na_demoToggleBtnOuter, demoForcePromo && st.na_demoToggleBtnOuterActive]}>
            <TouchableOpacity
              style={[st.na_demoToggleBtnInner, demoForcePromo && st.na_demoToggleBtnInnerActive]}
              onPress={() => setDemoForcePromo(true)}
              activeOpacity={0.8}
            >
              <Text style={[st.na_demoToggleBtnText, demoForcePromo && st.na_demoToggleBtnTextActive]}>
                Con oferta flash
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero card */}
        <LinearGradient
          colors={['rgba(255,61,90,0.07)', 'rgba(255,61,90,0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={st.na_hero}
        >
          <LinearGradient
            colors={['#ff3d5a', '#ff8c42']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={st.na_heroAccent}
          />
          <Text style={st.na_bigIcon}>🚫</Text>
          <Text style={st.na_heroTitle}>{t('shop.noAds.title')}</Text>

          <View style={st.na_perks}>
            <View style={st.na_perk}>
              <View style={st.na_perkX}><Text style={st.na_perkXText}>✕</Text></View>
              <Text style={st.na_perkText}>{t('shop.noAds.perk.noBanners')}</Text>
            </View>
            <View style={st.na_perk}>
              <View style={st.na_perkX}><Text style={st.na_perkXText}>✕</Text></View>
              <Text style={st.na_perkText}>{t('shop.noAds.perk.noInterstitials')}</Text>
            </View>
            <View style={st.na_perk}>
              <View style={st.na_perkCheck}><Text style={st.na_perkCheckText}>✓</Text></View>
              <Text style={st.na_perkText}>{t('shop.noAds.perk.rewardedAvailable')}</Text>
            </View>
            <View style={st.na_perk}>
              <View style={st.na_perkCheck}><Text style={st.na_perkCheckText}>✓</Text></View>
              <Text style={st.na_perkText}>{t('shop.noAds.perk.permanent')}</Text>
            </View>
          </View>

          {purchased ? (
            <View style={st.na_ownedBanner}>
              <Text style={st.na_ownedText}>{t('shop.noAds.owned')}</Text>
            </View>
          ) : (
            <>
              {!effectiveSale ? (
                /* Normal state: neutral price box */
                <View style={st.na_priceBox}>
                  <Text style={st.na_priceBoxLabel}>PRECIO</Text>
                  <Text style={st.na_priceBoxValue}>$2.99</Text>
                </View>
              ) : (
                /* Sale state: yellow banner with centered stacked prices */
                <View style={st.na_promoBanner}>
                  <View style={st.na_promoTop}>
                    <View style={st.na_promoLeft}>
                      <Text style={st.na_promoIcon}>⚡</Text>
                      <Text style={st.na_promoLabel}>{t('shop.noAds.flashSale')}</Text>
                    </View>
                    <View style={st.na_promoRight}>
                      <Text style={st.na_promoExpiresLabel}>{t('shop.noAds.expiresIn')}</Text>
                      <Animated.Text style={[st.na_promoTimer, { color: flashTimerColor, opacity: flashTimerPulse }]}>
                        {hasActiveSale && flashTimerDisplay ? flashTimerDisplay : '08:30'}
                      </Animated.Text>
                    </View>
                  </View>
                  <View style={st.na_priceCentered}>
                    <Text style={st.na_priceNormal}>$2.99</Text>
                    <View style={st.na_priceNowWrap}>
                      <View style={st.na_glowOuter}  pointerEvents="none" />
                      <View style={st.na_glowMid}    pointerEvents="none" />
                      <View style={st.na_glowInner}  pointerEvents="none" />
                      <View style={st.na_glowCore}   pointerEvents="none" />
                      <Text style={st.na_priceNow}>{`$${IAP_PRICES.REMOVE_ADS.toFixed(2)}`}</Text>
                    </View>
                  </View>
                </View>
              )}
              <Animated.View style={[{ width: '100%' }, { transform: [{ scale: noAdsBtnScaleAnim }] }]}>
                <TouchableOpacity
                  style={effectiveSale ? st.na_buyBtnOuter : st.na_buyBtnNormalOuter}
                  onPress={() => {
                    Animated.sequence([
                      Animated.timing(noAdsBtnScaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
                      Animated.timing(noAdsBtnScaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
                    ]).start();
                    confirmPurchase(IAP_PRODUCT_IDS.REMOVE_ADS);
                  }}
                  disabled={!!purchasing}
                  activeOpacity={0.85}
                >
                  <Animated.View
                    pointerEvents="none"
                    style={[st.na_shimmer, { transform: [{ translateX: noAdsBtnShimmerAnim }] }]}
                  >
                    <Svg width={300} height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
                      <Defs>
                        <SvgLinearGradient id="naShimmer" x1="0" y1="0" x2="1" y2="1">
                          <Stop offset="0%" stopColor={effectiveSale ? colors.ny : colors.nr} stopOpacity="0" />
                          <Stop offset="40%" stopColor={effectiveSale ? colors.ny : colors.nr} stopOpacity="0.12" />
                          <Stop offset="60%" stopColor={effectiveSale ? colors.ny : colors.nr} stopOpacity="0.12" />
                          <Stop offset="100%" stopColor={effectiveSale ? colors.ny : colors.nr} stopOpacity="0" />
                        </SvgLinearGradient>
                      </Defs>
                      <Rect x="0" y="0" width="300" height="100%" fill="url(#naShimmer)" />
                    </Svg>
                  </Animated.View>
                  {purchasing === IAP_PRODUCT_IDS.REMOVE_ADS ? (
                    <ActivityIndicator color={effectiveSale ? colors.ny : colors.nr} />
                  ) : (
                    <Text style={effectiveSale ? st.na_buyBtnText : st.na_buyBtnNormalText}>
                      {effectiveSale ? t('shop.noAds.buyBtn') : t('shop.noAds.buyBtnNormal')}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </LinearGradient>

        <View style={st.na_divider} />

        <View style={st.na_secHdrRow}>
          <Text style={st.na_secHdr}>{t('shop.noAds.unlockHeader')}</Text>
          <View style={st.na_secHdrLine} />
        </View>

        <View style={st.na_unlockCard}>
          <Text style={st.na_unlockTitle}>{t('shop.noAds.unlockTitle')}</Text>
          <View style={st.na_stepsRow}>
            <View style={stepContainerStyle(step1)}>
              {step1 === 'active' && (
                <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,214,0,0.6)', opacity: stepGlowAnim }]} />
              )}
              {step1 === 'done' && (
                <View style={st.na_stepCheck}><Text style={st.na_stepCheckText}>✓</Text></View>
              )}
              <Text style={st.na_stepBuy}>{t('shop.noAds.purchase1st')}</Text>
              <Text style={[st.na_stepPct, { color: stepPctColor(step1) }]}>50%</Text>
              <Text style={st.na_stepLabel}>{t('shop.noAds.chance')}</Text>
            </View>
            <View style={stepContainerStyle(step2)}>
              {step2 === 'active' && (
                <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,214,0,0.6)', opacity: stepGlowAnim }]} />
              )}
              {step2 === 'done' && (
                <View style={st.na_stepCheck}><Text style={st.na_stepCheckText}>✓</Text></View>
              )}
              <Text style={st.na_stepBuy}>{t('shop.noAds.purchase2nd')}</Text>
              <Text style={[st.na_stepPct, { color: stepPctColor(step2) }]}>75%</Text>
              <Text style={st.na_stepLabel}>{t('shop.noAds.chance')}</Text>
            </View>
            <View style={stepContainerStyle(step3)}>
              {step3 === 'active' && (
                <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,214,0,0.6)', opacity: stepGlowAnim }]} />
              )}
              {step3 === 'done' && (
                <View style={st.na_stepCheck}><Text style={st.na_stepCheckText}>✓</Text></View>
              )}
              <Text style={st.na_stepBuy}>{t('shop.noAds.purchase3rd')}</Text>
              <Text style={[st.na_stepPct, { color: stepPctColor(step3) }]}>100%</Text>
              <Text style={st.na_stepLabel}>{t('shop.noAds.guaranteed')}</Text>
            </View>
          </View>
          <Text style={st.na_unlockNote}>
            {noteParts.pre}{' '}
            <Text style={{ color: colors.ny }}>{noteParts.pct}</Text>
            {' '}{noteParts.post}
          </Text>
        </View>
      </View>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // BOOSTERS TAB
  // ══════════════════════════════════════════════════════════════════════════

  const renderBoosters = () => {
    const now = Date.now();
    const b2x = iapState.booster2x;
    const b5x = iapState.booster5x;
    const perm = iapState.permanentMultiplierPurchased;

    const b2xRemaining = b2x.isActive && b2x.expiresAt ? Math.max(0, b2x.expiresAt - now) : 0;
    const b5xRemaining = b5x.isActive && b5x.expiresAt ? Math.max(0, b5x.expiresAt - now) : 0;

    return (
      <>
        {/* 2x Production Booster (yellow) */}
        <View style={[st.bo_card, st.bo_cardYellow]}>
          <LinearGradient
            colors={['transparent', colors.ny, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={st.bo_topAccent}
          />
          <View style={st.bo_top}>
            <View style={[st.bo_icon, st.bo_iconYellow]}>
              <Text style={st.bo_iconEmoji}>⚡</Text>
            </View>
            <View style={st.bo_meta}>
              <Text style={st.bo_name}>2x Production Booster</Text>
              {b2x.isActive && b2xRemaining > 0 && (
                <View style={st.bo_activeBadge}>
                  <Text style={st.bo_activeBadgeText}>{'⚡ '}{t('shop.boosters.active')}{' — '}{formatTime(b2xRemaining)}</Text>
                </View>
              )}
              <Text style={st.bo_desc}>
                {t('shop.boosters.2x.desc')}
                {' '}{BOOSTER_CONFIG.BOOSTER_2X.durationMs / 3600000}{' '}{t('shop.boosters.hours')}
              </Text>
              <View style={st.bo_durationBadge}>
                <Text style={st.bo_durationBadgeText}>
                  {'⏱ '}{BOOSTER_CONFIG.BOOSTER_2X.durationMs / 3600000}{' '}{t('shop.boosters.hours')}{' · '}{t('shop.boosters.stackable')}
                </Text>
              </View>
            </View>
          </View>
          <View style={st.bo_perks}>
            <View style={st.bo_perkRow}>
              <View style={st.bo_perkCheck}><Text style={st.bo_perkCheckText}>✓</Text></View>
              <Text style={st.bo_perkText}>{t('shop.boosters.2x.perk1')}</Text>
            </View>
            <View style={st.bo_perkRow}>
              <View style={st.bo_perkCheck}><Text style={st.bo_perkCheckText}>✓</Text></View>
              <Text style={st.bo_perkText}>{t('shop.boosters.2x.perk2')}</Text>
            </View>
          </View>
          <View style={st.bo_footer}>
            <View style={st.bo_priceWrap}>
              <Text style={st.bo_priceLabel}>{t('shop.boosters.price')}</Text>
              <Text style={[st.bo_price, st.bo_priceYellow]}>${IAP_PRICES.BOOSTER_2X.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[st.bo_btn, st.bo_btnYellow, !!purchasing && st.bo_btnDisabled]}
              onPress={() => confirmPurchase(IAP_PRODUCT_IDS.BOOSTER_2X)}
              disabled={!!purchasing}
              activeOpacity={0.8}
            >
              {purchasing === IAP_PRODUCT_IDS.BOOSTER_2X ? (
                <ActivityIndicator color={colors.ny} size="small" />
              ) : (
                <Text style={[st.bo_btnText, st.bo_btnTextYellow]}>
                  {t('shop.boosters.buy')}{' $'}{IAP_PRICES.BOOSTER_2X.toFixed(2)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 5x Production Booster (orange) */}
        <View style={[st.bo_card, st.bo_cardOrange]}>
          <LinearGradient
            colors={['transparent', '#ff6b1a', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={st.bo_topAccent}
          />
          <View style={st.bo_top}>
            <View style={[st.bo_icon, st.bo_iconOrange]}>
              <Text style={st.bo_iconEmoji}>🚀</Text>
            </View>
            <View style={st.bo_meta}>
              <Text style={st.bo_name}>5x Production Booster</Text>
              {b5x.isActive && b5xRemaining > 0 && (
                <View style={[st.bo_activeBadge, st.bo_activeBadgeOrange]}>
                  <Text style={[st.bo_activeBadgeText, st.bo_activeBadgeTextOrange]}>
                    {'🚀 '}{t('shop.boosters.active')}{' — '}{formatTime(b5xRemaining)}
                  </Text>
                </View>
              )}
              <Text style={st.bo_desc}>
                {t('shop.boosters.5x.desc')}
                {' '}{BOOSTER_CONFIG.BOOSTER_5X.durationMs / 3600000}{' '}{t('shop.boosters.hours')}
              </Text>
              <View style={st.bo_durationBadge}>
                <Text style={st.bo_durationBadgeText}>
                  {'⏱ '}{BOOSTER_CONFIG.BOOSTER_5X.durationMs / 3600000}{' '}{t('shop.boosters.hours')}{' · '}{t('shop.boosters.stackable')}
                </Text>
              </View>
            </View>
          </View>
          <View style={st.bo_perks}>
            <View style={st.bo_perkRow}>
              <View style={st.bo_perkCheck}><Text style={st.bo_perkCheckText}>✓</Text></View>
              <Text style={st.bo_perkText}>{t('shop.boosters.5x.perk1')}</Text>
            </View>
            <View style={st.bo_perkRow}>
              <View style={st.bo_perkCheck}><Text style={st.bo_perkCheckText}>✓</Text></View>
              <Text style={st.bo_perkText}>{t('shop.boosters.5x.perk2')}</Text>
            </View>
          </View>
          <View style={st.bo_footer}>
            <View style={st.bo_priceWrap}>
              <Text style={st.bo_priceLabel}>{t('shop.boosters.price')}</Text>
              <Text style={[st.bo_price, st.bo_priceOrange]}>${IAP_PRICES.BOOSTER_5X.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[st.bo_btn, st.bo_btnOrange, !!purchasing && st.bo_btnDisabled]}
              onPress={() => confirmPurchase(IAP_PRODUCT_IDS.BOOSTER_5X)}
              disabled={!!purchasing}
              activeOpacity={0.8}
            >
              {purchasing === IAP_PRODUCT_IDS.BOOSTER_5X ? (
                <ActivityIndicator color="#ff6b1a" size="small" />
              ) : (
                <Text style={[st.bo_btnText, st.bo_btnTextOrange]}>
                  {t('shop.boosters.buy')}{' $'}{IAP_PRICES.BOOSTER_5X.toFixed(2)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Permanent 2x Multiplier (purple) */}
        <View style={[st.bo_card, st.bo_cardPurple]}>
          <LinearGradient
            colors={['transparent', '#a040ff', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={st.bo_topAccent}
          />
          <View style={st.bo_top}>
            <View style={[st.bo_icon, st.bo_iconPurple]}>
              <Text style={st.bo_iconEmoji}>♾</Text>
            </View>
            <View style={st.bo_meta}>
              <Text style={st.bo_name}>Permanent 2x Multiplier</Text>
              {perm && (
                <View style={[st.bo_activeBadge, st.bo_activeBadgePurple]}>
                  <Text style={[st.bo_activeBadgeText, st.bo_activeBadgeTextPurple]}>
                    {'♾ '}{t('shop.boosters.perm.active')}
                  </Text>
                </View>
              )}
              <Text style={st.bo_desc}>{t('shop.boosters.perm.desc')}</Text>
              <View style={st.bo_durationBadge}>
                <Text style={st.bo_durationBadgeText}>{t('shop.boosters.perm.duration')}</Text>
              </View>
            </View>
          </View>
          <View style={st.bo_perks}>
            <View style={st.bo_perkRow}>
              <View style={st.bo_perkCheck}><Text style={st.bo_perkCheckText}>✓</Text></View>
              <Text style={st.bo_perkText}>{t('shop.boosters.perm.perk1')}</Text>
            </View>
            <View style={st.bo_perkRow}>
              <View style={st.bo_perkCheck}><Text style={st.bo_perkCheckText}>✓</Text></View>
              <Text style={st.bo_perkText}>{t('shop.boosters.perm.perk2')}</Text>
            </View>
          </View>
          <View style={st.bo_footer}>
            <View style={st.bo_priceWrap}>
              <Text style={st.bo_priceLabel}>{t('shop.boosters.price')}</Text>
              <Text style={[st.bo_price, st.bo_pricePurple]}>${IAP_PRICES.PERMANENT_MULTIPLIER.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[st.bo_btn, perm ? st.bo_btnOwned : st.bo_btnPurple]}
              onPress={() => !perm && confirmPurchase(IAP_PRODUCT_IDS.PERMANENT_MULTIPLIER)}
              disabled={perm || !!purchasing}
              activeOpacity={perm ? 1 : 0.8}
            >
              {purchasing === IAP_PRODUCT_IDS.PERMANENT_MULTIPLIER ? (
                <ActivityIndicator color="#a040ff" size="small" />
              ) : (
                <Text style={[st.bo_btnText, perm ? st.bo_btnTextOwned : st.bo_btnTextPurple]}>
                  {perm ? t('shop.boosters.purchased') : `${t('shop.boosters.buy')} $${IAP_PRICES.PERMANENT_MULTIPLIER.toFixed(2)}`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Offline Miner (teal/cyan) */}
        <View style={[st.bo_card, { borderColor: 'rgba(0,229,255,0.25)' }]}>
          <LinearGradient
            colors={['transparent', colors.nc, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={st.bo_topAccent}
          />
          <View style={st.bo_top}>
            <View style={[st.bo_icon, { backgroundColor: 'rgba(0,229,255,0.15)' }]}>
              <Text style={st.bo_iconEmoji}>🌙</Text>
            </View>
            <View style={st.bo_meta}>
              <Text style={st.bo_name}>Offline Miner</Text>
              {iapState.offlineMiner.isActive && iapState.offlineMiner.expiresAt && (
                <View style={[st.bo_activeBadge, { backgroundColor: 'rgba(0,229,255,0.15)' }]}>
                  <Text style={[st.bo_activeBadgeText, { color: colors.nc }]}>
                    {'🌙 Active — '}{formatTime(Math.max(0, iapState.offlineMiner.expiresAt - now))}
                  </Text>
                </View>
              )}
              <Text style={st.bo_desc}>
                {`Mine at 50% speed while offline for ${offlineMinerExtended ? '12' : '8'} hours`}
              </Text>
              <View style={st.bo_durationBadge}>
                <Text style={st.bo_durationBadgeText}>
                  {`⏱ ${offlineMinerExtended ? '12' : '8'}h · One-time use`}
                  {offlineMinerExtended ? ' · ✨ Extended offer!' : ''}
                </Text>
              </View>
            </View>
          </View>
          <View style={st.bo_perks}>
            <View style={st.bo_perkRow}>
              <View style={st.bo_perkCheck}><Text style={st.bo_perkCheckText}>✓</Text></View>
              <Text style={st.bo_perkText}>Earn coins while the app is closed</Text>
            </View>
            <View style={st.bo_perkRow}>
              <View style={st.bo_perkCheck}><Text style={st.bo_perkCheckText}>✓</Text></View>
              <Text style={st.bo_perkText}>50% of your current production rate</Text>
            </View>
          </View>
          <View style={st.bo_footer}>
            <View style={st.bo_priceWrap}>
              <Text style={st.bo_priceLabel}>{t('shop.boosters.price')}</Text>
              <Text style={[st.bo_price, { color: colors.nc }]}>${IAP_PRICES.OFFLINE_MINER.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[st.bo_btn, { borderColor: colors.nc }, !!purchasing && st.bo_btnDisabled]}
              onPress={purchaseOfflineMiner}
              disabled={!!purchasing}
              activeOpacity={0.8}
            >
              {purchasing === IAP_PRODUCT_IDS.OFFLINE_MINER ? (
                <ActivityIndicator color={colors.nc} size="small" />
              ) : (
                <Text style={[st.bo_btnText, { color: colors.nc }]}>
                  {t('shop.boosters.buy')}{' $'}{IAP_PRICES.OFFLINE_MINER.toFixed(2)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Lucky Block (green) */}
        <View style={[st.bo_card, { borderColor: 'rgba(0,255,136,0.25)' }]}>
          <LinearGradient
            colors={['transparent', colors.ng, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={st.bo_topAccent}
          />
          <View style={st.bo_top}>
            <View style={[st.bo_icon, { backgroundColor: 'rgba(0,255,136,0.15)' }]}>
              <Text style={st.bo_iconEmoji}>🎲</Text>
            </View>
            <View style={st.bo_meta}>
              <Text style={st.bo_name}>Lucky Block</Text>
              {iapState.luckyBlock.isActive && (
                <View style={[st.bo_activeBadge, { backgroundColor: 'rgba(0,255,136,0.15)' }]}>
                  <Text style={[st.bo_activeBadgeText, { color: colors.ng }]}>
                    {`🎲 Active — ${iapState.luckyBlock.blocksRemaining.toLocaleString()} blocks left`}
                  </Text>
                </View>
              )}
              <Text style={st.bo_desc}>{`Next ${getLuckyBlockCount().toLocaleString()} blocks give 10x rewards`}</Text>
              <View style={st.bo_durationBadge}>
                <Text style={st.bo_durationBadgeText}>
                  {`◈ ${getLuckyBlockCount().toLocaleString()} blocks · One-time use`}
                </Text>
              </View>
            </View>
          </View>
          <View style={st.bo_perks}>
            <View style={st.bo_perkRow}>
              <View style={st.bo_perkCheck}><Text style={st.bo_perkCheckText}>✓</Text></View>
              <Text style={st.bo_perkText}>10x CryptoCoins per block mined</Text>
            </View>
            <View style={st.bo_perkRow}>
              <View style={st.bo_perkCheck}><Text style={st.bo_perkCheckText}>✓</Text></View>
              <Text style={st.bo_perkText}>Block count scales with your mining stage</Text>
            </View>
          </View>
          <View style={st.bo_footer}>
            <View style={st.bo_priceWrap}>
              <Text style={st.bo_priceLabel}>{t('shop.boosters.price')}</Text>
              <Text style={[st.bo_price, { color: colors.ng }]}>${IAP_PRICES.LUCKY_BLOCK.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[st.bo_btn, { borderColor: colors.ng }, !!purchasing && st.bo_btnDisabled]}
              onPress={purchaseLuckyBlock}
              disabled={!!purchasing}
              activeOpacity={0.8}
            >
              {purchasing === IAP_PRODUCT_IDS.LUCKY_BLOCK ? (
                <ActivityIndicator color={colors.ng} size="small" />
              ) : (
                <Text style={[st.bo_btnText, { color: colors.ng }]}>
                  {t('shop.boosters.buy')}{' $'}{IAP_PRICES.LUCKY_BLOCK.toFixed(2)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Market Pump (pink/magenta) */}
        <View style={[st.bo_card, { borderColor: 'rgba(255,64,129,0.25)' }]}>
          <LinearGradient
            colors={['transparent', '#ff4081', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={st.bo_topAccent}
          />
          <View style={st.bo_top}>
            <View style={[st.bo_icon, { backgroundColor: 'rgba(255,64,129,0.15)' }]}>
              <Text style={st.bo_iconEmoji}>📈</Text>
            </View>
            <View style={st.bo_meta}>
              <Text style={st.bo_name}>Market Pump</Text>
              {iapState.marketPump.isActive && iapState.marketPump.expiresAt && (
                <View style={[st.bo_activeBadge, { backgroundColor: 'rgba(255,64,129,0.15)' }]}>
                  <Text style={[st.bo_activeBadgeText, { color: '#ff4081' }]}>
                    {'📈 Active — '}{formatTime(Math.max(0, iapState.marketPump.expiresAt - now))}
                  </Text>
                </View>
              )}
              <Text style={st.bo_desc}>{`+100% sell price for ${marketPumpExtended ? '37' : '30'} minutes`}</Text>
              <View style={st.bo_durationBadge}>
                <Text style={st.bo_durationBadgeText}>
                  {`⏱ ${marketPumpExtended ? '37' : '30'} min · Stackable`}
                  {marketPumpExtended ? ' · ✨ Extended offer!' : ''}
                </Text>
              </View>
            </View>
          </View>
          <View style={st.bo_perks}>
            <View style={st.bo_perkRow}>
              <View style={st.bo_perkCheck}><Text style={st.bo_perkCheckText}>✓</Text></View>
              <Text style={st.bo_perkText}>Double the price when selling CryptoCoins</Text>
            </View>
            <View style={st.bo_perkRow}>
              <View style={st.bo_perkCheck}><Text style={st.bo_perkCheckText}>✓</Text></View>
              <Text style={st.bo_perkText}>Works on all market sales</Text>
            </View>
          </View>
          <View style={st.bo_footer}>
            <View style={st.bo_priceWrap}>
              <Text style={st.bo_priceLabel}>{t('shop.boosters.price')}</Text>
              <Text style={[st.bo_price, { color: '#ff4081' }]}>${IAP_PRICES.MARKET_PUMP.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[st.bo_btn, { borderColor: '#ff4081' }, !!purchasing && st.bo_btnDisabled]}
              onPress={purchaseMarketPump}
              disabled={!!purchasing}
              activeOpacity={0.8}
            >
              {purchasing === IAP_PRODUCT_IDS.MARKET_PUMP ? (
                <ActivityIndicator color="#ff4081" size="small" />
              ) : (
                <Text style={[st.bo_btnText, { color: '#ff4081' }]}>
                  {t('shop.boosters.buy')}{' $'}{IAP_PRICES.MARKET_PUMP.toFixed(2)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // PACKS TAB
  // ══════════════════════════════════════════════════════════════════════════

  const renderPacks = () => {
    const purchased = iapState.starterPacksPurchased;

    const getOwnedCount = (hardwareId: string): number =>
      gameState.hardware.find(h => h.id === hardwareId)?.owned ?? 0;

    // Determine which pack is currently appropriate for the player's stage
    const eligiblePackIdx = PK_META.findIndex(p => {
      if (purchased[p.key]) return false; // already bought
      if (p.key === 'small')  return getOwnedCount('asic_gen3') === 0;
      if (p.key === 'medium') return getOwnedCount('asic_gen3') >= 1 && getOwnedCount('quantum_miner') === 0;
      if (p.key === 'large')  return getOwnedCount('quantum_miner') >= 1 && getOwnedCount('supercomputer') === 0;
      if (p.key === 'mega')   return getOwnedCount('supercomputer') >= 1;
      return false;
    });

    const allOwned = eligiblePackIdx === -1 && PK_META.every(p => purchased[p.key]);
    const activePack = eligiblePackIdx >= 0 ? PK_META[eligiblePackIdx] : null;

    // Next pack: the one after eligible (for "Next Offer" section)
    const nextPack = eligiblePackIdx >= 0 && eligiblePackIdx + 1 < PK_META.length
      ? PK_META[eligiblePackIdx + 1]
      : null;

    const timerIsLow = pkTimerExpired || (iapState.packOfferExpiresAt > 0 && (iapState.packOfferExpiresAt - Date.now()) < 120000);

    // Build dynamic contents for active pack
    const packContents: PackContent[] = activePack ? (() => {
      const items: PackContent[] = [];
      // CryptoCoins
      const cc = iapState.packCurrentCC;
      const ccLabel = cc >= 1_000_000 ? `${(cc / 1_000_000).toFixed(1)}M CC`
        : cc >= 1_000 ? `${(cc / 1_000).toFixed(0)}K CC`
        : `${cc} CC`;
      items.push({ emoji: '◈', val: ccLabel, lbl: 'CryptoCoins', color: colors.ng });

      // Cash
      const cash = iapState.packCurrentCash;
      const cashLabel = cash >= 1_000_000 ? `$${(cash / 1_000_000).toFixed(1)}M`
        : cash >= 1_000 ? `$${(cash / 1_000).toFixed(0)}K`
        : `$${cash}`;
      items.push({ emoji: '💰', val: cashLabel, lbl: 'Cash', color: colors.ny });

      // Third benefit: energy credits (non-renewable stage) or production booster
      if (iapState.packCurrentElectricityHours > 0) {
        items.push({ emoji: '⚡', val: `${iapState.packCurrentElectricityHours}h`, lbl: 'Energy Credits', color: colors.nc });
      } else {
        // Every pack always includes a 2x production booster (duration scales with tier)
        const boosterHours: Record<PackKey, number> = { small: 1, medium: 2, large: 4, mega: 24 };
        const h = boosterHours[activePack.key];
        items.push({ emoji: '⚡', val: `2x · ${h}h`, lbl: 'Booster', color: colors.ny });
      }
      return items;
    })() : [];

    // Compute next offer display
    const nextOfferDisplay = (() => {
      if (iapState.packNextOfferAt === 0) return null; // can offer immediately
      const remaining = Math.max(0, iapState.packNextOfferAt - Date.now());
      if (remaining === 0) return null;
      const totalSec = Math.ceil(remaining / 1000);
      const hh = Math.floor(totalSec / 3600).toString().padStart(2, '0');
      const mm = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
      const ss = (totalSec % 60).toString().padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    })();

    return (
      <View>
        <View style={st.pk_sectionHdrRow}>
          <Text style={st.pk_sectionHdr}>{t('shop.packs.activeOffer')}</Text>
          <View style={st.pk_sectionHdrLine} />
        </View>

        {allOwned ? (
          <View style={st.pk_allOwnedBox}>
            <Text style={st.pk_allOwnedEmoji}>◈</Text>
            <Text style={st.pk_allOwnedTitle}>{t('shop.packs.allOwned.title')}</Text>
            <Text style={st.pk_allOwnedSub}>
              {t('shop.packs.allOwned.sub')}
            </Text>
          </View>
        ) : (
          <LinearGradient
            colors={['rgba(0,255,136,0.07)', 'rgba(0,229,255,0.04)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={st.pk_dynamicOffer}
          >
            <LinearGradient
              colors={[colors.ng, colors.nc]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={st.pk_offerAccentBar}
            />
            <View style={st.pk_offerTopRow}>
              <View style={st.pk_offerLeft}>
                <View style={st.pk_offerEyebrowRow}>
                  <Text style={st.pk_offerEyebrow}>{t(activePack!.eyebrowKey)}</Text>
                  <Animated.View style={[st.pk_offerBadge, { transform: [{ scale: pkBadgePulse }] }]}>
                    <LinearGradient
                      colors={[colors.ny, '#ff8c00']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={st.pk_offerBadgeText}>{t('shop.packs.exclusive')}</Text>
                  </Animated.View>
                </View>
                <Text style={st.pk_offerName}>{activePack!.name}</Text>
              </View>
              <View style={st.pk_offerTimerMini}>
                <Text style={st.pk_otmLabel}>{t('shop.packs.expiresIn')}</Text>
                <Animated.Text
                  style={[
                    st.pk_otmTime,
                    {
                      opacity: pkTimerOpacity,
                      color: pkTimerExpired ? colors.nr : (timerIsLow ? colors.nr : colors.ny),
                    },
                  ]}
                >
                  {pkTimerExpired ? t('shop.packs.expired') : pkTimerDisplay}
                </Animated.Text>
              </View>
            </View>

            <View style={st.pk_offerContentsRow}>
              {packContents.map((item, idx) => (
                <View key={idx} style={st.pk_ocItem}>
                  <Text style={st.pk_ocEmoji}>{item.emoji}</Text>
                  <Text style={[st.pk_ocVal, { color: item.color }]}>{item.val}</Text>
                  <Text style={st.pk_ocLbl}>{item.lbl}</Text>
                </View>
              ))}
            </View>

            <View style={st.pk_offerFooterRow}>
              <View style={st.pk_ofPricing}>
                <Text style={st.pk_ofWas}>{t('shop.packs.normalPrice')}{' $'}{activePack!.wasPrice.toFixed(2)}</Text>
                <Text style={st.pk_ofNow}>${activePack!.price.toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                style={[st.pk_ofBtn, !!purchasing && st.pk_ofBtnDisabled]}
                onPress={() => confirmPurchase(activePack!.productId)}
                disabled={!!purchasing}
                activeOpacity={0.8}
              >
                <Animated.View
                  pointerEvents="none"
                  style={[st.pk_ofBtnShimmer, { transform: [{ translateX: pkBuyShimmerAnim }] }]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(0,255,136,0.14)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
                {purchasing === activePack!.productId ? (
                  <ActivityIndicator color={colors.ng} size="small" />
                ) : (
                  <Text style={st.pk_ofBtnText}>{t('shop.packs.buy')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}

        <View style={st.pk_divider} />

        <View style={st.pk_sectionHdrRow}>
          <Text style={st.pk_sectionHdr}>{t('shop.packs.nextOffer')}</Text>
          <View style={st.pk_sectionHdrLine} />
        </View>

        {nextPack ? (
          <>
            <View style={st.pk_unlockNoteBar}>
              <Text style={st.pk_unlockNoteText}>{t(nextPack.unlockNoteKey)}</Text>
            </View>
            <View style={st.pk_nextOffer}>
              <Text style={st.pk_noLabel}>{t('shop.packs.nextOfferIn')}</Text>
              {nextOfferDisplay ? (
                <Text style={st.pk_noTimer}>{nextOfferDisplay}</Text>
              ) : (
                <Text style={st.pk_noTimer}>—</Text>
              )}
              <Text style={st.pk_noSub}>{t('shop.packs.sessionOffer')}</Text>
            </View>
          </>
        ) : (
          <View style={st.pk_nextOffer}>
            <Text style={st.pk_noLabel}>{t('shop.packs.noMoreOffers')}</Text>
            <Text style={st.pk_noTimer}>—</Text>
            <Text style={st.pk_noSub}>{t('shop.packs.allClaimed')}</Text>
          </View>
        )}
      </View>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB BAR + RENDER
  // ══════════════════════════════════════════════════════════════════════════

  const tabs: Array<{ id: ShopTab; icon: string; label: string }> = [
    { id: 'removeAds', icon: '🚫', label: 'No Ads' },
    { id: 'boosters', icon: '⚡', label: 'Boosters' },
    { id: 'packs', icon: '📦', label: 'Packs' },
  ];

  return (
    <View style={st.container}>
      {/* Animated background: grid + particles + scanline */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <ShopGrid />
        {SHOP_PARTICLES.map((p, i) => (
          <ShopParticle key={i} left={p.left} duration={p.duration} delay={p.delay} color={p.color} />
        ))}
        <ShopScanline />
      </View>

      <View style={st.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[st.tabBtn, activeTab === tab.id && st.tabBtnActive]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.8}
          >
            <Text style={st.tabIcon}>{tab.icon}</Text>
            <Text style={[st.tabLabel, activeTab === tab.id && st.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={st.content} contentContainerStyle={st.contentContainer}>
        {activeTab === 'removeAds' && renderNoAds()}
        {activeTab === 'boosters' && renderBoosters()}
        {activeTab === 'packs' && renderPacks()}
      </ScrollView>
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════

const st = StyleSheet.create({
  // ── Shell ──────────────────────────────────────────────────────────────────
  container: { flex: 1, backgroundColor: colors.bg },

  // ── Tab bar ────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(2,8,16,0.8)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 3,
  },
  tabBtnActive: { borderBottomColor: colors.ng },
  tabIcon: { fontSize: 16 },
  tabLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
  },
  tabLabelActive: { color: colors.ng },

  // ── Content ────────────────────────────────────────────────────────────────
  content: { flex: 1 },
  contentContainer: { padding: 14, paddingBottom: 32 },

  // ════════════════════════
  // NO ADS
  // ════════════════════════
  na_hero: {
    borderWidth: 1,
    borderColor: 'rgba(255,61,90,0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  na_heroAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  na_bigIcon: { fontSize: 48, marginBottom: 10, marginTop: 8 },
  na_heroTitle: {
    fontFamily: fonts.orbitronBlack,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  na_perks: { width: '100%', marginTop: 12, marginBottom: 12 },
  na_perk: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 },
  na_perkX: {
    width: 16, height: 16, borderRadius: 3,
    backgroundColor: 'rgba(255,61,90,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,61,90,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8, flexShrink: 0, marginTop: 1,
  },
  na_perkXText: { fontSize: 8, color: '#ff3d5a', lineHeight: 10 },
  na_perkCheck: {
    width: 16, height: 16, borderRadius: 3,
    backgroundColor: 'rgba(0,255,136,0.12)',
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.28)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8, flexShrink: 0, marginTop: 1,
  },
  na_perkCheckText: { fontSize: 8, color: '#00ff88', lineHeight: 10 },
  na_perkText: {
    fontSize: 13, color: 'rgba(255,255,255,0.65)',
    flex: 1, lineHeight: 18, fontFamily: fonts.rajdhani,
  },
  /* Normal state: neutral price box */
  na_priceBox: {
    width: '100%', marginTop: 14, marginBottom: 10,
    padding: 12, paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
  },
  na_priceBoxLabel: {
    fontFamily: fonts.mono, fontSize: 8, letterSpacing: 2,
    color: 'rgba(255,255,255,0.4)', marginBottom: 6, textAlign: 'center',
  },
  na_priceBoxValue: {
    fontFamily: fonts.orbitronBlack, fontSize: 32, color: '#fff', lineHeight: 38, textAlign: 'center',
  },
  /* Sale state: yellow promo banner */
  na_promoBanner: {
    width: '100%', marginTop: 14, marginBottom: 10,
    padding: 12, paddingHorizontal: 14,
    backgroundColor: 'rgba(255,214,0,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,214,0,0.25)', borderRadius: 12,
  },
  na_promoTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  na_promoLeft: { flexDirection: 'row', alignItems: 'center' },
  na_promoIcon: { fontSize: 14, marginRight: 6 },
  na_promoLabel: {
    fontFamily: fonts.mono, fontSize: 8, letterSpacing: 2,
    color: colors.ny, textTransform: 'uppercase',
  },
  na_promoRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  na_promoExpiresLabel: {
    fontFamily: fonts.mono, fontSize: 8, letterSpacing: 1,
    color: 'rgba(255,255,255,0.18)',
  },
  na_promoTimer: {
    fontFamily: fonts.orbitronBlack, fontSize: 14, color: colors.ny,
  },
  na_priceCentered: { alignItems: 'center', marginTop: 4, width: '100%' },
  na_priceNormal: {
    fontFamily: fonts.orbitron, fontSize: 15,
    color: 'rgba(255,255,255,0.3)', textDecorationLine: 'line-through',
    lineHeight: 20, marginBottom: 4, textAlign: 'center',
  },
  na_priceNowWrap: {
    alignItems: 'center', justifyContent: 'center',
  },
  // Concentric ellipses simulating gaussian glow (text-shadow:{0,0} broken on Android)
  na_glowOuter: {
    position: 'absolute', width: 300, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,214,0,0.05)',
  },
  na_glowMid: {
    position: 'absolute', width: 230, height: 78, borderRadius: 39,
    backgroundColor: 'rgba(255,214,0,0.11)',
  },
  na_glowInner: {
    position: 'absolute', width: 170, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(255,214,0,0.22)',
  },
  na_glowCore: {
    position: 'absolute', width: 115, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,214,0,0.42)',
  },
  na_priceNow: {
    fontFamily: fonts.orbitronBlack, fontSize: 32,
    color: colors.ny, lineHeight: 38, textAlign: 'center',
  },
  na_buyBtnOuter: {
    width: '100%', borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.ny,
    backgroundColor: 'rgba(255,214,0,0.14)',
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.ny, shadowOpacity: 0.13, shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  na_buyBtnNormalOuter: {
    width: '100%', borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.nr,
    backgroundColor: 'rgba(255,61,90,0.14)',
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.nr, shadowOpacity: 0.13, shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  na_shimmer: {
    position: 'absolute', top: 0, bottom: 0, width: 300,
  },
  na_buyBtnText: {
    fontFamily: fonts.orbitron, fontSize: 13,
    letterSpacing: 3, color: colors.ny,
  },
  na_buyBtnNormalText: {
    fontFamily: fonts.orbitron, fontSize: 13,
    letterSpacing: 3, color: colors.nr,
  },
  na_ownedBanner: {
    width: '100%', marginTop: 14, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.4)',
    backgroundColor: 'rgba(0,255,136,0.08)', alignItems: 'center',
  },
  na_ownedText: {
    fontFamily: fonts.orbitron, fontSize: 13,
    letterSpacing: 3, color: colors.ng,
  },
  na_divider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 4, marginBottom: 14,
  },
  na_secHdrRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8,
  },
  na_secHdr: {
    fontFamily: fonts.mono, fontSize: 9, letterSpacing: 4,
    color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
  },
  na_secHdrLine: { flex: 1, height: 1, backgroundColor: 'rgba(0,255,136,0.2)' },
  na_unlockCard: {
    backgroundColor: 'rgba(0,255,136,0.04)',
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.15)',
    borderRadius: 12, padding: 14, marginBottom: 14,
  },
  na_unlockTitle: {
    fontFamily: fonts.mono, fontSize: 8, letterSpacing: 3,
    color: colors.ng, textTransform: 'uppercase', marginBottom: 10,
  },
  na_stepsRow: { flexDirection: 'row', marginBottom: 10, gap: 6 },
  na_step: {
    flex: 1, borderRadius: 8, padding: 8, paddingHorizontal: 6,
    alignItems: 'center', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  na_stepDone: {
    borderColor: 'rgba(0,255,136,0.3)', backgroundColor: 'rgba(0,255,136,0.06)',
  },
  na_stepActive: {
    borderColor: 'rgba(255,214,0,0.35)', backgroundColor: 'rgba(255,214,0,0.06)',
  },
  na_stepCheck: {
    position: 'absolute', top: -6, right: -6,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.ng, alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  na_stepCheckText: { fontSize: 8, color: '#000', fontWeight: '900', lineHeight: 10 },
  na_stepBuy: {
    fontFamily: fonts.mono, fontSize: 8, color: 'rgba(255,255,255,0.18)',
    letterSpacing: 1, marginBottom: 4, textAlign: 'center',
  },
  na_stepPct: {
    fontFamily: fonts.orbitron, fontSize: 14,
    textAlign: 'center', lineHeight: 18,
  },
  na_stepLabel: {
    fontSize: 9, color: 'rgba(255,255,255,0.18)',
    marginTop: 2, textAlign: 'center', fontFamily: fonts.mono,
  },
  na_unlockNote: {
    fontFamily: fonts.mono, fontSize: 9,
    color: 'rgba(255,255,255,0.18)', letterSpacing: 1, lineHeight: 14,
  },
  /* TEMP: demo toggle styles (remove before ship) */
  na_demoToggle: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  na_demoToggleBtnOuter: {
    flex: 1, borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  na_demoToggleBtnOuterActive: { borderColor: colors.ng },
  na_demoToggleBtnInner: {
    padding: 7, backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
  },
  na_demoToggleBtnInnerActive: { backgroundColor: 'rgba(0,255,136,0.1)' },
  na_demoToggleBtnText: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.4)' },
  na_demoToggleBtnTextActive: { color: colors.ng },

  // ════════════════════════
  // BOOSTERS
  // ════════════════════════
  bo_card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 16, marginBottom: 10, overflow: 'hidden',
  },
  bo_cardYellow: { borderColor: 'rgba(255,214,0,0.2)' },
  bo_cardOrange: { borderColor: 'rgba(255,107,26,0.2)' },
  bo_cardPurple: { borderColor: 'rgba(160,64,255,0.2)' },
  bo_topAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  bo_top: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  bo_icon: {
    width: 52, height: 52, borderRadius: 12, borderWidth: 1,
    flexShrink: 0, alignItems: 'center', justifyContent: 'center',
  },
  bo_iconYellow: { backgroundColor: 'rgba(255,214,0,0.08)', borderColor: 'rgba(255,214,0,0.2)' },
  bo_iconOrange: { backgroundColor: 'rgba(255,107,26,0.08)', borderColor: 'rgba(255,107,26,0.2)' },
  bo_iconPurple: { backgroundColor: 'rgba(160,64,255,0.08)', borderColor: 'rgba(160,64,255,0.2)' },
  bo_iconEmoji: { fontSize: 26 },
  bo_meta: { flex: 1 },
  bo_name: { fontFamily: fonts.orbitron, fontSize: 13, color: '#ffffff', marginBottom: 3 },
  bo_desc: {
    fontFamily: fonts.rajdhani, fontSize: 12,
    color: 'rgba(255,255,255,0.4)', lineHeight: 17,
  },
  bo_activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,214,0,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,214,0,0.35)',
    borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 4,
  },
  bo_activeBadgeOrange: {
    backgroundColor: 'rgba(255,107,26,0.12)', borderColor: 'rgba(255,107,26,0.35)',
  },
  bo_activeBadgePurple: {
    backgroundColor: 'rgba(160,64,255,0.12)', borderColor: 'rgba(160,64,255,0.35)',
  },
  bo_activeBadgeText: { fontFamily: fonts.mono, fontSize: 9, letterSpacing: 0.8, color: colors.ny },
  bo_activeBadgeTextOrange: { color: '#ff6b1a' },
  bo_activeBadgeTextPurple: { color: '#a040ff' },
  bo_durationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6,
  },
  bo_durationBadgeText: {
    fontFamily: fonts.mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1,
  },
  bo_perks: { flexDirection: 'column', gap: 4, marginBottom: 12 },
  bo_perkRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  bo_perkCheck: {
    width: 16, height: 16, borderRadius: 3,
    backgroundColor: 'rgba(0,255,136,0.12)',
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.28)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bo_perkCheckText: { fontSize: 9, color: colors.ng, lineHeight: 11 },
  bo_perkText: {
    fontSize: 12, color: 'rgba(255,255,255,0.6)', flex: 1, fontFamily: fonts.rajdhani,
  },
  bo_footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  },
  bo_priceWrap: { flexDirection: 'column' },
  bo_priceLabel: {
    fontFamily: fonts.mono, fontSize: 8, letterSpacing: 2,
    color: 'rgba(255,255,255,0.4)', marginBottom: 2,
  },
  bo_price: { fontFamily: fonts.orbitronBlack, fontSize: 20 },
  bo_priceYellow: { color: colors.ny },
  bo_priceOrange: { color: '#ff6b1a' },
  bo_pricePurple: { color: '#a040ff' },
  bo_btn: {
    paddingVertical: 13, paddingHorizontal: 20, borderRadius: 11,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', minWidth: 150,
  },
  bo_btnYellow: { backgroundColor: 'rgba(255,214,0,0.14)', borderColor: colors.ny },
  bo_btnOrange: { backgroundColor: 'rgba(255,107,26,0.14)', borderColor: '#ff6b1a' },
  bo_btnPurple: { backgroundColor: 'rgba(160,64,255,0.14)', borderColor: '#a040ff' },
  bo_btnOwned: {
    backgroundColor: 'rgba(0,255,136,0.06)', borderColor: 'rgba(0,255,136,0.2)',
  },
  bo_btnDisabled: { opacity: 0.5 },
  bo_btnText: { fontFamily: fonts.orbitron, fontSize: 12, letterSpacing: 2 },
  bo_btnTextYellow: { color: colors.ny },
  bo_btnTextOrange: { color: '#ff6b1a' },
  bo_btnTextPurple: { color: '#a040ff' },
  bo_btnTextOwned: { color: 'rgba(0,255,136,0.5)' },

  // ════════════════════════
  // PACKS
  // ════════════════════════
  pk_sectionHdrRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  pk_sectionHdr: {
    fontFamily: fonts.mono, fontSize: 9, letterSpacing: 4,
    color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
  },
  pk_sectionHdrLine: { flex: 1, height: 1, backgroundColor: 'rgba(0,229,255,0.2)' },
  pk_dynamicOffer: {
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.25)',
    borderRadius: 16, padding: 16, marginBottom: 16, overflow: 'hidden',
  },
  pk_offerAccentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  pk_offerTopRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 10, marginTop: 4,
  },
  pk_offerLeft: { flex: 1, marginRight: 8 },
  pk_offerEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  pk_offerEyebrow: {
    fontFamily: fonts.mono, fontSize: 8, letterSpacing: 3,
    color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
  },
  pk_offerBadge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20,
    marginLeft: 6, overflow: 'hidden',
  },
  pk_offerBadgeText: {
    fontFamily: fonts.orbitronBlack, fontSize: 8, letterSpacing: 1, color: '#000',
  },
  pk_offerName: { fontFamily: fonts.orbitronBlack, fontSize: 15, color: '#ffffff' },
  pk_offerTimerMini: { alignItems: 'flex-end' },
  pk_otmLabel: {
    fontFamily: fonts.mono, fontSize: 7, letterSpacing: 2,
    color: 'rgba(255,255,255,0.4)', marginBottom: 2,
  },
  pk_otmTime: { fontFamily: fonts.orbitronBlack, fontSize: 15, color: colors.ny },
  pk_offerContentsRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  pk_ocItem: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center',
  },
  pk_ocEmoji: { fontSize: 26, marginBottom: 4, textAlign: 'center', color: '#ffffff' },
  pk_ocVal: {
    fontFamily: fonts.orbitron, fontSize: 13,
    color: colors.ng, textAlign: 'center',
  },
  pk_ocLbl: {
    fontFamily: fonts.mono, fontSize: 7, letterSpacing: 1,
    color: 'rgba(255,255,255,0.18)', marginTop: 2, textAlign: 'center',
  },
  pk_offerFooterRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
  },
  pk_ofPricing: { flex: 1 },
  pk_ofWas: {
    fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1,
    color: 'rgba(255,255,255,0.18)', textDecorationLine: 'line-through',
  },
  pk_ofNow: { fontFamily: fonts.orbitronBlack, fontSize: 22, color: colors.ny },
  pk_ofBtn: {
    paddingVertical: 13, paddingHorizontal: 18, borderRadius: 11,
    backgroundColor: 'rgba(0,255,136,0.15)',
    borderWidth: 1, borderColor: colors.ng, minWidth: 110, alignItems: 'center',
    overflow: 'hidden',
  },
  pk_ofBtnShimmer: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: 120,
  },
  pk_ofBtnDisabled: { opacity: 0.5 },
  pk_ofBtnText: {
    fontFamily: fonts.orbitron, fontSize: 11, letterSpacing: 2, color: colors.ng,
  },
  pk_divider: {
    height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 4, marginBottom: 14,
  },
  pk_unlockNoteBar: {
    flexDirection: 'row', gap: 6,
    backgroundColor: 'rgba(0,229,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(0,229,255,0.12)',
    borderRadius: 8, paddingVertical: 7, paddingHorizontal: 12, marginBottom: 12,
  },
  pk_unlockNoteText: {
    fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1, color: 'rgba(0,229,255,0.6)',
  },
  pk_nextOffer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  pk_noLabel: {
    fontFamily: fonts.mono, fontSize: 9, letterSpacing: 3,
    color: 'rgba(255,255,255,0.18)', marginBottom: 6, textTransform: 'uppercase',
  },
  pk_noTimer: {
    fontFamily: fonts.orbitronBlack, fontSize: 22,
    color: 'rgba(255,255,255,0.4)', marginBottom: 4,
  },
  pk_noSub: {
    fontFamily: fonts.mono, fontSize: 8, letterSpacing: 2, color: 'rgba(255,255,255,0.18)',
  },
  pk_allOwnedBox: {
    backgroundColor: 'rgba(0,255,136,0.04)',
    borderWidth: 1, borderColor: 'rgba(0,255,136,0.18)',
    borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16,
  },
  pk_allOwnedEmoji: { fontSize: 36, color: colors.ng, marginBottom: 8, textAlign: 'center' },
  pk_allOwnedTitle: {
    fontFamily: fonts.orbitronBlack, fontSize: 16, color: '#ffffff', marginBottom: 6,
  },
  pk_allOwnedSub: {
    fontFamily: fonts.mono, fontSize: 9, letterSpacing: 2,
    color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 16,
  },
});

export default ShopScreen;
