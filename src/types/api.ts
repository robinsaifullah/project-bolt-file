export interface PriceData {
  symbol: string;
  price: string;
  timestamp: number;
  volume24h: string;
  change24h?: string;
}

export interface OrderBookData {
  symbol: string;
  bids: [string, string][]; // [price, quantity][]
  asks: [string, string][]; // [price, quantity][]
  timestamp: number;
}

export interface BlockchainData {
  blockNumber: number;
  gasPrice: string;
  baseFee: string;
  priorityFee: string;
}

export interface PoolData {
  address: string;
  token0: string;
  token1: string;
  reserve0: string;
  reserve1: string;
  fee: number;
}

export interface Position {
  pair: string;
  amount: string;
  entryPrice: string;
  timestamp: number;
  type: 'Market' | 'Limit' | 'Flash Loan' | 'Arbitrage';
  status: 'Open' | 'Closed' | 'Pending';
  exitPrice?: string;
  pnl?: string;
}

export interface TradeEvent {
  type: 'execution' | 'cancellation' | 'error';
  position?: Position;
  error?: string;
  timestamp: number;
}