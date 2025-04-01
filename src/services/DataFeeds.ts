import { ethers } from 'ethers';
import Web3 from 'web3';
import axios from 'axios';
import type { PriceData, OrderBookData, BlockchainData, PoolData } from '../types/api';

export class DataFeeds {
  private static instance: DataFeeds;
  private exchanges: Map<string, any>;
  private web3: Web3;
  private provider: ethers.JsonRpcProvider;
  private priceCache: Map<string, { data: PriceData; timestamp: number }>;
  private wsConnections: Map<string, WebSocket>;
  private readonly CACHE_DURATION = 500; // 500ms cache
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;
  private readonly PRIORITY_FEEDS = ['binance', 'coinbase', 'kraken'];
  
  private constructor() {
    this.exchanges = new Map();
    this.wsConnections = new Map();
    this.priceCache = new Map();
    
    // Initialize blockchain connections with fallback URLs
    const rpcUrls = [
      'https://mainnet.infura.io/v3/YOUR-PROJECT-ID',
      'https://eth-mainnet.g.alchemy.com/v2/YOUR-PROJECT-ID'
    ];
    
    for (const url of rpcUrls) {
      try {
        this.web3 = new Web3(url);
        this.provider = new ethers.JsonRpcProvider(url);
        break;
      } catch (error) {
        console.error(`Failed to connect to RPC URL ${url}:`, error);
      }
    }

    // Initialize WebSocket connections
    this.initializeWebSockets();
  }

  private async initializeWebSockets() {
    for (const exchange of this.PRIORITY_FEEDS) {
      await this.setupWebSocket(exchange);
    }
  }

