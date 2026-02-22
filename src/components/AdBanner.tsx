import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useGame } from '../contexts/GameContext';
import { getAdUnitId } from '../config/adConfig';

const AdBanner: React.FC = () => {
  const { gameState } = useGame();

  if (gameState.iapState.removeAdsPurchased) {
    return null;
  }

  const adUnitId = getAdUnitId('banner');

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdLoaded={() => {
          console.log('[AdBanner] Banner loaded');
        }}
        onAdFailedToLoad={(error) => {
          console.warn('[AdBanner] Failed to load:', error.message);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#111',
  },
});

export default AdBanner;
