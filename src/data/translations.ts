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
  'hardware.basicCPU': {
    en: 'Basic CPU',
    es: 'CPU Básica',
    pt: 'CPU Básica',
  },
  'hardware.basicCPU.description': {
    en: 'A basic computer processor for mining CryptoCoins',
    es: 'Un procesador básico para minar CryptoCoins',
    pt: 'Um processador básico para minerar CryptoCoins',
  },
  'hardware.graphicsCard': {
    en: 'Graphics Card',
    es: 'Tarjeta Gráfica',
    pt: 'Placa de Vídeo',
  },
  'hardware.graphicsCard.description': {
    en: 'A powerful graphics card for faster mining',
    es: 'Una tarjeta gráfica potente para minería más rápida',
    pt: 'Uma placa de vídeo potente para mineração mais rápida',
  },
  'hardware.miningRig': {
    en: 'Mining Rig',
    es: 'Rig de Minería',
    pt: 'Rig de Mineração',
  },
  'hardware.miningRig.description': {
    en: 'A dedicated mining setup with multiple GPUs',
    es: 'Una configuración dedicada de minería con múltiples GPUs',
    pt: 'Uma configuração dedicada de mineração com múltiplas GPUs',
  },
  'hardware.dataCenter': {
    en: 'Data Center',
    es: 'Centro de Datos',
    pt: 'Centro de Dados',
  },
  'hardware.dataCenter.description': {
    en: 'A massive data center for industrial-scale mining',
    es: 'Un centro de datos masivo para minería a escala industrial',
    pt: 'Um centro de dados massivo para mineração em escala industrial',
  },
  'hardware.asicMiner': {
    en: 'ASIC Miner',
    es: 'Minero ASIC',
    pt: 'Minerador ASIC',
  },
  'hardware.asicMiner.description': {
    en: 'Application-Specific Integrated Circuit for maximum efficiency',
    es: 'Circuito integrado específico para máxima eficiencia',
    pt: 'Circuito integrado específico para máxima eficiência',
  },
  'hardware.gpuFarm': {
    en: 'GPU Farm',
    es: 'Granja de GPUs',
    pt: 'Fazenda de GPUs',
  },
  'hardware.gpuFarm.description': {
    en: 'A farm of high-end graphics cards',
    es: 'Una granja de tarjetas gráficas de alta gama',
    pt: 'Uma fazenda de placas de vídeo de alta qualidade',
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
    en: 'Double GPU mining speed',
    es: 'Duplica la velocidad de minería de la GPU',
    pt: 'Dobra a velocidade de mineração da GPU',
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
