import React, { useCallback } from 'react';
import { useAppStore } from '@/store';
import { useDataFeed } from '@/hooks/useDataFeed';
import type { Strategy, TradingParameters } from '@/types/trading';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardProps {
  strategies: Strategy[];
  tradingParams: TradingParameters;
  onStrategyToggle: (index: number) => void;
  onParameterChange: (field: keyof TradingParameters, value: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  strategies,
  tradingParams,
  onStrategyToggle,
  onParameterChange
}) => {
  const { price: ethPrice, isLoading: isEthLoading } = useDataFeed('ETH/USD');
  const { price: btcPrice, isLoading: isBtcLoading } = useDataFeed('BTC/USD');
  
  const handleParameterChange = useCallback((field: keyof TradingParameters, value: string) => {
    // Validate input before updating
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onParameterChange(field, value);
    }
  }, [onParameterChange]);

  const handleStrategyToggle = useCallback((index: number) => {
    // Add confirmation for critical strategies
    const strategy = strategies[index];
    if (strategy.name === 'Flash Loan Trading') {
      if (confirm('Flash Loan Trading can be risky. Are you sure you want to enable it?')) {
        onStrategyToggle(index);
      }
    } else {
      onStrategyToggle(index);
    }
  }, [strategies, onStrategyToggle]);

  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-xl">
          <h3 className="text-gray-400 text-sm">ETH Price</h3>
          <div className="flex items-end justify-between mt-2">
            <span className="text-2xl font-bold">
              {isEthLoading ? 'Loading...' : `$${parseFloat(ethPrice?.price || '0').toLocaleString()}`}
            </span>
            <span className="text-green-400 text-sm flex items-center">
              <TrendingUp size={16} className="mr-1" />
              +2.5%
            </span>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl">
          <h3 className="text-gray-400 text-sm">BTC Price</h3>
          <div className="flex items-end justify-between mt-2">
            <span className="text-2xl font-bold">
              {isBtcLoading ? 'Loading...' : `$${parseFloat(btcPrice?.price || '0').toLocaleString()}`}
            </span>
            <span className="text-red-400 text-sm flex items-center">
              <TrendingDown size={16} className="mr-1" />
              -1.2%
            </span>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl">
          <h3 className="text-gray-400 text-sm">Active Strategies</h3>
          <div className="flex items-end justify-between mt-2">
            <span className="text-2xl font-bold">{strategies.filter(s => s.enabled).length}</span>
            <span className="text-blue-400 text-sm">of {strategies.length}</span>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl">
          <h3 className="text-gray-400 text-sm">24h Profit</h3>
          <div className="flex items-end justify-between mt-2">
            <span className="text-2xl font-bold">$12,450</span>
            <span className="text-green-400 text-sm">+15.3%</span>
          </div>
        </div>
      </div>

      {/* Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Strategy Selection */}
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Trading Strategies</h2>
          <div className="space-y-4">
            {strategies.map((strategy, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                <div className="flex items-center space-x-3">
                  <span>{strategy.name}</span>
                  {strategy.name === 'Flash Loan Trading' && (
                    <AlertTriangle size={16} className="text-yellow-400" />
                  )}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={strategy.enabled}
                    onChange={() => handleStrategyToggle(index)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Trading Parameters */}
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Trading Parameters</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Gas Price (Gwei)</label>
              <input 
                type="number" 
                value={tradingParams.gasPrice}
                onChange={(e) => handleParameterChange('gasPrice', e.target.value)}
                min="0"
                step="0.1"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="15"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Slippage Tolerance (%)</label>
              <input 
                type="number" 
                value={tradingParams.slippageTolerance}
                onChange={(e) => handleParameterChange('slippageTolerance', e.target.value)}
                min="0"
                max="100"
                step="0.1"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="0.5"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Max Position Size (ETH)</label>
              <input 
                type="number" 
                value={tradingParams.maxPositionSize}
                onChange={(e) => handleParameterChange('maxPositionSize', e.target.value)}
                min="0"
                step="0.1"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="10"
              />
            </div>
            <button 
              onClick={() => {
                // Reset to default values
                onParameterChange('gasPrice', '15');
                onParameterChange('slippageTolerance', '0.5');
                onParameterChange('maxPositionSize', '10');
              }}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Active Positions */}
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Active Positions</h2>
          <div className="space-y-4">
            {[
              { pair: 'ETH/USDT', pnl: '+$450', type: 'Sandwich', timestamp: Date.now() },
              { pair: 'WBTC/ETH', pnl: '+$280', type: 'Arbitrage', timestamp: Date.now() - 300000 },
              { pair: 'UNI/ETH', pnl: '-$120', type: 'Flash Loan', timestamp: Date.now() - 600000 }
            ].map((position, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                <div>
                  <div className="font-medium">{position.pair}</div>
                  <div className="text-sm text-gray-400 flex items-center space-x-2">
                    <span>{position.type}</span>
                    <span>•</span>
                    <span>{new Date(position.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
                <span className={position.pnl.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                  {position.pnl}
                </span>
              </div>
            ))}
            <button 
              onClick={() => {
                // Close all positions (in a real app, this would call a trading service)
                alert('Closing all positions...');
              }}
              className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition-colors"
            >
              Close All Positions
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;