import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState } from '../types/game';
import { logEvent } from '../services/analytics';

const GAME_STATE_KEY = 'blockchain_tycoon_game_state';
const LANGUAGE_KEY = 'blockchain_tycoon_language';

export const saveGameState = async (gameState: GameState): Promise<void> => {
  try {
    const gameStateWithTimestamp = {
      ...gameState,
      lastSaveTime: Date.now(),
    };
    await AsyncStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameStateWithTimestamp));
  } catch (error: any) {
    console.error('Error saving game state:', error);
    logEvent('error', { category: 'storage', message: error?.message || 'Save failed', context: 'saveGameState' });
  }
};

export const loadGameState = async (): Promise<GameState | null> => {
  try {
    const savedState = await AsyncStorage.getItem(GAME_STATE_KEY);
    if (savedState) {
      return JSON.parse(savedState);
    }
    return null;
  } catch (error: any) {
    console.error('Error loading game state:', error);
    logEvent('error', { category: 'storage', message: error?.message || 'Load failed', context: 'loadGameState' });
    return null;
  }
};

export const saveLanguage = async (languageCode: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

export const loadLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLanguage || 'en';
  } catch (error) {
    console.error('Error loading language:', error);
    return 'en';
  }
};

export const clearGameData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(GAME_STATE_KEY);
    await AsyncStorage.removeItem(LANGUAGE_KEY);
    console.log('Game data cleared successfully');
  } catch (error: any) {
    console.error('Error clearing game data:', error);
    logEvent('error', { category: 'storage', message: error?.message || 'Clear failed', context: 'clearGameData' });
  }
};

export const clearAllGameData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    console.log('All game data cleared successfully');
  } catch (error: any) {
    console.error('Error clearing all game data:', error);
    logEvent('error', { category: 'storage', message: error?.message || 'Clear all failed', context: 'clearAllGameData' });
  }
};

