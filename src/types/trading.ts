export interface Strategy {
  name: string;
  enabled: boolean;
}

export interface TradingParameters {
  gasPrice: string;
  slippageTolerance: string;
  maxPositionSize: string;
}

export interface Position {
  pair: string;
  pnl: string;
  type: string;
  timestamp: number;
}

export interface PriceUpdate {
  symbol: string;
  price: string;
  change24h: string;
  direction: 'up' | 'down';
}