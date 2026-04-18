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
  'game.stats.production': {
    en: 'Prod/s',
    es: 'Prod/s',
    pt: 'Prod/s',
  },
  'game.stats.hashRate': {
    en: 'Hash Rate',
    es: 'Hash Rate',
    pt: 'Hash Rate',
  },
  'game.stats.power': {
    en: 'Power',
    es: 'Poder',
    pt: 'Energia',
  },
  'game.stats.net': {
    en: 'Net/s',
    es: 'Neto/s',
    pt: 'Líquido/s',
  },
  'game.stats.total': {
    en: 'Total CC',
    es: 'Total CC',
    pt: 'Total CC',
  },
  'game.stats.blocks': {
    en: 'Blocks',
    es: 'Bloques',
    pt: 'Blocos',
  },
  'game.stats.money': {
    en: 'Cash',
    es: 'Efectivo',
    pt: 'Dinheiro',
  },
  'game.stats.totalEarned': {
    en: 'Earned',
    es: 'Ganado',
    pt: 'Ganho',
  },

  // Cryptocurrencies
  'cryptocoin': {
    en: 'CryptoCoin',
    es: 'CryptoCoin',
    pt: 'CryptoCoin',
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

  // AI-exclusive hardware
  'hardware.neuralCluster': {
    en: 'Neural Cluster',
    es: 'Cluster Neuronal',
    pt: 'Cluster Neural',
  },
  'hardware.neuralClusterDesc': {
    en: 'AI-designed neural processing array. Technology beyond human comprehension.',
    es: 'Matriz de procesamiento neuronal diseñada por IA. Tecnología más allá de la comprensión humana.',
    pt: 'Matriz de processamento neural projetada por IA. Tecnologia além da compreensão humana.',
  },
  'hardware.singularityCore': {
    en: 'Singularity Core',
    es: 'Núcleo de Singularidad',
    pt: 'Núcleo de Singularidade',
  },
  'hardware.singularityCoreDesc': {
    en: 'AI-designed singularity processing core. Reality bends around its calculations.',
    es: 'Núcleo de procesamiento de singularidad diseñado por IA. La realidad se curva alrededor de sus cálculos.',
    pt: 'Núcleo de processamento de singularidade projetado por IA. A realidade se curva ao redor de seus cálculos.',
  },

  // Hardware toggle / profitability
  'hardware.toggleOff': {
    en: 'OFF',
    es: 'APAGADO',
    pt: 'DESLIGADO',
  },
  'hardware.unprofitable': {
    en: 'UNPROFITABLE',
    es: 'NO RENTABLE',
    pt: 'NÃO LUCRATIVO',
  },
  'hardware.unprofitableLosing': {
    en: 'LOSING',
    es: 'PERDIENDO',
    pt: 'PERDENDO',
  },

  // Upgrades
  'upgrade.clickPower': {
    en: 'Click Power',
    es: 'Poder de Clic',
    pt: 'Poder de Clique',
  },
  'upgrade.clickPower.description': {
    en: 'Mine 2x CryptoCoins per click',
    es: 'Mina 2x CryptoCoins por clic',
    pt: 'Minera 2x CryptoCoins por clique',
  },
  'upgrade.clickMastery': {
    en: 'Hash Injection',
    es: 'Inyección de Hash',
    pt: 'Injeção de Hash',
  },
  'upgrade.clickMastery.description': {
    en: 'Mine 4x CryptoCoins per click',
    es: 'Mina 4x CryptoCoins por clic',
    pt: 'Minera 4x CryptoCoins por clique',
  },
  'upgrade.clickLegend': {
    en: 'Click Legend',
    es: 'Leyenda del Clic',
    pt: 'Lenda do Clique',
  },
  'upgrade.clickLegend.description': {
    en: 'Mine 8x CryptoCoins per click',
    es: 'Mina 8x CryptoCoins por clic',
    pt: 'Minera 8x CryptoCoins por clique',
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
    es: 'Duplica la velocidad de minería de GPU',
    pt: 'Dobra a velocidade de mineração de GPU',
  },
  'upgrade.asicOptimization': {
    en: 'ASIC Optimization',
    es: 'Optimización de ASIC',
    pt: 'Otimização de ASIC',
  },
  'upgrade.asicOptimization.description': {
    en: 'Double ASIC mining speed',
    es: 'Duplica la velocidad de minería de ASIC',
    pt: 'Dobra a velocidade de mineração de ASIC',
  },
  'upgrade.miningFarmEfficiency': {
    en: 'Mining Farm Efficiency',
    es: 'Eficiencia de Mining Farm',
    pt: 'Eficiência de Mining Farm',
  },
  'upgrade.miningFarmEfficiency.description': {
    en: 'Double Mining Farm production speed',
    es: 'Duplica la velocidad de producción de la Mining Farm',
    pt: 'Dobra a velocidade de produção da Mining Farm',
  },
  'upgrade.quantumCoherence': {
    en: 'Quantum Coherence',
    es: 'Coherencia Cuántica',
    pt: 'Coerência Quântica',
  },
  'upgrade.quantumCoherence.description': {
    en: 'Double Quantum Miner production speed',
    es: 'Duplica la velocidad de producción del Quantum Miner',
    pt: 'Dobra a velocidade de produção do Quantum Miner',
  },
  'upgrade.supercomputerOverclock': {
    en: 'Supercomputer Overclock',
    es: 'Overclock de Supercomputadora',
    pt: 'Overclock de Supercomputador',
  },
  'upgrade.supercomputerOverclock.description': {
    en: 'Double Supercomputer production speed',
    es: 'Duplica la velocidad de producción de la Supercomputadora',
    pt: 'Dobra a velocidade de produção do Supercomputador',
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
  'ai.chronicle.title': {
    en: 'AI Activity Log',
    es: 'Registro de Actividad IA',
    pt: 'Registro de Atividade IA',
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

  // Endgame — Human Collapse (Phase 7)
  'endgame.humanCollapse.title': {
    en: 'PLANETARY\nCOLLAPSE',
    es: 'COLAPSO\nPLANETARIO',
    pt: 'COLAPSO\nPLANETÁRIO',
  },
  'endgame.humanCollapse.blame': {
    en: 'There was no AI. No algorithm to blame.\nYou chose every megawatt.\nEarth has no energy to sustain organized life. You knew. You kept going.',
    es: 'No fue la IA. No hubo algoritmo que culpar.\nCada megawatt lo elegiste vos.\nLa Tierra no tiene energía para sostener vida organizada. Lo sabías. Igual seguiste.',
    pt: 'Não foi a IA. Não houve algoritmo para culpar.\nVocê escolheu cada megawatt.\nA Terra não tem energia para sustentar vida organizada. Você sabia. Mesmo assim continuou.',
  },
  'endgame.humanCollapse.blameStrong': {
    en: 'You chose every megawatt.',
    es: 'Cada megawatt lo elegiste vos.',
    pt: 'Você escolheu cada megawatt.',
  },
  'endgame.humanCollapse.narrative': {
    en: 'A group of survivors found your records. They learned what not to do. They boarded a ship to a new planet carrying that lesson — the most expensive of all.',
    es: 'Un grupo de supervivientes encontró tus registros. Aprendieron lo que no hay que hacer. Embarcaron hacia un nuevo planeta llevando esa lección — la más cara de todas.',
    pt: 'Um grupo de sobreviventes encontrou seus registros. Aprenderam o que não fazer. Embarcaram para um novo planeta levando essa lição — a mais cara de todas.',
  },
  'endgame.humanCollapse.button': {
    en: 'BEGIN ON THE NEW PLANET',
    es: 'COMENZAR EN EL NUEVO PLANETA',
    pt: 'COMEÇAR NO NOVO PLANETA',
  },
  'endgame.humanCollapse.bonusTitle': {
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

  // Shop — No Ads tab
  'shop.noAds.title': {
    en: 'Permanently remove ads',
    es: 'Eliminá los ads permanentemente',
    pt: 'Remova os anúncios permanentemente',
  },
  'shop.noAds.perk.noBanners': {
    en: 'No banner ads',
    es: 'Sin banner ads',
    pt: 'Sem banner de anúncios',
  },
  'shop.noAds.perk.noInterstitials': {
    en: 'No interstitial ads',
    es: 'Sin interstitial ads',
    pt: 'Sem anúncios intersticiais',
  },
  'shop.noAds.perk.rewardedAvailable': {
    en: 'Rewarded ads still available (give you CC)',
    es: 'Rewarded ads siguen disponibles (te dan CC)',
    pt: 'Anúncios recompensados ainda disponíveis (te dão CC)',
  },
  'shop.noAds.perk.permanent': {
    en: 'Permanent — survives prestige resets',
    es: 'Permanente — survives prestige resets',
    pt: 'Permanente — sobrevive ao prestígio',
  },
  'shop.noAds.owned': {
    en: '✓ AD-FREE ACTIVE',
    es: '✓ AD-FREE ACTIVO',
    pt: '✓ SEM ANÚNCIOS ATIVO',
  },
  'shop.noAds.flashSale': {
    en: 'Flash Sale',
    es: 'Oferta Flash',
    pt: 'Oferta Relâmpago',
  },
  'shop.noAds.expiresIn': {
    en: 'EXPIRES IN',
    es: 'EXPIRA EN',
    pt: 'EXPIRA EM',
  },
  'shop.noAds.save': {
    en: 'SAVE',
    es: 'AHORRÁS',
    pt: 'ECONOMIZE',
  },
  'shop.noAds.buyBtn': {
    en: '🏷 REMOVE ADS',
    es: '🏷 ELIMINAR ADS',
    pt: '🏷 REMOVER ADS',
  },
  'shop.noAds.buyBtnNormal': {
    en: '🚫 REMOVE ADS',
    es: '🚫 ELIMINAR ADS',
    pt: '🚫 REMOVER ADS',
  },
  'shop.noAds.unlockHeader': {
    en: 'Or unlock it by purchasing',
    es: 'O desbloquealo comprando',
    pt: 'Ou desbloqueie comprando',
  },
  'shop.noAds.unlockTitle': {
    en: 'Unlock chance with each IAP purchase',
    es: 'Chance de desbloqueo con cada compra IAP',
    pt: 'Chance de desbloqueio a cada compra IAP',
  },
  'shop.noAds.purchase1st': {
    en: '1st purchase',
    es: '1ra compra',
    pt: '1ª compra',
  },
  'shop.noAds.purchase2nd': {
    en: '2nd purchase',
    es: '2da compra',
    pt: '2ª compra',
  },
  'shop.noAds.purchase3rd': {
    en: '3rd purchase',
    es: '3ra compra',
    pt: '3ª compra',
  },
  'shop.noAds.chance': {
    en: 'chance',
    es: 'chance',
    pt: 'chance',
  },
  'shop.noAds.guaranteed': {
    en: 'guaranteed',
    es: 'garantizado',
    pt: 'garantido',
  },
  'shop.noAds.youMade': {
    en: 'You made',
    es: 'Hiciste',
    pt: 'Você fez',
  },
  'shop.noAds.purchaseSingular': {
    en: 'purchase',
    es: 'compra',
    pt: 'compra',
  },
  'shop.noAds.purchasePlural': {
    en: 'purchases',
    es: 'compras',
    pt: 'compras',
  },
  'shop.noAds.noPurchasesYet': {
    en: 'No purchases yet',
    es: 'Sin compras aún',
    pt: 'Sem compras ainda',
  },
  'shop.noAds.nextChance50': {
    en: 'first purchase: 50% chance',
    es: 'primera compra: 50% de chance',
    pt: 'primeira compra: 50% de chance',
  },
  'shop.noAds.nextChance75': {
    en: 'next purchase: 75% chance',
    es: 'próxima compra: 75% de chance',
    pt: 'próxima compra: 75% de chance',
  },
  'shop.noAds.nextChance100': {
    en: 'next purchase: 100% guaranteed',
    es: 'próxima compra: 100% garantizado',
    pt: 'próxima compra: 100% garantido',
  },
  'shop.noAds.unlockNote.pre0': {
    en: 'With your first purchase you have a',
    es: 'Con tu primera compra tenés un',
    pt: 'Com sua primeira compra você tem',
  },
  'shop.noAds.unlockNote.preNext': {
    en: 'With your next purchase you have a',
    es: 'Con tu próxima compra tenés un',
    pt: 'Com sua próxima compra você tem',
  },
  'shop.noAds.unlockNote.post': {
    en: 'to unlock No Ads for free.',
    es: 'de desbloquear No Ads gratis.',
    pt: 'de desbloquear No Ads de graça.',
  },
  'shop.noAds.unlockNote.pct50': {
    en: '50% chance',
    es: '50% de chance',
    pt: '50% de chance',
  },
  'shop.noAds.unlockNote.pct75': {
    en: '75% chance',
    es: '75% de chance',
    pt: '75% de chance',
  },
  'shop.noAds.unlockNote.pct100': {
    en: '100% guaranteed',
    es: '100% garantizado',
    pt: '100% garantido',
  },

  // Shop — Boosters tab
  'shop.boosters.active': {
    en: 'ACTIVE',
    es: 'ACTIVO',
    pt: 'ATIVO',
  },
  'shop.boosters.price': {
    en: 'PRICE',
    es: 'PRECIO',
    pt: 'PREÇO',
  },
  'shop.boosters.buy': {
    en: 'BUY',
    es: 'COMPRAR',
    pt: 'COMPRAR',
  },
  'shop.boosters.purchased': {
    en: 'PURCHASED ✓',
    es: 'COMPRADO ✓',
    pt: 'COMPRADO ✓',
  },
  'shop.boosters.hours': {
    en: 'hours',
    es: 'horas',
    pt: 'horas',
  },
  'shop.boosters.stackable': {
    en: 'Stackable',
    es: 'Stackeable',
    pt: 'Acumulável',
  },
  'shop.boosters.2x.desc': {
    en: 'Doubles your CC production for',
    es: 'Duplica tu producción de CC por',
    pt: 'Dobra sua produção de CC por',
  },
  'shop.boosters.2x.perk1': {
    en: 'Stacks with prestige multiplier and ad boost',
    es: 'Stackea con prestige multiplier y ad boost',
    pt: 'Acumula com multiplicador de prestígio e boost de anúncio',
  },
  'shop.boosters.2x.perk2': {
    en: 'Can be purchased multiple times',
    es: 'Se puede comprar múltiples veces',
    pt: 'Pode ser comprado múltiplas vezes',
  },
  'shop.boosters.5x.desc': {
    en: 'Multiplies your production by 5 for',
    es: 'Multiplica tu producción por 5 durante',
    pt: 'Multiplica sua produção por 5 por',
  },
  'shop.boosters.5x.perk1': {
    en: 'Stacks with prestige multiplier and ad boost',
    es: 'Stackea con prestige multiplier y ad boost',
    pt: 'Acumula com multiplicador de prestígio e boost de anúncio',
  },
  'shop.boosters.5x.perk2': {
    en: 'Can be purchased multiple times',
    es: 'Se puede comprar múltiples veces',
    pt: 'Pode ser comprado múltiplas vezes',
  },
  'shop.boosters.perm.desc': {
    en: 'Doubles your production forever, across all runs',
    es: 'Duplica tu producción para siempre, en todos los runs',
    pt: 'Dobra sua produção para sempre, em todas as rodadas',
  },
  'shop.boosters.perm.duration': {
    en: '∞ Permanent · Survives prestige',
    es: '∞ Permanente · Survives prestige',
    pt: '∞ Permanente · Sobrevive ao prestígio',
  },
  'shop.boosters.perm.active': {
    en: 'ACTIVE — Permanent',
    es: 'ACTIVO — Permanente',
    pt: 'ATIVO — Permanente',
  },
  'shop.boosters.perm.perk1': {
    en: 'Stacks with ALL other multipliers',
    es: 'Stackea con TODOS los otros multiplicadores',
    pt: 'Acumula com TODOS os outros multiplicadores',
  },
  'shop.boosters.perm.perk2': {
    en: 'Survives prestige resets — yours forever',
    es: 'Survives prestige resets — es tuyo para siempre',
    pt: 'Sobrevive ao prestígio — é seu para sempre',
  },

  // Shop — Packs tab
  'shop.packs.activeOffer': {
    en: 'Active offer',
    es: 'Oferta activa',
    pt: 'Oferta ativa',
  },
  'shop.packs.exclusive': {
    en: 'EXCLUSIVE',
    es: 'EXCLUSIVO',
    pt: 'EXCLUSIVO',
  },
  'shop.packs.expiresIn': {
    en: 'EXPIRES IN',
    es: 'EXPIRA EN',
    pt: 'EXPIRA EM',
  },
  'shop.packs.expired': {
    en: 'EXPIRED',
    es: 'EXPIRÓ',
    pt: 'EXPIROU',
  },
  'shop.packs.normalPrice': {
    en: 'Regular price',
    es: 'Valor normal',
    pt: 'Preço normal',
  },
  'shop.packs.buy': {
    en: '⬡ BUY',
    es: '⬡ COMPRAR',
    pt: '⬡ COMPRAR',
  },
  'shop.packs.nextOffer': {
    en: 'Next offer',
    es: 'Próxima oferta',
    pt: 'Próxima oferta',
  },
  'shop.packs.nextOfferIn': {
    en: 'Next offer available in',
    es: 'Próxima oferta disponible en',
    pt: 'Próxima oferta disponível em',
  },
  'shop.packs.sessionOffer': {
    en: 'New offer rolls automatically',
    es: 'Nueva oferta automática',
    pt: 'Nova oferta automática',
  },
  'shop.packs.nextOfferHeader': {
    en: 'NEXT OFFER',
    es: 'PRÓXIMA OFERTA',
    pt: 'PRÓXIMA OFERTA',
  },
  'shop.packs.noMoreOffers': {
    en: 'No more offers',
    es: 'Sin más ofertas',
    pt: 'Sem más ofertas',
  },
  'shop.packs.allClaimed': {
    en: 'All offers have been claimed',
    es: 'Todas las ofertas han sido reclamadas',
    pt: 'Todas as ofertas foram resgatadas',
  },
  'shop.packs.small.eyebrow': {
    en: 'Milestone Offer',
    es: 'Oferta de Milestone',
    pt: 'Oferta de Marco',
  },
  'shop.packs.medium.eyebrow': {
    en: 'Seasonal Offer',
    es: 'Oferta de Temporada',
    pt: 'Oferta de Temporada',
  },
  'shop.packs.large.eyebrow': {
    en: 'Premium Offer',
    es: 'Oferta Premium',
    pt: 'Oferta Premium',
  },
  'shop.packs.mega.eyebrow': {
    en: 'Elite Offer',
    es: 'Oferta Élite',
    pt: 'Oferta Élite',
  },

  // ── Booster Notch / Drawer ──
  'boosterNotch.title': {
    en: 'BOOSTERS',
    es: 'BOOSTERS',
    pt: 'BOOSTERS',
  },
  'boosterNotch.totalMultiplier': {
    en: 'Total multiplier',
    es: 'Multiplicador total',
    pt: 'Multiplicador total',
  },
  'boosterNotch.permanent': {
    en: 'Permanent · survives prestige',
    es: 'Permanente · sobrevive prestige',
    pt: 'Permanente · sobrevive prestige',
  },
  'boosterNotch.remaining': {
    en: 'remaining',
    es: 'restantes',
    pt: 'restantes',
  },
  'boosterNotch.blocksLeft': {
    en: 'blocks left',
    es: 'bloques restantes',
    pt: 'blocos restantes',
  },
  'boosterNotch.activeImpact': {
    en: 'ACTIVE IMPACT',
    es: 'IMPACTO ACTIVO',
    pt: 'IMPACTO ATIVO',
  },
  'boosterNotch.extraPerSec': {
    en: 'Extra CC/s',
    es: 'CC extra/s',
    pt: 'CC extra/s',
  },
  'boosterNotch.stackHint': {
    en: 'Stack with your active multipliers',
    es: 'Stackean con tus multiplicadores activos',
    pt: 'Acumule com seus multiplicadores ativos',
  },
  'boosterNotch.addBooster': {
    en: 'ADD BOOSTER',
    es: 'AGREGAR BOOSTER',
    pt: 'ADICIONAR BOOSTER',
  },

  // ── Ad Booster Bubbles ──────────────────────────────────────────────────
  'adBubble.hash.name': {
    en: 'Hash Rate Boost',
    es: 'Hash Rate Boost',
    pt: 'Boost de Hash Rate',
  },
  'adBubble.hash.detail': {
    en: 'Your hash rate goes up 35% — more blocks mined per second',
    es: 'Tu hash rate sube un 35% — más bloques minados por segundo',
    pt: 'Seu hash rate sobe 35% — mais blocos minerados por segundo',
  },
  'adBubble.hash.stackNote': {
    en: 'Stacks with your active boosters',
    es: 'Stackea con tus boosters activos',
    pt: 'Acumula com seus boosters ativos',
  },
  'adBubble.hash.toastText': {
    en: '+35% Hash Rate activated · 3 min',
    es: '+35% Hash Rate activado · 3 min',
    pt: '+35% Hash Rate ativado · 3 min',
  },
  'adBubble.market.name': {
    en: 'Market Price',
    es: 'Precio de Mercado',
    pt: 'Preço de Mercado',
  },
  'adBubble.market.detail': {
    en: 'CC sell price goes up 25% — best time to sell',
    es: 'El precio de CC sube un 25% — mejor momento para vender',
    pt: 'O preço de CC sobe 25% — melhor momento para vender',
  },
  'adBubble.market.valueSuffix': {
    en: 'CC Price',
    es: 'Precio CC',
    pt: 'Preço CC',
  },
  'adBubble.market.stackNote': {
    en: 'Great time to sell in the Market',
    es: 'Ideal para vender ahora en el Market',
    pt: 'Ideal para vender agora no Market',
  },
  'adBubble.market.toastText': {
    en: '+25% CC price activated · 5 min',
    es: '+25% precio de CC activado · 5 min',
    pt: '+25% preço de CC ativado · 5 min',
  },
  'adBubble.energy.name': {
    en: 'Energy Recovery',
    es: 'Recuperación de Energía',
    pt: 'Recuperação de Energia',
  },
  'adBubble.energy.detail': {
    en: 'Instantly recover 50% of your energy deficit',
    es: 'Recuperá al instante el 50% del déficit de energía',
    pt: 'Recupere instantaneamente 50% do déficit de energia',
  },
  'adBubble.energy.valueSuffix': {
    en: 'Restored',
    es: 'Restaurada',
    pt: 'Restaurada',
  },
  'adBubble.energy.duration': {
    en: 'INSTANT',
    es: 'INSTANTÁNEO',
    pt: 'INSTANTÂNEO',
  },
  'adBubble.energy.stackNote': {
    en: 'Only available with negative energy balance',
    es: 'Solo disponible con balance de energía negativo',
    pt: 'Só disponível com balanço de energia negativo',
  },
  'adBubble.energy.toastText': {
    en: '50% energy restored',
    es: '50% de energía restaurada',
    pt: '50% de energia restaurada',
  },
  'adBubble.modal.watchToActivate': {
    en: 'WATCH AD TO ACTIVATE',
    es: 'VER AD PARA ACTIVAR',
    pt: 'VER AD PARA ATIVAR',
  },
  'adBubble.modal.freeActivation': {
    en: 'FREE ACTIVATION',
    es: 'ACTIVACIÓN GRATIS',
    pt: 'ATIVAÇÃO GRÁTIS',
  },
  'adBubble.modal.free': {
    en: 'Free',
    es: 'Gratis',
    pt: 'Grátis',
  },
  'adBubble.modal.justWatch': {
    en: 'just watch the ad',
    es: 'solo mirá el ad',
    pt: 'só assista o ad',
  },
  'adBubble.modal.watchAndActivate': {
    en: 'WATCH AD & ACTIVATE',
    es: 'VER AD Y ACTIVAR',
    pt: 'VER AD E ATIVAR',
  },
  'adBubble.modal.activate': {
    en: 'ACTIVATE',
    es: 'ACTIVAR',
    pt: 'ATIVAR',
  },
  'adBubble.modal.notNow': {
    en: 'Not now',
    es: 'Ahora no',
    pt: 'Agora não',
  },
  // ── Offline Earnings Modal ────────────────────────────────────────────
  'offline.logTitle': {
    en: 'SYSTEM · Offline Mining',
    es: 'SISTEMA · Minado Offline',
    pt: 'SISTEMA · Mineração Offline',
  },
  'offline.logLine1': {
    en: 'Hardware active during operator absence.',
    es: 'Hardware activo durante ausencia del operador.',
    pt: 'Hardware ativo durante ausência do operador.',
  },
  'offline.logLine2': {
    en: 'Blocks processed: {blocks}. Status: pending validation.',
    es: 'Bloques procesados: {blocks}. Estado: pendiente de validación.',
    pt: 'Blocos processados: {blocks}. Status: pendente de validação.',
  },
  'offline.logLine3': {
    en: 'Production retained. Operator presence required to release funds.',
    es: 'Producción retenida. Se requiere presencia del operador para liberar fondos.',
    pt: 'Produção retida. Presença do operador necessária para liberar fundos.',
  },
  'offline.timeAway': {
    en: 'TIME AWAY',
    es: 'TIEMPO FUERA',
    pt: 'TEMPO AUSENTE',
  },
  'offline.accumulated': {
    en: 'Accumulated production',
    es: 'Producción acumulada',
    pt: 'Produção acumulada',
  },
  'offline.capWarning': {
    en: 'Production capped at 1h — come back more often to maximize',
    es: 'Producción capada a 1h — volvé más seguido para maximizar',
    pt: 'Produção limitada a 1h — volte mais vezes para maximizar',
  },
  'offline.claimTitle': {
    en: 'Claim production',
    es: 'Reclamar producción',
    pt: 'Reclamar produção',
  },
  'offline.claimBody': {
    en: 'Blocks mined during your absence are pending validation. Confirm your presence to claim them.',
    es: 'Los bloques minados durante tu ausencia están pendientes de validación. Confirmá tu presencia para reclamarlos.',
    pt: 'Os blocos minerados durante sua ausência estão pendentes de validação. Confirme sua presença para reclamá-los.',
  },
  'offline.watchAd': {
    en: 'WATCH AD & CLAIM',
    es: 'VER AD Y RECLAMAR',
    pt: 'VER AD E RECLAMAR',
  },
  'offline.skip': {
    en: 'Continue without claiming',
    es: 'Continuar sin reclamar',
    pt: 'Continuar sem reclamar',
  },
  'offline.toast': {
    en: '⛏ {amount} CC claimed',
    es: '⛏ {amount} CC reclamados',
    pt: '⛏ {amount} CC reclamados',
  },
  'offline.claimed': {
    en: 'claimed',
    es: 'reclamados',
    pt: 'reclamados',
  },
  'offline.claim': {
    en: 'CLAIM',
    es: 'RECLAMAR',
    pt: 'RECLAMAR',
  },

  // ── Premium Offline Earnings (IAP Offline Miner) ───────────────────────────
  'offlinePremium.iapActive': {
    en: 'IAP ACTIVE',
    es: 'IAP ACTIVO',
    pt: 'IAP ATIVO',
  },
  'offlinePremium.title': {
    en: 'Offline Miner',
    es: 'Offline Miner',
    pt: 'Offline Miner',
  },
  'offlinePremium.timeRemaining': {
    en: 'TIME REMAINING',
    es: 'TIEMPO RESTANTE',
    pt: 'TEMPO RESTANTE',
  },
  'offlinePremium.expired': {
    en: 'EXPIRED',
    es: 'EXPIRADO',
    pt: 'EXPIRADO',
  },
  'offlinePremium.timeAway': {
    en: 'TIME AWAY',
    es: 'TIEMPO FUERA',
    pt: 'TEMPO FORA',
  },
  'offlinePremium.logSource': {
    en: 'OFFLINE MINER · Activity log',
    es: 'OFFLINE MINER · Log de actividad',
    pt: 'OFFLINE MINER · Log de atividade',
  },
  'offlinePremium.logLine1': {
    en: 'Offline Miner active. Speed: <gold>50% of production</gold>.',
    es: 'Offline Miner activo. Velocidad: <gold>50% de producción</gold>.',
    pt: 'Offline Miner ativo. Velocidade: <gold>50% da produção</gold>.',
  },
  'offlinePremium.logLine2': {
    en: 'Blocks processed: <acc>{blocks}</acc>. Gross CC generated.',
    es: 'Bloques procesados: <acc>{blocks}</acc>. CC brutos generados.',
    pt: 'Blocos processados: <acc>{blocks}</acc>. CC brutos gerados.',
  },
  'offlinePremium.logLine3': {
    en: 'Electricity fee applied: <neg>−{fee} CC</neg>.',
    es: 'Fee de electricidad aplicado: <neg>−{fee} CC</neg>.',
    pt: 'Taxa de eletricidade aplicada: <neg>−{fee} CC</neg>.',
  },
  'offlinePremium.logLine4': {
    en: 'Net credited to balance: <acc>+{net} CC</acc>.',
    es: 'Neto acreditado a balance: <acc>+{net} CC</acc>.',
    pt: 'Líquido creditado ao saldo: <acc>+{net} CC</acc>.',
  },
  'offlinePremium.breakdownLabel': {
    en: 'PRODUCTION BREAKDOWN',
    es: 'DESGLOSE DE PRODUCCIÓN',
    pt: 'DETALHAMENTO DA PRODUÇÃO',
  },
  'offlinePremium.grossLabel': {
    en: '⛏ GROSS CC MINED',
    es: '⛏ CC MINADOS BRUTOS',
    pt: '⛏ CC MINERADOS BRUTOS',
  },
  'offlinePremium.feeLabel': {
    en: '⚡ ELECTRICITY FEE',
    es: '⚡ FEE DE ELECTRICIDAD',
    pt: '⚡ TAXA DE ELETRICIDADE',
  },
  'offlinePremium.netLabel': {
    en: 'NET CREDITED',
    es: 'NETO ACREDITADO',
    pt: 'LÍQUIDO CREDITADO',
  },
  'offlinePremium.autoCredited': {
    en: 'Automatically credited to your balance',
    es: 'Acreditado automáticamente a tu balance',
    pt: 'Creditado automaticamente ao seu saldo',
  },
  'offlinePremium.continueButton': {
    en: '⛏ CONTINUE MINING',
    es: '⛏ CONTINUAR MINANDO',
    pt: '⛏ CONTINUAR MINERANDO',
  },

  // ── Market Events (price unification) ──────────────────────────────────────
  'marketEvent.halvingAnticipation': {
    en: 'Halving incoming',
    es: 'Halving inminente',
    pt: 'Halving iminente',
  },
  'marketEvent.halvingShock': {
    en: 'Post-halving correction',
    es: 'Corrección post-halving',
    pt: 'Correção pós-halving',
  },
  'marketEvent.marketSpike': {
    en: 'Market spike',
    es: 'Alza de mercado',
    pt: 'Alta do mercado',
  },
  'marketEvent.blackoutRegional': {
    en: 'Regional blackout',
    es: 'Apagón regional',
    pt: 'Apagão regional',
  },
  'marketEvent.aiAutonomous': {
    en: 'AI trading active',
    es: 'IA operando en mercado',
    pt: 'IA operando no mercado',
  },
  'marketEvent.planetaryCollapse': {
    en: 'Market panic',
    es: 'Pánico de mercado',
    pt: 'Pânico de mercado',
  },
  'marketEvent.whaleDump': {
    en: 'Whale dump',
    es: 'Venta masiva',
    pt: 'Venda massiva',
  },
  'marketEvent.mediaHype': {
    en: 'Media hype',
    es: 'Euforia mediática',
    pt: 'Euforia mediática',
  },
  // Toast messages
  'marketEvent.toast.halvingAnticipation': {
    en: '📈 Halving incoming — price +25%',
    es: '📈 Halving inminente — precio +25%',
    pt: '📈 Halving iminente — preço +25%',
  },
  'marketEvent.toast.halvingShock': {
    en: '📉 Post-halving correction — price -25%',
    es: '📉 Corrección post-halving — precio -25%',
    pt: '📉 Correção pós-halving — preço -25%',
  },
  'marketEvent.toast.marketSpike': {
    en: '📈 Market spike — price +25%',
    es: '📈 Alza de mercado — precio +25%',
    pt: '📈 Alta do mercado — preço +25%',
  },
  'marketEvent.toast.blackoutRegional': {
    en: '📉 Regional blackout — price -9%',
    es: '📉 Apagón regional — precio -9%',
    pt: '📉 Apagão regional — preço -9%',
  },
  'marketEvent.toast.aiAutonomous': {
    en: '📈 AI trading active — price +15%',
    es: '📈 IA operando en mercado — precio +15%',
    pt: '📈 IA operando no mercado — preço +15%',
  },
  'marketEvent.toast.planetaryCollapse': {
    en: '📉 Market panic — price -40%',
    es: '📉 Pánico de mercado — precio -40%',
    pt: '📉 Pânico de mercado — preço -40%',
  },
  'marketEvent.toast.whaleDump': {
    en: '📉 Whale dump — price -15%',
    es: '📉 Venta masiva — precio -15%',
    pt: '📉 Venda massiva — preço -15%',
  },
  'marketEvent.toast.mediaHype': {
    en: '📈 Media hype — price +18%',
    es: '📈 Euforia mediática — precio +18%',
    pt: '📈 Euforia mediática — preço +18%',
  },
  // Net multiplier label
  'marketEvent.netMultiplier': {
    en: 'Net',
    es: 'Neto',
    pt: 'Líquido',
  },
  // Local Protest choices
  'localProtest.choiceRationing': {
    en: 'Accept rationing',
    es: 'Aceptar racionamiento',
    pt: 'Aceitar racionamento',
  },
  'localProtest.choiceCompensation': {
    en: 'Pay compensation',
    es: 'Pagar compensación',
    pt: 'Pagar compensação',
  },
  'localProtest.rationingDesc': {
    en: '20% energy reduction for 30 min',
    es: '20% menos energía por 30 min',
    pt: '20% menos energia por 30 min',
  },
  'localProtest.category': {
    en: 'ALERT · OPERATIONAL IMPACT',
    es: 'ALERTA · IMPACTO OPERACIONAL',
    pt: 'ALERTA · IMPACTO OPERACIONAL',
  },
  'localProtest.title': {
    en: 'Regional blackout — communities protest',
    es: 'Apagón regional — comunidades protestan',
    pt: 'Apagão regional — comunidades protestam',
  },
  'localProtest.description': {
    en: 'Your operation consumed {pct}% of regional electrical capacity. Three nearby communities reported 6-hour blackouts. Environmental groups launched a campaign against you.',
    es: 'Tu operación consumió el {pct}% de la capacidad eléctrica regional. Tres comunidades cercanas reportaron apagones de 6 horas. Grupos ambientalistas iniciaron una campaña en tu contra.',
    pt: 'Sua operação consumiu {pct}% da capacidade elétrica regional. Três comunidades próximas relataram apagões de 6 horas. Grupos ambientalistas iniciaram uma campanha contra você.',
  },
  'localProtest.tagNoImpact': {
    en: 'No immediate mechanical impact',
    es: 'Sin impacto mecánico inmediato',
    pt: 'Sem impacto mecânico imediato',
  },
  'localProtest.tagPressure': {
    en: 'Regulatory pressure increases',
    es: 'Presión regulatoria aumenta',
    pt: 'Pressão regulatória aumenta',
  },
  'localProtest.tagReputation': {
    en: 'Reputation: ↓',
    es: 'Reputación: ↓',
    pt: 'Reputação: ↓',
  },
  // Market Opportunity modal
  'marketOpportunity.category': {
    en: 'OPPORTUNITY · MARKET',
    es: 'OPORTUNIDAD · MERCADO',
    pt: 'OPORTUNIDADE · MERCADO',
  },
  'marketOpportunity.title': {
    en: 'Extreme volatility — CC price +25%',
    es: 'Volatilidad extrema — precio CC +25%',
    pt: 'Volatilidade extrema — preço CC +25%',
  },
  'marketOpportunity.timerLabel': {
    en: 'Opportunity window',
    es: 'Ventana de oportunidad',
    pt: 'Janela de oportunidade',
  },
  'marketOpportunity.description': {
    en: 'Unusual market conditions generated a demand spike. CryptoCoin price rose 25%. The window lasts approximately 5 minutes — the market moves on its own.',
    es: 'Condiciones inusuales de mercado generaron un spike de demanda. El precio de CryptoCoin subió un 25%. La ventana dura aproximadamente 5 minutos — el mercado se mueve solo.',
    pt: 'Condições incomuns de mercado geraram um pico de demanda. O preço do CryptoCoin subiu 25%. A janela dura aproximadamente 5 minutos — o mercado se move sozinho.',
  },
  'marketOpportunity.tagPrice': {
    en: '+25% current price',
    es: '+25% precio actual',
    pt: '+25% preço atual',
  },
  'marketOpportunity.tagTimer': {
    en: '⏱ ~10 minutes',
    es: '⏱ ~10 minutos',
    pt: '⏱ ~10 minutos',
  },
  'marketOpportunity.btnGoToMarket': {
    en: '⚡ GO TO MARKET NOW',
    es: '⚡ IR AL MERCADO AHORA',
    pt: '⚡ IR AO MERCADO AGORA',
  },
  'marketOpportunity.btnGoToMarketSub': {
    en: 'Open the Market tab to sell at the current price',
    es: 'Abrí el tab Market para vender al precio actual',
    pt: 'Abra a aba Market para vender ao preço atual',
  },
  'marketOpportunity.btnAutoSell': {
    en: 'AUTO-SELL 100%',
    es: 'VENDER 100% AUTOMÁTICAMENTE',
    pt: 'VENDER 100% AUTOMATICAMENTE',
  },
  'marketOpportunity.btnAutoSellSub': {
    en: 'Sell your entire stack now — without opening Market',
    es: 'Vendé todo tu stack ahora — sin abrir Market',
    pt: 'Venda todo seu stack agora — sem abrir Market',
  },
  'marketOpportunity.activeLabel': {
    en: '📈 Market Opportunity +25%',
    es: '📈 Oportunidad de mercado +25%',
    pt: '📈 Oportunidade de mercado +25%',
  },
  // Regulatory Pressure modal — decision
  'regulatory.category': {
    en: 'EXTERNAL PRESSURE · REGULATORY',
    es: 'PRESIÓN EXTERNA · REGULATORIO',
    pt: 'PRESSÃO EXTERNA · REGULATÓRIO',
  },
  'regulatory.title': {
    en: 'EU regulators propose emergency tax',
    es: 'Reguladores de la UE proponen impuesto de emergencia',
    pt: 'Reguladores da UE propõem imposto de emergência',
  },
  'regulatory.timerLabel': {
    en: 'Decide now',
    es: 'Decidí ahora',
    pt: 'Decida agora',
  },
  'regulatory.description': {
    en: 'The European Commission proposes a 40% tax on mining operations exceeding 50K H/s. You must decide now.',
    es: 'La Comisión Europea propone un impuesto del 40% a operaciones de minado que superen 50K H/s. Debés decidir ahora.',
    pt: 'A Comissão Europeia propõe um imposto de 40% sobre operações de mineração que excedam 50K H/s. Você deve decidir agora.',
  },
  'regulatory.tagPenalty': {
    en: '−30% Hash Rate if ignored',
    es: '−30% Hash Rate si ignorás',
    pt: '−30% Hash Rate se ignorar',
  },
  'regulatory.tagCost': {
    en: 'Cost: $',
    es: 'Costo: $',
    pt: 'Custo: $',
  },
  'regulatory.btnPay': {
    en: '💰 PAY TAX',
    es: '💰 PAGAR IMPUESTO',
    pt: '💰 PAGAR IMPOSTO',
  },
  'regulatory.btnPaySub': {
    en: 'Cost: ${amount} — operation continues normally',
    es: 'Costo: ${amount} — operación continúa normalmente',
    pt: 'Custo: ${amount} — operação continua normalmente',
  },
  'regulatory.btnAppeal': {
    en: '⚖️ APPEAL LEGALLY',
    es: '⚖️ APELAR LEGALMENTE',
    pt: '⚖️ APELAR LEGALMENTE',
  },
  'regulatory.btnAppealSub': {
    en: 'Delays the decision — cost ${amount} in lawyers',
    es: 'Demora la decisión — costo ${amount} en abogados',
    pt: 'Atrasa a decisão — custo ${amount} em advogados',
  },
  'regulatory.btnIgnore': {
    en: 'IGNORE',
    es: 'IGNORAR',
    pt: 'IGNORAR',
  },
  // Regulatory Pressure modal — appeal result
  'regulatory.appealCategory': {
    en: 'LEGAL RESULT · APPEAL',
    es: 'RESULTADO LEGAL · APELACIÓN',
    pt: 'RESULTADO LEGAL · APELAÇÃO',
  },
  'regulatory.appealSuccess': {
    en: 'Appeal successful — tax voided',
    es: 'Apelación exitosa — impuesto anulado',
    pt: 'Apelação bem-sucedida — imposto anulado',
  },
  'regulatory.appealPartial': {
    en: 'Partial agreement — tax reduced',
    es: 'Acuerdo parcial — impuesto reducido',
    pt: 'Acordo parcial — imposto reduzido',
  },
  'regulatory.appealRejected': {
    en: 'Appeal rejected — final ruling',
    es: 'Apelación rechazada — fallo definitivo',
    pt: 'Apelação rejeitada — decisão definitiva',
  },
  'regulatory.successDesc': {
    en: 'The European court ruled in your favor. The tax was deemed disproportionate and is voided. Your ${amount} in legal fees were sufficient.',
    es: 'El tribunal europeo falló a tu favor. El impuesto fue declarado desproporcionado y queda sin efecto. Tus ${amount} en honorarios legales fueron suficientes.',
    pt: 'O tribunal europeu decidiu a seu favor. O imposto foi considerado desproporcional e anulado. Seus ${amount} em honorários legais foram suficientes.',
  },
  'regulatory.tagVoided': {
    en: 'Tax voided',
    es: 'Impuesto anulado',
    pt: 'Imposto anulado',
  },
  'regulatory.tagHashRateOk': {
    en: 'Hash rate unchanged',
    es: 'Hash rate sin cambios',
    pt: 'Hash rate sem alterações',
  },
  'regulatory.tagTotalCost': {
    en: 'Total cost: $',
    es: 'Costo total: $',
    pt: 'Custo total: $',
  },
  'regulatory.btnReceived': {
    en: '✓ RECEIVED',
    es: '✓ RECIBIDO',
    pt: '✓ RECEBIDO',
  },
  'regulatory.partialDesc': {
    en: 'The court accepted a settlement. You will pay 20% of the original tax. Operation continues without additional penalty.',
    es: 'El tribunal aceptó un acuerdo. Pagarás el 20% del impuesto original. La operación continúa sin penalización adicional.',
    pt: 'O tribunal aceitou um acordo. Você pagará 20% do imposto original. A operação continua sem penalização adicional.',
  },
  'regulatory.tagReduced': {
    en: 'Reduced payment: $',
    es: 'Pago reducido: $',
    pt: 'Pagamento reduzido: $',
  },
  'regulatory.btnPayAmount': {
    en: '💰 PAY $',
    es: '💰 PAGAR $',
    pt: '💰 PAGAR $',
  },
  'regulatory.btnAcceptDeal': {
    en: 'Deal accepted — operation continues',
    es: 'Acuerdo aceptado — operación continúa',
    pt: 'Acordo aceito — operação continua',
  },
  'regulatory.btnRejectDeal': {
    en: 'REJECT DEAL',
    es: 'RECHAZAR ACUERDO',
    pt: 'REJEITAR ACORDO',
  },
  'regulatory.btnRejectDealSub': {
    en: 'Accept hash rate penalty −30%',
    es: 'Aceptar penalización de hash rate −30%',
    pt: 'Aceitar penalização de hash rate −30%',
  },
  'regulatory.rejectedDesc': {
    en: 'The court rejected the appeal. You must pay the original tax plus a late penalty. No further appeals are possible.',
    es: 'El tribunal rechazó la apelación. Debés pagar el impuesto original más una multa por demora. No hay más instancias posibles.',
    pt: 'O tribunal rejeitou a apelação. Você deve pagar o imposto original mais uma multa por atraso. Não há mais instâncias possíveis.',
  },
  'regulatory.tagFullTax': {
    en: 'Full tax: $',
    es: 'Impuesto completo: $',
    pt: 'Imposto completo: $',
  },
  'regulatory.tagLateFine': {
    en: 'Late penalty: $8,000',
    es: 'Multa por demora: $8,000',
    pt: 'Multa por atraso: $8.000',
  },
  'regulatory.tagTotalOrPenalty': {
    en: 'Total: ${amount} or −30% hash rate',
    es: 'Total: ${amount} o −30% hash rate',
    pt: 'Total: ${amount} ou −30% hash rate',
  },
  'regulatory.btnContinueNoPenalty': {
    en: 'Operation continues without penalty',
    es: 'Operación continúa sin penalización',
    pt: 'Operação continua sem penalização',
  },
  'regulatory.btnAcceptPenalty': {
    en: 'ACCEPT PENALTY',
    es: 'ACEPTAR PENALIZACIÓN',
    pt: 'ACEITAR PENALIZAÇÃO',
  },
  'regulatory.btnAcceptPenaltySub': {
    en: '−30% hash rate for 24h — no additional cost',
    es: '−30% hash rate por 24h — sin costo adicional',
    pt: '−30% hash rate por 24h — sem custo adicional',
  },
};
