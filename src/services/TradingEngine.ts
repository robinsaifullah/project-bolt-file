import { ethers } from 'ethers';
import Decimal from 'decimal.js';
import { DataFeeds } from './DataFeeds';
import type { OrderBookData, PriceData, Position } from '../types/api';
import type { TradingParameters } from '../types/trading';

interface TradeParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  maxSlippage: number;
  deadline: number;
}

interface ExecutionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gasUsed?: string;
  effectivePrice?: string;
  position?: Position;
}

export class TradingEngine {
  private static instance: TradingEngine;
  private dataFeeds: DataFeeds;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly DEFAULT_DEADLINE = 20 * 60; // 20 minutes

  private constructor() {
    this.dataFeeds = DataFeeds.getInstance();
  }

  public static getInstance(): TradingEngine {
    if (!TradingEngine.instance) {
      TradingEngine.instance = new TradingEngine();
    }
    return TradingEngine.instance;
  }

  private async validateAndPrepareTrade(params: TradeParams): Promise<boolean> {
    try {
      // Validate token addresses
      if (!ethers.isAddress(params.tokenIn) || !ethers.isAddress(params.tokenOut)) {
        throw new Error('Invalid token addresses');
      }

      // Validate amounts
      const amountIn = new Decimal(params.amountIn);
      const minAmountOut = new Decimal(params.minAmountOut);
      
      if (amountIn.lte(0) || minAmountOut.lte(0)) {
        throw new Error('Invalid amounts');
      }

      // Validate slippage
      if (params.maxSlippage < 0 || params.maxSlippage > 100) {
        throw new Error('Invalid slippage percentage');
      }

      // Validate deadline
      const now = Math.floor(Date.now() / 1000);
      if (params.deadline <= now) {
        throw new Error('Trade deadline has passed');
      }

      return true;
    } catch (error) {
      console.error('Trade validation failed:', error);
      return false;
    }
  }

  private calculateOptimalAmount(
    orderBook: OrderBookData,
    targetAmount: string,
    side: 'buy' | 'sell'
  ): { amount: string; price: string; priceImpact: string } {
    const orders = side === 'buy' ? orderBook.asks : orderBook.bids;
    let remainingAmount = new Decimal(targetAmount);
    let totalCost = new Decimal(0);
    let basePrice = new Decimal(orders[0][0]);
    
    for (const [price, quantity] of orders) {
      const orderQuantity = new Decimal(quantity);
      const orderPrice = new Decimal(price);
      
      if (remainingAmount.lte(orderQuantity)) {
        totalCost = totalCost.plus(remainingAmount.times(orderPrice));
        remainingAmount = new Decimal(0);
        break;
      }
      
      totalCost = totalCost.plus(orderQuantity.times(orderPrice));
      remainingAmount = remainingAmount.minus(orderQuantity);
    }
    
    if (remainingAmount.gt(0)) {
      throw new Error('Insufficient liquidity for desired amount');
    }
    
    const avgPrice = totalCost.div(new Decimal(targetAmount));
    const priceImpact = avgPrice.minus(basePrice).div(basePrice).times(100).abs();
    
    return {
      amount: targetAmount,
      price: avgPrice.toString(),
      priceImpact: priceImpact.toString()
    };
  }

  async executeTrade(
    params: TradeParams,
    tradingParams: TradingParameters
  ): Promise<ExecutionResult> {
    let retries = 0;
    
    while (retries < this.MAX_RETRIES) {
      try {
        // Validate trade parameters
        const isValid = await this.validateAndPrepareTrade(params);
        if (!isValid) {
          return { success: false, error: 'Trade validation failed' };
        }

        // Get order book data
        const orderBook = await this.dataFeeds.getOrderBook(`${params.tokenIn}/${params.tokenOut}`);
        if (!orderBook) {
          throw new Error('Failed to fetch order book data');
        }

        // Calculate optimal execution
        const { amount, price, priceImpact } = this.calculateOptimalAmount(
          orderBook,
          params.amountIn,
          'buy'
        );

        // Check if price impact exceeds slippage tolerance
        if (new Decimal(priceImpact).gt(params.maxSlippage)) {
          throw new Error('Price impact exceeds slippage tolerance');
        }

        // Create position object
        const position: Position = {
          pair: `${params.tokenIn}/${params.tokenOut}`,
          amount: amount,
          entryPrice: price,
          timestamp: Date.now(),
          type: 'Market',
          status: 'Open'
        };

        // In a real implementation, this would execute the trade on-chain
        // For now, we'll simulate success
        return {
          success: true,
          transactionHash: '0x' + Math.random().toString(16).slice(2),
          gasUsed: '150000',
          effectivePrice: price,
          position
        };

      } catch (error) {
        retries++;
        if (retries === this.MAX_RETRIES) {
          return {
            success: false,
            error: `Trade execution failed: ${error}`
          };
        }
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded'
    };
  }

  async simulateTrade(
    params: TradeParams,
    tradingParams: TradingParameters
  ): Promise<{
    expectedOutput: string;
    priceImpact: string;
    gasCost: string;
    estimatedFees: string;
  }> {
    try {
      // Get order book data
      const orderBook = await this.dataFeeds.getOrderBook(`${params.tokenIn}/${params.tokenOut}`);
      if (!orderBook) {
        throw new Error('Failed to fetch order book data');
      }

      // Calculate execution parameters
      const { price, priceImpact } = this.calculateOptimalAmount(
        orderBook,
        params.amountIn,
        'buy'
      );

      // Get current gas prices
      const blockchainData = await this.dataFeeds.getBlockchainData();
      const gasPrice = new Decimal(blockchainData.gasPrice);
      const estimatedGas = new Decimal('150000'); // Estimated gas for a swap

      // Calculate costs
      const gasCost = gasPrice.times(estimatedGas).toString();
      const estimatedFees = new Decimal(price)
        .times(params.amountIn)
        .times(new Decimal('0.003')) // 0.3% fee
        .toString();

      return {
        expectedOutput: new Decimal(params.amountIn).times(price).toString(),
        priceImpact,
        gasCost,
        estimatedFees
      };
    } catch (error) {
      console.error('Trade simulation failed:', error);
      throw error;
    }
  }

  cleanup(): void {
    // Cleanup any resources if needed
  }
}