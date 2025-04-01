import React, { useState, useCallback } from 'react';
import { 
  ArrowRight, 
  Calculator, 
  DollarSign, 
  AlertTriangle,
  Loader2,
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import type { Strategy, TradingParameters } from '../types/trading';
import { TradingEngine } from '../services/TradingEngine';
import { validateTokenAddress, validateAmount } from '../utils/validation';
import Decimal from 'decimal.js';

interface TradingProps {
  strategies: Strategy[];
  tradingParams: TradingParameters;
  onStrategyToggle: (index: number) => void;
  onParameterChange: (field: keyof TradingParameters, value: string) => void;
}

const Trading: React.FC<TradingProps> = ({ tradingParams }) => {
  const [tokenIn, setTokenIn] = useState('');
  const [tokenOut, setTokenOut] = useState('');
  const [amount, setAmount] = useState('');
  const [profitability, setProfitability] = useState<{
    expectedProfit: string;
    gasCost: string;
    netProfit: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    tokenIn?: string;
    tokenOut?: string;
    amount?: string;
  }>({});

  const tradingEngine = TradingEngine.getInstance();

  const validateInputs = useCallback(() => {
    const errors: typeof validationErrors = {};

    if (tokenIn && !validateTokenAddress(tokenIn)) {
      errors.tokenIn = 'Invalid token address';
    }
    if (tokenOut && !validateTokenAddress(tokenOut)) {
      errors.tokenOut = 'Invalid token address';
    }
    if (amount && !validateAmount(amount)) {
      errors.amount = 'Invalid amount';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [tokenIn, tokenOut, amount]);

  const checkProfitability = async () => {
    if (!validateInputs()) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = {
        tokenIn,
        tokenOut,
        amountIn: amount,
        minAmountOut: '0',
        maxSlippage: Number(tradingParams.slippageTolerance) || 0.5,
        deadline: Math.floor(Date.now() / 1000) + 1200
      };

      const simulation = await tradingEngine.simulateTrade(params, tradingParams);
      
      const expectedOutput = new Decimal(simulation.expectedOutput);
      const inputCost = new Decimal(amount);
      const gasCost = new Decimal(simulation.gasCost);
      const fees = new Decimal(simulation.estimatedFees);
      
      const grossProfit = expectedOutput.minus(inputCost);
      const netProfit = grossProfit.minus(gasCost).minus(fees);

      setProfitability({
        expectedProfit: grossProfit.toFixed(6),
        gasCost: gasCost.toFixed(6),
        netProfit: netProfit.toFixed(6)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check profitability');
    } finally {
      setIsLoading(false);
    }
  };

  const executeTrade = async () => {
    if (!validateInputs()) return;

    if (!profitability || new Decimal(profitability.netProfit).lte(0)) {
      setError('Trade is not profitable');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = {
        tokenIn,
        tokenOut,
        amountIn: amount,
        minAmountOut: new Decimal(amount)
          .times(1 + Number(tradingParams.slippageTolerance) / 100)
          .toString(),
        maxSlippage: Number(tradingParams.slippageTolerance) || 0.5,
        deadline: Math.floor(Date.now() / 1000) + 1200
      };

      const result = await tradingEngine.executeTrade(params, tradingParams);

      if (!result.success) {
        throw new Error(result.error || 'Trade execution failed');
      }

      setTokenIn('');
      setTokenOut('');
      setAmount('');
      setProfitability(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute trade');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Trade Execution</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Connected
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token In (Address)
            </label>
            <input
              type="text"
              value={tokenIn}
              onChange={(e) => {
                setTokenIn(e.target.value);
                setValidationErrors(prev => ({ ...prev, tokenIn: undefined }));
              }}
              className={`input-field ${
                validationErrors.tokenIn ? 'border-red-500' : ''
              }`}
              placeholder="0x..."
            />
            {validationErrors.tokenIn && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                <AlertTriangle size={14} />
                {validationErrors.tokenIn}
              </p>
            )}
          </div>

          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-8 h-8 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Out (Address)
            </label>
            <input
              type="text"
              value={tokenOut}
              onChange={(e) => {
                setTokenOut(e.target.value);
                setValidationErrors(prev => ({ ...prev, tokenOut: undefined }));
              }}
              className={`input-field ${
                validationErrors.tokenOut ? 'border-red-500' : ''
              }`}
              placeholder="0x..."
            />
            {validationErrors.tokenOut && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                <AlertTriangle size={14} />
                {validationErrors.tokenOut}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setValidationErrors(prev => ({ ...prev, amount: undefined }));
              }}
              className={`input-field ${
                validationErrors.amount ? 'border-red-500' : ''
              }`}
              placeholder="0.0"
              min="0"
              step="0.000001"
            />
            {validationErrors.amount && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                <AlertTriangle size={14} />
                {validationErrors.amount}
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={checkProfitability}
              disabled={isLoading || !tokenIn || !tokenOut || !amount}
              className="btn-primary flex-1"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Calculator size={20} />
              )}
              Check Profitability
            </button>

            <button
              onClick={executeTrade}
              disabled={isLoading || !profitability || new Decimal(profitability?.netProfit || '0').lte(0)}
              className="btn-success flex-1"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <ArrowRight size={20} />
              )}
              Execute Trade
            </button>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold mb-6">Profitability Analysis</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {profitability && (
          <div className="space-y-4">
            <div className="stat-card">
              <div className="text-sm font-medium text-gray-400 mb-1">Expected Profit</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <DollarSign size={24} className="text-green-500" />
                {profitability.expectedProfit}
                <TrendingUp size={20} className="text-green-500 ml-auto" />
              </div>
            </div>

            <div className="stat-card">
              <div className="text-sm font-medium text-gray-400 mb-1">Gas Cost</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <DollarSign size={24} className="text-red-500" />
                {profitability.gasCost}
                <TrendingDown size={20} className="text-red-500 ml-auto" />
              </div>
            </div>

            <div className="stat-card">
              <div className="text-sm font-medium text-gray-400 mb-1">Net Profit</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                <DollarSign size={24} className={
                  profitability.netProfit.startsWith('-') ? 'text-red-500' : 'text-green-500'
                } />
                {profitability.netProfit}
                {profitability.netProfit.startsWith('-') ? (
                  <TrendingDown size={20} className="text-red-500 ml-auto" />
                ) : (
                  <TrendingUp size={20} className="text-green-500 ml-auto" />
                )}
              </div>
            </div>
          </div>
        )}

        {!profitability && !error && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Calculator size={48} className="mb-4 text-gray-500" />
            <p className="text-lg">Check trade profitability to see analysis</p>
            <p className="text-sm mt-2">Enter token addresses and amount above</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trading;