  private async setupWebSocket(exchange: string) {
    try {
      const wsUrl = this.getWebSocketUrl(exchange);
      if (!wsUrl) throw new Error('No WebSocket URL available');

      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`WebSocket connected for ${exchange}`);
        this.wsConnections.set(exchange, ws);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(exchange, data);
        } catch (error) {
          console.error(`Error processing WebSocket message from ${exchange}:`, error);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for ${exchange}:`, error);
        this.wsConnections.delete(exchange);
        setTimeout(() => this.setupWebSocket(exchange), this.RETRY_DELAY);
      };

      ws.onclose = () => {
        console.log(`WebSocket closed for ${exchange}`);
        this.wsConnections.delete(exchange);
        setTimeout(() => this.setupWebSocket(exchange), this.RETRY_DELAY);
      };
    } catch (error) {
      console.error(`Failed to setup WebSocket for ${exchange}:`, error);
    }
  }

  private getWebSocketUrl(exchange: string): string {
    const urls: { [key: string]: string } = {
      binance: 'wss://stream.binance.com:9443/ws',
      coinbase: 'wss://ws-feed.pro.coinbase.com',
      kraken: 'wss://ws.kraken.com'
    };
    return urls[exchange];
  }

  private handleWebSocketMessage(exchange: string, data: any) {
    try {
      if (data.type === 'ticker' && data.symbol && data.price) {
        const priceData: PriceData = {
          symbol: data.symbol,
          price: data.price.toString(),
          timestamp: Date.now(),
          volume24h: data.volume?.toString() || '0'
        };
        this.setCachedPrice(data.symbol, priceData);
      }
    } catch (error) {
      console.error(`Error handling WebSocket message from ${exchange}:`, error);
    }
  }

  public static getInstance(): DataFeeds {
    if (!DataFeeds.instance) {
      DataFeeds.instance = new DataFeeds();
    }
    return DataFeeds.instance;
  }

  private getCachedPrice(symbol: string): PriceData | null {
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedPrice(symbol: string, data: PriceData): void {
    this.priceCache.set(symbol, { data, timestamp: Date.now() });
  }

  async getPrices(symbols: string[]): Promise<PriceData[]> {
    const prices: PriceData[] = [];
    const uncachedSymbols = symbols.filter(symbol => !this.getCachedPrice(symbol));
    
    if (uncachedSymbols.length > 0) {
      for (const exchangeName of this.PRIORITY_FEEDS) {
        if (uncachedSymbols.length === 0) break;

        try {
          const exchange = this.exchanges.get(exchangeName);
          if (!exchange) continue;

          const response = await axios.get(`${this.getApiUrl(exchangeName)}/prices`, {
            params: { symbols: uncachedSymbols.join(',') }
          });

          const tickers = response.data;
          
          for (const symbol of uncachedSymbols) {
            const ticker = tickers[symbol];
            if (ticker) {
              const priceData: PriceData = {
                symbol,
                price: ticker.last.toString(),
                timestamp: ticker.timestamp,
                volume24h: ticker.volume?.toString() || '0'
              };
              this.setCachedPrice(symbol, priceData);
              prices.push(priceData);
              
              // Remove from uncached symbols
              uncachedSymbols.splice(uncachedSymbols.indexOf(symbol), 1);
            }
          }
        } catch (error) {
          console.error(`Error fetching prices from ${exchangeName}:`, error);
          continue;
        }
      }
    }

    // Add cached prices
    for (const symbol of symbols) {
      const cached = this.getCachedPrice(symbol);
      if (cached && !prices.some(p => p.symbol === symbol)) {
        prices.push(cached);
      }
    }

    return prices;
  }

  private getApiUrl(exchange: string): string {
    const urls: { [key: string]: string } = {
      binance: 'https://api.binance.com/api/v3',
      coinbase: 'https://api.pro.coinbase.com',
      kraken: 'https://api.kraken.com/0'
    };
    return urls[exchange];
  }

  async getOrderBook(symbol: string): Promise<OrderBookData | null> {
    for (const exchangeName of this.PRIORITY_FEEDS) {
      try {
        const response = await axios.get(`${this.getApiUrl(exchangeName)}/depth`, {
          params: { symbol, limit: 100 }
        });

        const orderbook = response.data;
        return {
          symbol,
          bids: orderbook.bids.map(([price, quantity]: [string, string]) => 
            [price.toString(), quantity.toString()]
          ),
          asks: orderbook.asks.map(([price, quantity]: [string, string]) => 
            [price.toString(), quantity.toString()]
          ),
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`Error fetching orderbook from ${exchangeName}:`, error);
        continue;
      }
    }
    return null;
  }

  async getBlockchainData(): Promise<BlockchainData> {
    try {
      const [blockNumber, gasPrice, block] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getFeeData(),
        this.provider.getBlock('latest')
      ]);

      return {
        blockNumber,
        gasPrice: gasPrice.gasPrice?.toString() || '0',
        baseFee: block?.baseFeePerGas?.toString() || '0',
        priorityFee: gasPrice.maxPriorityFeePerGas?.toString() || '0'
      };
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
      throw error;
    }
  }

  async getPoolData(poolAddress: string): Promise<PoolData | null> {
    const poolAbi = [
      'function token0() external view returns (address)',
      'function token1() external view returns (address)',
      'function fee() external view returns (uint24)',
      'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
      'function liquidity() external view returns (uint128)'
    ];

    try {
      const poolContract = new ethers.Contract(poolAddress, poolAbi, this.provider);
      const [token0, token1, fee, slot0, liquidity] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.slot0(),
        poolContract.liquidity()
      ]);

      return {
        address: poolAddress,
        token0,
        token1,
        reserve0: liquidity.toString(),
        reserve1: slot0.sqrtPriceX96.toString(),
        fee
      };
    } catch (error) {
      console.error(`Error fetching pool data for ${poolAddress}:`, error);
      return null;
    }
  }

  cleanup(): void {
    // Close all WebSocket connections
    this.wsConnections.forEach((ws, exchange) => {
      try {
        ws.close();
        console.log(`Closed WebSocket connection for ${exchange}`);
      } catch (error) {
        console.error(`Error closing WebSocket for ${exchange}:`, error);
      }
    });
    
    // Clear all maps
    this.wsConnections.clear();
    this.priceCache.clear();
    this.exchanges.clear();
    
    // Remove blockchain listeners
    this.provider.removeAllListeners();
  }
}