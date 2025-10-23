import { Translation, Language } from '../types/game';

export const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
];

export const translations: Translation = {
  // Game UI
  'game.title': {
    en: 'Blockchain Tycoon',
    es: 'Blockchain Tycoon',
    pt: 'Blockchain Tycoon',
  },
  'game.cryptoCoins': {
    en: 'CryptoCoins',
    es: 'CryptoCoins',
    pt: 'CryptoCoins',
  },
  'game.market': {
    en: 'Market',
    es: 'Mercado',
    pt: 'Mercado',
  },
  'game.prestige': {
    en: 'Prestige',
    es: 'Prestigio',
    pt: 'Prestígio',
  },
  'game.perSecond': {
    en: '/sec',
    es: '/seg',
    pt: '/seg',
  },
  'game.perClick': {
    en: '/click',
    es: '/clic',
    pt: '/clique',
  },
  'game.totalClicks': {
    en: 'Total Clicks',
    es: 'Clics Totales',
    pt: 'Cliques Totais',
  },
  'game.totalCryptoCoins': {
    en: 'Total CryptoCoins',
    es: 'CryptoCoins Totales',
    pt: 'CryptoCoins Totais',
  },

  // Cryptocurrencies
  'cryptocoin': {
    en: 'CryptoCoin',
    es: 'CryptoCoin',
    pt: 'CryptoCoin',
  },
  'bitcoin': {
    en: 'Bitcoin',
    es: 'Bitcoin',
    pt: 'Bitcoin',
  },
  'ethereum': {
    en: 'Ethereum',
    es: 'Ethereum',
    pt: 'Ethereum',
  },
  'dogecoin': {
    en: 'Dogecoin',
    es: 'Dogecoin',
    pt: 'Dogecoin',
  },
  'cardano': {
    en: 'Cardano',
    es: 'Cardano',
    pt: 'Cardano',
  },

  // Hardware
  'hardware.manualMining': {
    en: 'Manual Mining',
    es: 'Minería Manual',
    pt: 'Mineração Manual',
  },
  'hardware.manualMiningDesc': {
    en: 'Mine blocks manually with your own hands',
    es: 'Mina bloques manualmente con tus propias manos',
    pt: 'Minere blocos manualmente com suas próprias mãos',
  },
  'hardware.basicCPU': {
    en: 'Basic CPU',
    es: 'CPU Básica',
    pt: 'CPU Básica',
  },
  'hardware.basicCPUDesc': {
    en: 'A basic computer processor for mining CryptoCoins',
    es: 'Un procesador básico para minar CryptoCoins',
    pt: 'Um processador básico para minerar CryptoCoins',
  },
  'hardware.advancedCPU': {
    en: 'Advanced CPU',
    es: 'CPU Avanzada',
    pt: 'CPU Avançada',
  },
  'hardware.advancedCPUDesc': {
    en: 'High-performance CPU mining',
    es: 'Minería de CPU de alto rendimiento',
    pt: 'Mineração de CPU de alto desempenho',
  },
  'hardware.basicGPU': {
    en: 'Basic GPU',
    es: 'GPU Básica',
    pt: 'GPU Básica',
  },
  'hardware.basicGPUDesc': {
    en: 'Entry-level GPU mining rig',
    es: 'Equipo de minería de GPU de nivel de entrada',
    pt: 'Equipamento de mineração de GPU de nível básico',
  },
  'hardware.advancedGPU': {
    en: 'Advanced GPU',
    es: 'GPU Avanzada',
    pt: 'GPU Avançada',
  },
  'hardware.advancedGPUDesc': {
    en: 'High-end GPU mining setup',
    es: 'Configuración de minería de GPU de alta gama',
    pt: 'Configuração de mineração de GPU de alta qualidade',
  },
  'hardware.asicGen1': {
    en: 'ASIC Gen 1',
    es: 'ASIC Gen 1',
    pt: 'ASIC Gen 1',
  },
  'hardware.asicGen1Desc': {
    en: 'First generation ASIC miner',
    es: 'Minero ASIC de primera generación',
    pt: 'Minerador ASIC de primeira geração',
  },
  'hardware.asicGen2': {
    en: 'ASIC Gen 2',
    es: 'ASIC Gen 2',
    pt: 'ASIC Gen 2',
  },
  'hardware.asicGen2Desc': {
    en: 'Second generation ASIC miner',
    es: 'Minero ASIC de segunda generación',
    pt: 'Minerador ASIC de segunda geração',
  },
  'hardware.asicGen3': {
    en: 'ASIC Gen 3',
    es: 'ASIC Gen 3',
    pt: 'ASIC Gen 3',
  },
  'hardware.asicGen3Desc': {
    en: 'Third generation ASIC miner',
    es: 'Minero ASIC de tercera generación',
    pt: 'Minerador ASIC de terceira geração',
  },

  // Upgrades
  'upgrade.clickPower': {
    en: 'Click Power',
    es: 'Poder de Clic',
    pt: 'Poder de Clique',
  },
  'upgrade.clickPower.description': {
    en: 'Increase CryptoCoins per click by 50%',
    es: 'Aumenta CryptoCoins por clic en 50%',
    pt: 'Aumenta CryptoCoins por clique em 50%',
  },
  'upgrade.cpuEfficiency': {
    en: 'CPU Efficiency',
    es: 'Eficiencia de CPU',
    pt: 'Eficiência da CPU',
  },
  'upgrade.cpuEfficiency.description': {
    en: 'Double CPU mining speed',
    es: 'Duplica la velocidad de minería de la CPU',
    pt: 'Dobra a velocidade de mineração da CPU',
  },
  'upgrade.gpuOptimization': {
    en: 'GPU Optimization',
    es: 'Optimización de GPU',
    pt: 'Otimização de GPU',
  },
  'upgrade.gpuOptimization.description': {
    en: 'Double GPU mining speed (Basic GPU and Advanced GPU)',
    es: 'Duplica la velocidad de minería de GPU (GPU Básica y GPU Avanzada)',
    pt: 'Dobra a velocidade de mineração de GPU (GPU Básica e GPU Avançada)',
  },
  'upgrade.asicOptimization': {
    en: 'ASIC Optimization',
    es: 'Optimización de ASIC',
    pt: 'Otimização de ASIC',
  },
  'upgrade.asicOptimization.description': {
    en: 'Double ASIC mining speed (All ASIC generations)',
    es: 'Duplica la velocidad de minería de ASIC (Todas las generaciones de ASIC)',
    pt: 'Dobra a velocidade de mineração de ASIC (Todas as gerações de ASIC)',
  },

  // UI Elements
  'ui.buy': {
    en: 'Buy',
    es: 'Comprar',
    pt: 'Comprar',
  },
  'ui.owned': {
    en: 'Owned',
    es: 'Poseídos',
    pt: 'Possuídos',
  },
  'ui.locked': {
    en: 'Locked',
    es: 'Bloqueado',
    pt: 'Bloqueado',
  },
  'ui.cost': {
    en: 'Cost',
    es: 'Costo',
    pt: 'Custo',
  },
  'ui.production': {
    en: 'Production',
    es: 'Producción',
    pt: 'Produção',
  },
  'ui.upgrades': {
    en: 'Upgrades',
    es: 'Mejoras',
    pt: 'Melhorias',
  },
  'ui.hardware': {
    en: 'Hardware',
    es: 'Hardware',
    pt: 'Hardware',
  },
  'ui.settings': {
    en: 'Settings',
    es: 'Configuración',
    pt: 'Configurações',
  },
  'ui.selectCurrency': {
    en: 'Select Currency',
    es: 'Seleccionar Moneda',
    pt: 'Selecionar Moeda',
  },
  'ui.currentPrice': {
    en: 'Current Price',
    es: 'Precio Actual',
    pt: 'Preço Atual',
  },
  'ui.priceChange': {
    en: 'Price Change',
    es: 'Cambio de Precio',
    pt: 'Mudança de Preço',
  },
  'ui.exchange': {
    en: 'Exchange',
    es: 'Intercambiar',
    pt: 'Trocar',
  },
  'ui.from': {
    en: 'From',
    es: 'De',
    pt: 'De',
  },
  'ui.to': {
    en: 'To',
    es: 'A',
    pt: 'Para',
  },
  'ui.amount': {
    en: 'Amount',
    es: 'Cantidad',
    pt: 'Quantidade',
  },
  'ui.youWillReceive': {
    en: 'You will receive',
    es: 'Recibirás',
    pt: 'Você receberá',
  },
  'ui.language': {
    en: 'Language',
    es: 'Idioma',
    pt: 'Idioma',
  },
  'ui.save': {
    en: 'Save',
    es: 'Guardar',
    pt: 'Salvar',
  },
  'ui.load': {
    en: 'Load',
    es: 'Cargar',
    pt: 'Carregar',
  },
  'ui.reset': {
    en: 'Reset',
    es: 'Reiniciar',
    pt: 'Reiniciar',
  },
  'ui.confirm': {
    en: 'Confirm',
    es: 'Confirmar',
    pt: 'Confirmar',
  },
  'ui.cancel': {
    en: 'Cancel',
    es: 'Cancelar',
    pt: 'Cancelar',
  },
  'ui.resetConfirm': {
    en: 'Are you sure you want to reset your progress? This action cannot be undone.',
    es: '¿Estás seguro de que quieres reiniciar tu progreso? Esta acción no se puede deshacer.',
    pt: 'Tem certeza de que deseja reiniciar seu progresso? Esta ação não pode ser desfeita.',
  },
};
