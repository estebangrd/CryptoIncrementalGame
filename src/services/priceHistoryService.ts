/**
 * Genera datos de historial simulados.
 * Útil como utilidad pura para criptos no-nativas si se necesita en el futuro.
 */
export const generateSimulatedHistory = (basePrice: number, volatility: number = 0.1): number[] => {
  const history: number[] = [basePrice];
  for (let i = 1; i < 30; i++) {
    const change = (Math.random() - 0.5) * 2 * volatility;
    const newPrice = Math.max(0.01, history[i - 1] * (1 + change));
    history.push(newPrice);
  }
  return history;
};
