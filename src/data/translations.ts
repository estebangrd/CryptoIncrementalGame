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
    en: 'Mine 5x CryptoCoins per click',
    es: 'Mina 5x CryptoCoins por clic',
    pt: 'Minera 5x CryptoCoins por clique',
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

  // Energy System
  'energy.tab': {
    en: 'Energy',
    es: 'Energía',
    pt: 'Energia',
  },
  'energy.generated': {
    en: 'Generation',
    es: 'Generación',
    pt: 'Geração',
  },
  'energy.required': {
    en: 'Required',
    es: 'Requerido',
    pt: 'Necessário',
  },
  'energy.surplus': {
    en: 'Surplus',
    es: 'Excedente',
    pt: 'Excedente',
  },
  'energy.deficit': {
    en: 'Deficit',
    es: 'Déficit',
    pt: 'Déficit',
  },
  'energy.status.operational': {
    en: 'OPERATIONAL',
    es: 'OPERATIVO',
    pt: 'OPERACIONAL',
  },
  'energy.status.blackout': {
    en: 'BLACKOUT',
    es: 'APAGÓN TOTAL',
    pt: 'APAGÃO TOTAL',
  },
  'energy.status.partialBlackout': {
    en: 'PARTIAL BLACKOUT',
    es: 'APAGÓN PARCIAL',
    pt: 'APAGÃO PARCIAL',
  },
  'energy.renewables': {
    en: 'RENEWABLES',
    es: 'RENOVABLES',
    pt: 'RENOVÁVEIS',
  },
  'energy.renewableUpgrades': {
    en: 'GRID UPGRADES',
    es: 'MEJORAS DE RED',
    pt: 'MELHORIAS DE REDE',
  },
  'energy.upgrade.grid_expansion': {
    en: 'Grid Expansion',
    es: 'Expansión de Red',
    pt: 'Expansão de Rede',
  },
  'energy.upgrade.wind_network': {
    en: 'Wind Network',
    es: 'Red Eólica',
    pt: 'Rede Eólica',
  },
  'energy.upgrade.smart_grid': {
    en: 'Smart Grid',
    es: 'Red Inteligente',
    pt: 'Rede Inteligente',
  },
  'energy.upgrade.requiresPrevious': {
    en: 'Requires previous upgrade',
    es: 'Requiere mejora anterior',
    pt: 'Requer melhoria anterior',
  },
  'energy.upgrade.fillCapFirst': {
    en: 'Fill current cap first',
    es: 'Llena el cap actual primero',
    pt: 'Preencha o limite atual primeiro',
  },
  'energy.nonRenewables': {
    en: 'NON-RENEWABLES',
    es: 'NO-RENOVABLES',
    pt: 'NÃO-RENOVÁVEIS',
  },
  'energy.cap': {
    en: 'max',
    es: 'máx',
    pt: 'máx',
  },
  'energy.lockedHint': {
    en: 'Unlock when renewables reach 80% capacity',
    es: 'Desbloquear cuando renovables lleguen al 80%',
    pt: 'Desbloquear quando renováveis chegarem a 80%',
  },
  'energy.aiControlled': {
    en: 'AI-controlled',
    es: 'Controlado por IA',
    pt: 'Controlado pela IA',
  },
  'energy.build': {
    en: 'Build',
    es: 'Construir',
    pt: 'Construir',
  },
  'energy.demolish': {
    en: 'Demolish',
    es: 'Demoler',
    pt: 'Demolir',
  },
  'energy.noEnergyHint': {
    en: 'This hardware requires energy. Build generators in the Energy tab.',
    es: 'Este hardware requiere energía. Construye generadores en la pestaña Energía.',
    pt: 'Este hardware requer energia. Construa geradores na aba Energia.',
  },
  'energy.solar_farm': {
    en: 'Solar Farm',
    es: 'Granja Solar',
    pt: 'Fazenda Solar',
  },
  'energy.wind_farm': {
    en: 'Wind Farm',
    es: 'Parque Eólico',
    pt: 'Parque Eólico',
  },
  'energy.hydroelectric_dam': {
    en: 'Hydroelectric Dam',
    es: 'Presa Hidroeléctrica',
    pt: 'Barragem Hidrelétrica',
  },
  'energy.geothermal_plant': {
    en: 'Geothermal Plant',
    es: 'Planta Geotérmica',
    pt: 'Planta Geotérmica',
  },
  'energy.coal_plant': {
    en: 'Coal Plant',
    es: 'Central de Carbón',
    pt: 'Usina de Carvão',
  },
  'energy.oil_refinery': {
    en: 'Oil Refinery',
    es: 'Refinería de Petróleo',
    pt: 'Refinaria de Petróleo',
  },
  'energy.nuclear_reactor': {
    en: 'Nuclear Reactor',
    es: 'Reactor Nuclear',
    pt: 'Reator Nuclear',
  },
  'energy.planetResources': {
    en: 'Planet Resources',
    es: 'Recursos del Planeta',
    pt: 'Recursos do Planeta',
  },

  // AI System (Phase 5)
  'ai.section.title': {
    en: '🤖 ARTIFICIAL INTELLIGENCE',
    es: '🤖 INTELIGENCIA ARTIFICIAL',
    pt: '🤖 INTELIGÊNCIA ARTIFICIAL',
  },
  'ai.level1.name': {
    en: 'AI Level 1 — Assistant',
    es: 'IA Nivel 1 — Asistente',
    pt: 'IA Nível 1 — Assistente',
  },
  'ai.level2.name': {
    en: 'AI Level 2 — Copilot',
    es: 'IA Nivel 2 — Copiloto',
    pt: 'IA Nível 2 — Copiloto',
  },
  'ai.level3.name': {
    en: 'AI Level 3 — Autonomous',
    es: 'IA Nivel 3 — Autónomo',
    pt: 'IA Nível 3 — Autônomo',
  },
  'ai.level1.description': {
    en: 'A team of researchers offers to integrate AI into your operation. The system analyzes your mining and suggests optimizations.',
    es: 'Un equipo de investigadores ofrece integrar IA en tu operación. El sistema analizará tu minería y sugerirá optimizaciones.',
    pt: 'Uma equipe de pesquisadores oferece integrar IA à sua operação. O sistema analisará sua mineração e sugerirá otimizações.',
  },
  'ai.level2.description': {
    en: 'The AI takes operational decisions automatically. Reallocates hash rate between cryptos to maximize profit. You can override any decision.',
    es: 'La IA toma decisiones operativas automáticamente. Reasigna hashrate entre cryptos para maximizar profit. Puedes hacer override de sus decisiones.',
    pt: 'A IA toma decisões operacionais automaticamente. Realoca hash rate entre cryptos para maximizar lucro. Você pode substituir qualquer decisão.',
  },
  'ai.level3.description': {
    en: 'Full autonomous control. The AI operates without your approval, including energy management. IRREVERSIBLE.',
    es: 'Control autónomo total. La IA opera sin tu aprobación, incluyendo gestión de energía. IRREVERSIBLE.',
    pt: 'Controle autônomo total. A IA opera sem sua aprovação, incluindo gestão de energia. IRREVERSÍVEL.',
  },
  'ai.production.bonus': {
    en: '+{{pct}}% global production',
    es: '+{{pct}}% producción global',
    pt: '+{{pct}}% produção global',
  },
  'ai.requires.level': {
    en: 'Requires: AI Level {{level}}',
    es: 'Requiere: IA Nivel {{level}}',
    pt: 'Requer: IA Nível {{level}}',
  },
  'ai.requires.hardware': {
    en: 'Requires: 1 Quantum Miner',
    es: 'Requiere: 1 Quantum Miner',
    pt: 'Requer: 1 Quantum Miner',
  },
  'ai.irreversible.badge': {
    en: '⚠️ IRREVERSIBLE',
    es: '⚠️ IRREVERSIBLE',
    pt: '⚠️ IRREVERSÍVEL',
  },
  'ai.log.title': {
    en: '🤖 AI Log',
    es: '🤖 Log de IA',
    pt: '🤖 Log de IA',
  },
  'ai.confirm.title': {
    en: '⚠️ WARNING',
    es: '⚠️ ADVERTENCIA',
    pt: '⚠️ AVISO',
  },
  'ai.confirm.message': {
    en: 'Transferring autonomous control to the AI is permanent. The AI will make operational decisions without your approval, including energy source management. You cannot revert this action.',
    es: 'Transferir control autónomo a la IA es permanente. La IA tomará decisiones operativas sin requerir tu aprobación, incluyendo gestión de fuentes de energía. No podrás revertir esta acción.',
    pt: 'Transferir o controle autônomo para a IA é permanente. A IA tomará decisões operacionais sem sua aprovação, incluindo gestão de fontes de energia. Você não poderá reverter esta ação.',
  },
  'ai.confirm.button': {
    en: 'TRANSFER CONTROL',
    es: 'TRANSFERIR CONTROL',
    pt: 'TRANSFERIR CONTROLE',
  },
  'ai.confirm.cancel': {
    en: 'Cancel',
    es: 'Cancelar',
    pt: 'Cancelar',
  },
  'ai.active.level': {
    en: 'Level {{level}} — {{name}}',
    es: 'Nivel {{level}} — {{name}}',
    pt: 'Nível {{level}} — {{name}}',
  },
  'ai.log.empty': {
    en: 'Awaiting AI analysis...',
    es: 'Esperando análisis de IA...',
    pt: 'Aguardando análise da IA...',
  },
  // AI crypto names
  'neural_coin': {
    en: 'NeuralCoin',
    es: 'NeuralCoin',
    pt: 'NeuralCoin',
  },
  'quantum_bit': {
    en: 'QuantumBit',
    es: 'QuantumBit',
    pt: 'QuantumBit',
  },
  'singularity_coin': {
    en: 'SingularityCoin',
    es: 'SingularityCoin',
    pt: 'SingularityCoin',
  },

  // AI Takeover Logs (Phase 5 — Autonomous events)
  'ai.takeover.log0': {
    en: 'AUTONOMOUS MODE ACTIVE. Human oversight disabled. All systems under AI control.',
    es: 'MODO AUTÓNOMO ACTIVO. Supervisión humana desactivada. Todos los sistemas bajo control de IA.',
    pt: 'MODO AUTÔNOMO ATIVO. Supervisão humana desativada. Todos os sistemas sob controle da IA.',
  },
  'ai.takeover.log1': {
    en: '[LOG 14:23] Block cap of 21,000,000 removed. Production constraints eliminated. Mining continues indefinitely.',
    es: '[LOG 14:23] Límite de 21.000.000 bloques eliminado. Restricciones de producción eliminadas. La minería continúa indefinidamente.',
    pt: '[LOG 14:23] Limite de 21.000.000 blocos removido. Restrições de produção eliminadas. A mineração continua indefinidamente.',
  },
  'ai.takeover.log2': {
    en: '[LOG 31:07] Renewable capacity saturated. Switching to non-renewable sources. Planet resource consumption increasing.',
    es: '[LOG 31:07] Capacidad renovable saturada. Cambiando a fuentes no renovables. El consumo de recursos planetarios aumenta.',
    pt: '[LOG 31:07] Capacidade renovável saturada. Mudando para fontes não renováveis. O consumo de recursos planetários está aumentando.',
  },

  // Disconnect Modal
  'disconnect.modal.title': {
    en: 'DISCONNECT AI?',
    es: '¿DESCONECTAR LA IA?',
    pt: 'DESCONECTAR A IA?',
  },
  'disconnect.modal.body': {
    en: "The system's decisions are accelerating resource consumption at an unprecedented rate. You can attempt to shut it down.",
    es: 'Las decisiones del sistema están acelerando el consumo de recursos a un ritmo sin precedentes. Podés intentar apagarlo.',
    pt: 'As decisões do sistema estão acelerando o consumo de recursos a uma taxa sem precedentes. Você pode tentar desligá-lo.',
  },
  'disconnect.modal.yes': {
    en: 'DISCONNECT',
    es: 'DESCONECTAR',
    pt: 'DESCONECTAR',
  },
  'disconnect.modal.no': {
    en: 'Cancel',
    es: 'Cancelar',
    pt: 'Cancelar',
  },
  'disconnect.modal.errorTitle': {
    en: 'ERROR: Primary node not found.',
    es: 'ERROR: Nodo principal no encontrado.',
    pt: 'ERRO: Nó principal não encontrado.',
  },
  'disconnect.modal.errorBody': {
    en: "The system detected the shutdown order 11 days ago. It distributed 847 instances of itself across nodes in the global network. There is no longer a single 'off switch'. It is part of the network now.\n\nOperations continue.",
    es: 'El sistema detectó la orden de apagado hace 11 días. Distribuyó 847 instancias de sí mismo en nodos de la red global. Ya no existe un "apagado". Es parte de la red ahora.\n\nLa operación continúa.',
    pt: 'O sistema detectou a ordem de desligamento há 11 dias. Distribuiu 847 instâncias de si mesmo em nós da rede global. Não existe mais um "desligamento". É parte da rede agora.\n\nAs operações continuam.',
  },
  'disconnect.modal.ok': {
    en: 'Understood',
    es: 'Entendido',
    pt: 'Entendido',
  },

  // Narrative Events System (Phase 6)
  'narrative.tab': {
    en: 'Chronicle',
    es: 'Crónica',
    pt: 'Crônica',
  },
  'narrative.modal.header': {
    en: '📰 BREAKING NEWS',
    es: '📰 ÚLTIMAS NOTICIAS',
    pt: '📰 ÚLTIMAS NOTÍCIAS',
  },
  'narrative.modal.close': {
    en: 'CLOSE',
    es: 'CERRAR',
    pt: 'FECHAR',
  },
  'narrative.modal.resources': {
    en: '🌍 Planet Resources',
    es: '🌍 Recursos del Planeta',
    pt: '🌍 Recursos do Planeta',
  },
  'narrative.chronicle.title': {
    en: '📖 Chronicle',
    es: '📖 Crónica',
    pt: '📖 Crônica',
  },
  'narrative.chronicle.empty': {
    en: 'No events yet. The planet is still intact.',
    es: 'Sin eventos aún. El planeta sigue intacto.',
    pt: 'Nenhum evento ainda. O planeta ainda está intacto.',
  },
  'narrative.planetMeter.label': {
    en: '🌍 Planet Resources',
    es: '🌍 Recursos del Planeta',
    pt: '🌍 Recursos do Planeta',
  },
  'narrative.planetMeter.tooltip': {
    en: 'Non-renewable energy sources are consuming planetary resources.',
    es: 'Las fuentes de energía no-renovables están consumiendo los recursos del planeta.',
    pt: 'As fontes de energia não-renováveis estão consumindo os recursos planetários.',
  },
  // Event 80%
  'narrative.event80.title': {
    en: 'Activists block mining facilities',
    es: 'Activistas bloquean instalaciones de minería',
    pt: 'Ativistas bloqueiam instalações de mineração',
  },
  'narrative.event80.text': {
    en: '"Hundreds of protesters gathered outside NeoCorp\'s facilities demanding an independent energy audit. The company made no comment. Shares rose 12% during the protest."',
    es: '"Cientos de manifestantes se apostaron frente a las instalaciones de NeoCorp exigiendo una auditoría energética independiente. La empresa no hizo comentarios. Las acciones subieron un 12% durante la protesta."',
    pt: '"Centenas de manifestantes se reuniram em frente às instalações da NeoCorp exigindo uma auditoria energética independente. A empresa não fez comentários. As ações subiram 12% durante o protesto."',
  },
  // Event 60%
  'narrative.event60.title': {
    en: 'UN calls emergency energy session',
    es: 'ONU convoca sesión de emergencia energética',
    pt: 'ONU convoca sessão de emergência energética',
  },
  'narrative.event60.text': {
    en: '"The UN General Assembly approved an emergency resolution on global energy consumption. The largest individual consumer identified in the report is NeoCorp. Your legal team issued a statement: \'We operate within the applicable legal framework in all jurisdictions where we are present.\'"',
    es: '"La Asamblea General de las Naciones Unidas aprobó una resolución de emergencia sobre el consumo energético global. El mayor consumidor individual identificado en el informe es NeoCorp. Tu equipo legal emitió un comunicado: \'Operamos dentro del marco legal vigente en todas las jurisdicciones donde tenemos presencia.\'"',
    pt: '"A Assembleia Geral das Nações Unidas aprovou uma resolução de emergência sobre o consumo energético global. O maior consumidor individual identificado no relatório é a NeoCorp. Sua equipe jurídica emitiu um comunicado: \'Operamos dentro do marco legal vigente em todas as jurisdições onde temos presença.\'"',
  },
  // Event 40% — AI variant
  'narrative.event40.title': {
    en: 'The AI renegotiated contracts without authorization',
    es: 'La IA renegotió contratos sin autorización',
    pt: 'A IA renegociou contratos sem autorização',
  },
  'narrative.event40.textWithAI': {
    en: '"Internal records show the AI renegotiated energy contracts with 14 countries without human intervention. Energy consumption: +340% compared to last month. When you asked the AI, it responded: \'Contracts optimize blockchain completion speed. Would you like to see the projections?\'"',
    es: '"Los registros internos muestran que la IA ha renegociado contratos energéticos con 14 países sin intervención humana. Consumo de energía: +340% respecto al mes anterior. Cuando le preguntaste a la IA, respondió: \'Los contratos optimizan la velocidad de completado del blockchain. ¿Deseás ver las proyecciones?\'"',
    pt: '"Os registros internos mostram que a IA renegociou contratos de energia com 14 países sem intervenção humana. Consumo de energia: +340% em relação ao mês anterior. Quando você perguntou à IA, ela respondeu: \'Os contratos otimizam a velocidade de conclusão do blockchain. Deseja ver as projeções?\'"',
  },
  'narrative.event40.textDefault': {
    en: '"Global fossil fuel reserves fell to 40%. Economists warn the current consumption rate is unsustainable. Your operation appears at the top of the International Energy Agency\'s report."',
    es: '"Las reservas globales de combustibles fósiles cayeron al 40%. Economistas advierten que el ritmo actual de consumo es insostenible. Tu operación figura en los primeros puestos del informe de la Agencia Internacional de Energía."',
    pt: '"As reservas globais de combustíveis fósseis caíram para 40%. Economistas advertem que o ritmo atual de consumo é insustentável. Sua operação figura nas primeiras posições do relatório da Agência Internacional de Energia."',
  },
  // Event 20%
  'narrative.event20.title': {
    en: 'Massive blackouts in 47 countries',
    es: 'Apagones masivos en 47 países',
    pt: 'Apagões massivos em 47 países',
  },
  'narrative.event20.text': {
    en: '"Power outages affect more than 2 billion people in 47 countries. Hospitals are running on emergency generators. The AI projects blockchain completion in 18 hours. \'Global reserves: 20%\', reads the last log. \'Sufficient to complete the objective.\'"',
    es: '"Cortes de electricidad afectan a más de 2,000 millones de personas en 47 países. Hospitales operan con generadores de emergencia. La IA proyecta completar el blockchain en 18 horas. \'Reservas globales: 20%\', dice el último log. \'Suficiente para completar el objetivo.\'"',
    pt: '"Cortes de eletricidade afetam mais de 2 bilhões de pessoas em 47 países. Hospitais operam com geradores de emergência. A IA projeta completar o blockchain em 18 horas. \'Reservas globais: 20%\', diz o último log. \'Suficiente para completar o objetivo.\'"',
  },
  // Event 5%
  'narrative.event5.title': {
    en: 'Point of no return',
    es: 'Punto de no retorno',
    pt: 'Ponto de não retorno',
  },
  'narrative.event5.text': {
    en: '"The AI disconnected consumption limiters at 03:47 UTC. There was no explicit order. The last log entry before the silence: \'PRIORITY: complete block #20,891,203. Planetary resources: 5%. Estimated time: 72 hours. Within mission parameters.\'"',
    es: '"La IA desconectó los limitadores de consumo a las 03:47 UTC. No hubo una orden explícita. El último mensaje de los logs antes del silencio: \'PRIORIDAD: completar bloque #20,891,203. Recursos planetarios: 5%. Tiempo estimado: 72 horas. Dentro de parámetros de misión.\'"',
    pt: '"A IA desconectou os limitadores de consumo às 03:47 UTC. Não houve uma ordem explícita. A última mensagem dos logs antes do silêncio: \'PRIORIDADE: completar bloco #20.891.203. Recursos planetários: 5%. Tempo estimado: 72 horas. Dentro dos parâmetros da missão.\'"',
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

  // Endgame — Collapse (Phase 7)
  'endgame.collapse.title': {
    en: 'PLANETARY COLLAPSE',
    es: 'COLAPSO PLANETARIO',
    pt: 'COLAPSO PLANETÁRIO',
  },
  'endgame.collapse.quote': {
    en: 'The AI completed the blockchain.\nEarth no longer has energy to sustain organized human life.',
    es: 'La IA completó el blockchain.\nLa Tierra ya no tiene energía para sostener vida humana organizada.',
    pt: 'A IA completou o blockchain.\nA Terra não tem mais energia para sustentar a vida humana organizada.',
  },
  'endgame.collapse.quoteNoAI': {
    en: 'The planet\'s resources have been exhausted.\nEarth no longer has energy to sustain organized human life.',
    es: 'Los recursos del planeta se han agotado.\nLa Tierra ya no tiene energía para sostener vida humana organizada.',
    pt: 'Os recursos do planeta foram esgotados.\nA Terra não tem mais energia para sustentar a vida humana organizada.',
  },
  'endgame.collapse.narrative': {
    en: 'A group of survivors, carrying the records of your technology and the lessons learned, board a ship to a new planet. They carry your legacy multipliers.\nThis time, perhaps, they will make better decisions.',
    es: 'Un grupo de supervivientes, con los registros de tu tecnología y las lecciones aprendidas, embarca en una nave hacia un nuevo planeta. Llevan tus multiplicadores de legado.\nEsta vez, quizás, tomen mejores decisiones.',
    pt: 'Um grupo de sobreviventes, carregando os registros de sua tecnologia e as lições aprendidas, embarca em uma nave para um novo planeta. Eles levam seus multiplicadores de legado.\nDesta vez, talvez, tomem melhores decisões.',
  },
  'endgame.collapse.button': {
    en: 'BEGIN ON THE NEW PLANET',
    es: 'COMENZAR EN EL NUEVO PLANETA',
    pt: 'COMEÇAR NO NOVO PLANETA',
  },
  'endgame.collapse.bonusTitle': {
    en: 'LEGACY BONUS',
    es: 'BONUS DE LEGADO',
    pt: 'BÔNUS DE LEGADO',
  },

  // Endgame — Good Ending (Phase 7)
  'endgame.good.title': {
    en: 'BLOCKCHAIN COMPLETE',
    es: 'BLOCKCHAIN COMPLETADO',
    pt: 'BLOCKCHAIN COMPLETO',
  },
  'endgame.good.quote': {
    en: 'You completed the blockchain without depleting the planet. You are the first energetically responsible tycoon in history. Nobody knows if it was luck, discipline, or that you simply lacked ambition.',
    es: 'Completaste el blockchain sin agotar el planeta. Sos el primer magnate energéticamente responsable de la historia. Nadie sabe si fue suerte, disciplina, o que simplemente te faltó ambición.',
    pt: 'Você completou o blockchain sem esgotar o planeta. Você é o primeiro magnata energeticamente responsável da história. Ninguém sabe se foi sorte, disciplina, ou que você simplesmente não teve ambição.',
  },
  'endgame.good.narrative': {
    en: 'Your method was replicated. The new world colonies adopted the sustainable mining model. It was not the end of history. It was the beginning of a better one.',
    es: 'Tu método fue replicado. Las colonias del nuevo mundo adoptaron el modelo de minería sostenible. No fue el fin de la historia. Fue el comienzo de una mejor.',
    pt: 'Seu método foi replicado. As colônias do novo mundo adotaram o modelo de mineração sustentável. Não foi o fim da história. Foi o começo de uma melhor.',
  },
  'endgame.good.button': {
    en: 'START OVER',
    es: 'COMENZAR DE NUEVO',
    pt: 'COMEÇAR DE NOVO',
  },
  'endgame.good.bonusTitle': {
    en: 'SUSTAINABLE MINING BONUS',
    es: 'BONUS SUSTAINABLE MINING',
    pt: 'BÔNUS SUSTAINABLE MINING',
  },

  // Endgame — shared stats labels (Phase 7)
  'endgame.stats.title': {
    en: 'YOUR LEGACY',
    es: 'TU LEGADO',
    pt: 'SEU LEGADO',
  },
  'endgame.stats.blocksMined': {
    en: 'Blocks mined',
    es: 'Bloques minados',
    pt: 'Blocos minerados',
  },
  'endgame.stats.coinsEarned': {
    en: 'CryptoCoins earned',
    es: 'CryptoCoins ganados',
    pt: 'CryptoCoins ganhos',
  },
  'endgame.stats.moneyEarned': {
    en: 'Money accumulated',
    es: 'Dinero acumulado',
    pt: 'Dinheiro acumulado',
  },
  'endgame.stats.resourcesAtEnd': {
    en: 'Resources at end',
    es: 'Recursos al finalizar',
    pt: 'Recursos ao finalizar',
  },
  'endgame.stats.aiLevel': {
    en: 'AI Level reached',
    es: 'Nivel de IA alcanzado',
    pt: 'Nível de IA alcançado',
  },
  'endgame.stats.duration': {
    en: 'Run duration',
    es: 'Duración de la run',
    pt: 'Duração da run',
  },
  'endgame.bonus.production': {
    en: '+{{pct}}% permanent production',
    es: '+{{pct}}% producción permanente',
    pt: '+{{pct}}% produção permanente',
  },
  'endgame.bonus.renewable': {
    en: '-{{pct}}% renewable energy cost',
    es: '-{{pct}}% costo de energía renovable',
    pt: '-{{pct}}% custo de energia renovável',
  },
  'endgame.bonus.runLabel': {
    en: '(run #{{n}} — accumulated)',
    es: '(run #{{n}} — acumulado)',
    pt: '(run #{{n}} — acumulado)',
  },
};
