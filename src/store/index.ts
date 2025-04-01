import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Strategy, TradingParameters } from '@/types/trading';

interface AppState {
  strategies: Strategy[];
  tradingParams: TradingParameters;
  setStrategies: (strategies: Strategy[]) => void;
  setTradingParams: (params: Partial<TradingParameters>) => void;
  toggleStrategy: (index: number) => void;
}

export const useAppStore = create(
  immer<AppState>((set) => ({
    strategies: [
      { name: 'Sandwich Trading', enabled: false },
      { name: 'Arbitrage', enabled: false },
      { name: 'Liquidation Protection', enabled: false },
      { name: 'Flash Loan Trading', enabled: false }
    ],
    tradingParams: {
      gasPrice: '',
      slippageTolerance: '',
      maxPositionSize: ''
    },
    setStrategies: (strategies) => set((state) => { state.strategies = strategies; }),
    setTradingParams: (params) => set((state) => {
      Object.assign(state.tradingParams, params);
    }),
    toggleStrategy: (index) => set((state) => {
      state.strategies[index].enabled = !state.strategies[index].enabled;
    })
  }))
);