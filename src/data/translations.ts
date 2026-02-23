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
  'hardware.miningFarm': {
    en: 'Mining Farm',
    es: 'Granja de Minería',
    pt: 'Fazenda de Mineração',
  },
  'hardware.miningFarmDesc': {
    en: 'An industrial facility consuming an entire city\'s power grid. The newspapers call it "the crypto blackout".',
    es: 'Una instalación industrial que consume la red eléctrica de una ciudad entera. Los diarios hablan del "apagón cripto".',
    pt: 'Uma instalação industrial que consome a rede elétrica de uma cidade inteira. Os jornais falam do "apagão cripto".',
  },
  'hardware.quantumMiner': {
    en: 'Quantum Miner',
    es: 'Minero Cuántico',
    pt: 'Minerador Quântico',
  },
  'hardware.quantumMinerDesc': {
    en: 'Quantum computers exploiting superposition to explore millions of nonces at once. Physicists say it\'s impossible.',
    es: 'Computadoras cuánticas que explotan la superposición para explorar millones de nonces a la vez. Los físicos dicen que es imposible.',
    pt: 'Computadores quânticos explorando superposição para testar milhões de nonces ao mesmo tempo. Físicos dizem que é impossível.',
  },
  'hardware.supercomputer': {
    en: 'Supercomputer',
    es: 'Supercomputadora',
    pt: 'Supercomputador',
  },
  'hardware.supercomputerDesc': {
    en: 'A planetary megastructure converting Earth\'s core energy into raw compute power. The lights of cities are going out.',
    es: 'Una megaestructura planetaria que convierte la energía del núcleo terrestre en poder de cómputo. Las luces de las ciudades se están apagando.',
    pt: 'Uma megaestrutura planetária convertendo a energia do núcleo terrestre em poder computacional. As luzes das cidades estão se apagando.',
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

  // Prestige System
  'prestige.system': {
    en: 'Prestige System',
    es: 'Sistema de Prestigio',
    pt: 'Sistema de Prestígio',
  },
  'prestige.level': {
    en: 'Prestige Level',
    es: 'Nivel de Prestigio',
    pt: 'Nível de Prestígio',
  },
  'prestige.nextLevel': {
    en: 'Next Level',
    es: 'Próximo Nivel',
    pt: 'Próximo Nível',
  },
  'prestige.currentBonuses': {
    en: 'Current Bonuses',
    es: 'Bonificaciones Actuales',
    pt: 'Bônus Atuais',
  },
  'prestige.nextBonuses': {
    en: 'Next Bonuses',
    es: 'Próximas Bonificaciones',
    pt: 'Próximos Bônus',
  },
  'prestige.productionBoost': {
    en: 'Production Boost',
    es: 'Aumento de Producción',
    pt: 'Bônus de Produção',
  },
  'prestige.clickBoost': {
    en: 'Click Boost',
    es: 'Aumento de Click',
    pt: 'Bônus de Click',
  },
  'prestige.willKeep': {
    en: "What You'll Keep",
    es: 'Qué Conservarás',
    pt: 'O que Você Manterá',
  },
  'prestige.willLose': {
    en: "What You'll Lose",
    es: 'Qué Perderás',
    pt: 'O que Você Perderá',
  },
  'prestige.prestigeNow': {
    en: 'PRESTIGE NOW',
    es: 'HACER PRESTIGIO',
    pt: 'FAZER PRESTÍGIO',
  },
  'prestige.notAvailable': {
    en: 'Not Available',
    es: 'No Disponible',
    pt: 'Não Disponível',
  },
  'prestige.requireBlocks': {
    en: 'Mine 21M blocks to unlock',
    es: 'Necesitas minar 21M bloques',
    pt: 'Mine 21M blocos para desbloquear',
  },
  'prestige.confirmTitle': {
    en: 'Are you absolutely sure?',
    es: '¿Estás absolutamente seguro?',
    pt: 'Tem certeza absoluta?',
  },
  'prestige.confirmWarning': {
    en: 'You will lose ALL progress except Prestige bonuses',
    es: 'Perderás TODO el progreso excepto el nivel de prestigio',
    pt: 'Você perderá TODO o progresso exceto bônus de prestígio',
  },
  'prestige.typeToConfirm': {
    en: "Type 'PRESTIGE' to confirm",
    es: "Escribe 'PRESTIGE' para confirmar",
    pt: "Digite 'PRESTIGE' para confirmar",
  },
  'prestige.cancel': {
    en: 'Cancel',
    es: 'Cancelar',
    pt: 'Cancelar',
  },
  'prestige.confirmButton': {
    en: 'CONFIRM PRESTIGE',
    es: 'CONFIRMAR PRESTIGIO',
    pt: 'CONFIRMAR PRESTÍGIO',
  },
  'prestige.statsTab': {
    en: 'Stats',
    es: 'Estadísticas',
    pt: 'Estatísticas',
  },
  'prestige.historyTab': {
    en: 'History',
    es: 'Historial',
    pt: 'Histórico',
  },
  'prestige.badgesTab': {
    en: 'Badges',
    es: 'Insignias',
    pt: 'Medalhas',
  },
  'prestige.currentRun': {
    en: 'Current Run',
    es: 'Run Actual',
    pt: 'Run Atual',
  },
  'prestige.noHistory': {
    en: 'No prestige history yet',
    es: 'Aún no has hecho prestige',
    pt: 'Sem histórico de prestígio ainda',
  },

  // Badges
  'badge.firstPrestige': {
    en: 'First Prestige',
    es: 'Primer Prestigio',
    pt: 'Primeiro Prestígio',
  },
  'badge.firstPrestigeDesc': {
    en: 'Complete your first prestige',
    es: 'Completar el primer prestige',
    pt: 'Complete seu primeiro prestígio',
  },
  'badge.speedRunner': {
    en: 'Speed Runner',
    es: 'Corredor Veloz',
    pt: 'Corredor Veloz',
  },
  'badge.speedRunnerDesc': {
    en: 'Complete a run in under 2 hours',
    es: 'Completar un run en menos de 2 horas',
    pt: 'Complete um run em menos de 2 horas',
  },
  'badge.prestigeMaster': {
    en: 'Prestige Master',
    es: 'Maestro del Prestigio',
    pt: 'Mestre do Prestígio',
  },
  'badge.prestigeMasterDesc': {
    en: 'Reach Prestige Level 10',
    es: 'Alcanzar nivel 10 de prestigio',
    pt: 'Alcançar nível 10 de prestígio',
  },
  'badge.dedication': {
    en: 'Dedication',
    es: 'Dedicación',
    pt: 'Dedicação',
  },
  'badge.dedicationDesc': {
    en: 'Reach Prestige Level 50',
    es: 'Alcanzar nivel 50 de prestigio',
    pt: 'Alcançar nível 50 de prestígio',
  },
  'badge.infiniteLoop': {
    en: 'Infinite Loop',
    es: 'Bucle Infinito',
    pt: 'Loop Infinito',
  },
  'badge.infiniteLoopDesc': {
    en: 'Reach Prestige Level 100',
    es: 'Alcanzar nivel 100 de prestigio',
    pt: 'Alcançar nível 100 de prestígio',
  },
  'badge.theCollector': {
    en: 'The Collector',
    es: 'El Coleccionista',
    pt: 'O Colecionador',
  },
  'badge.theCollectorDesc': {
    en: 'Unlock all badges',
    es: 'Desbloquear todas las insignias',
    pt: 'Desbloquear todas as medalhas',
  },
  'badge.billionaire': {
    en: 'Billionaire',
    es: 'Billonario',
    pt: 'Bilionário',
  },
  'badge.billionaireDesc': {
    en: 'Earn $1,000,000,000 total',
    es: 'Ganar $1,000,000,000 en total',
    pt: 'Ganhar $1.000.000.000 no total',
  },

  // Achievement names
  'achievement.firstBlock': {
    en: 'First Block',
    es: 'Primer Bloque',
    pt: 'Primeiro Bloco',
  },
  'achievement.firstBlockDesc': {
    en: 'Mine your first block',
    es: 'Mina tu primer bloque',
    pt: 'Mine seu primeiro bloco',
  },
  'achievement.century': {
    en: 'Century',
    es: 'Centenario',
    pt: 'Centenário',
  },
  'achievement.centuryDesc': {
    en: 'Mine 100 blocks',
    es: 'Mina 100 bloques',
    pt: 'Mine 100 blocos',
  },
  'achievement.millennium': {
    en: 'Millennium',
    es: 'Milenio',
    pt: 'Milênio',
  },
  'achievement.millenniumDesc': {
    en: 'Mine 1,000 blocks',
    es: 'Mina 1.000 bloques',
    pt: 'Mine 1.000 blocos',
  },
  'achievement.epicMiner': {
    en: 'Epic Miner',
    es: 'Minero Épico',
    pt: 'Minerador Épico',
  },
  'achievement.epicMinerDesc': {
    en: 'Mine 100,000 blocks',
    es: 'Mina 100.000 bloques',
    pt: 'Mine 100.000 blocos',
  },
  'achievement.halvingSurvivor': {
    en: 'Halving Survivor',
    es: 'Sobreviviente del Halving',
    pt: 'Sobrevivente do Halving',
  },
  'achievement.halvingSurvivorDesc': {
    en: 'Experience your first halving event',
    es: 'Experimenta tu primer evento de halving',
    pt: 'Experiencie seu primeiro evento de halving',
  },
  'achievement.firstSteps': {
    en: 'First Steps',
    es: 'Primeros Pasos',
    pt: 'Primeiros Passos',
  },
  'achievement.firstStepsDesc': {
    en: 'Buy your first hardware unit',
    es: 'Compra tu primera unidad de hardware',
    pt: 'Compre sua primeira unidade de hardware',
  },
  'achievement.upgrader': {
    en: 'Upgrader',
    es: 'Mejorador',
    pt: 'Atualizador',
  },
  'achievement.upgraderDesc': {
    en: 'Own 10 units of any hardware',
    es: 'Posee 10 unidades de cualquier hardware',
    pt: 'Possua 10 unidades de qualquer hardware',
  },
  'achievement.hardwareCollector': {
    en: 'Hardware Collector',
    es: 'Coleccionista de Hardware',
    pt: 'Colecionador de Hardware',
  },
  'achievement.hardwareCollectorDesc': {
    en: 'Own at least 1 of every hardware type',
    es: 'Posee al menos 1 de cada tipo de hardware',
    pt: 'Possua pelo menos 1 de cada tipo de hardware',
  },
  'achievement.asicMaster': {
    en: 'ASIC Master',
    es: 'Maestro ASIC',
    pt: 'Mestre ASIC',
  },
  'achievement.asicMasterDesc': {
    en: 'Own 100 ASIC Gen 3 miners',
    es: 'Posee 100 mineros ASIC Gen 3',
    pt: 'Possua 100 mineradores ASIC Gen 3',
  },
  'achievement.firstSale': {
    en: 'First Sale',
    es: 'Primera Venta',
    pt: 'Primeira Venda',
  },
  'achievement.firstSaleDesc': {
    en: 'Sell CryptoCoins for real money',
    es: 'Vende CryptoCoins por dinero real',
    pt: 'Venda CryptoCoins por dinheiro real',
  },
  'achievement.millionaire': {
    en: 'Millionaire',
    es: 'Millonario',
    pt: 'Milionário',
  },
  'achievement.millionaireDesc': {
    en: 'Accumulate $1,000,000 real money',
    es: 'Acumula $1.000.000 en dinero real',
    pt: 'Acumule $1.000.000 em dinheiro real',
  },
  'achievement.marketTrader': {
    en: 'Market Trader',
    es: 'Comerciante del Mercado',
    pt: 'Trader do Mercado',
  },
  'achievement.marketTraderDesc': {
    en: 'Make 100 market transactions',
    es: 'Realiza 100 transacciones de mercado',
    pt: 'Faça 100 transações de mercado',
  },
  'achievement.rebirth': {
    en: 'Rebirth',
    es: 'Renacimiento',
    pt: 'Renascimento',
  },
  'achievement.rebirthDesc': {
    en: 'Complete your first prestige',
    es: 'Completa tu primer prestigio',
    pt: 'Complete seu primeiro prestígio',
  },
  'achievement.veteran': {
    en: 'Veteran',
    es: 'Veterano',
    pt: 'Veterano',
  },
  'achievement.veteranDesc': {
    en: 'Complete 10 prestiges',
    es: 'Completa 10 prestigios',
    pt: 'Complete 10 prestígios',
  },
  'achievement.eternal': {
    en: 'Eternal',
    es: 'Eterno',
    pt: 'Eterno',
  },
  'achievement.eternalDesc': {
    en: 'Complete 100 prestiges',
    es: 'Completa 100 prestigios',
    pt: 'Complete 100 prestígios',
  },
  'achievement.pizzaDay': {
    en: 'Pizza Day',
    es: 'Día de la Pizza',
    pt: 'Dia da Pizza',
  },
  'achievement.pizzaDayDesc': {
    en: 'A legendary Bitcoin moment...',
    es: 'Un momento legendario de Bitcoin...',
    pt: 'Um momento lendário do Bitcoin...',
  },
  'achievement.hodlMaster': {
    en: 'HODL Master',
    es: 'Maestro del HODL',
    pt: 'Mestre do HODL',
  },
  'achievement.hodlMasterDesc': {
    en: 'Patience is a virtue...',
    es: 'La paciencia es una virtud...',
    pt: 'A paciência é uma virtude...',
  },
  'achievement.speedRunnerEco': {
    en: 'Speed Runner',
    es: 'Corredor Veloz',
    pt: 'Corredor Veloz',
  },
  'achievement.speedRunnerEcoDesc': {
    en: 'A need for speed...',
    es: 'Una necesidad de velocidad...',
    pt: 'Uma necessidade de velocidade...',
  },

  // Achievement UI
  'achievement.unlocked': {
    en: 'Achievement Unlocked!',
    es: '¡Logro Desbloqueado!',
    pt: 'Conquista Desbloqueada!',
  },
  'achievement.complete': {
    en: '% Complete',
    es: '% Completado',
    pt: '% Completo',
  },
};
