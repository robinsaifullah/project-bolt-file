import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { Strategy, TradingParameters } from '../types/trading';

interface PortfolioProps {
  strategies: Strategy[];
  tradingParams: TradingParameters;
  onStrategyToggle: (index: number) => void;
  onParameterChange: (field: keyof TradingParameters, value: string) => void;
}

const Portfolio: React.FC<PortfolioProps> = () => {
  const portfolioStats = {
    totalValue: '$45,230.50',
    todayChange: '+$1,245.30',
    todayPercentage: '+2.8%',
    monthChange: '+$12,450.00',
    monthPercentage: '+32.5%'
  };

  const assets = [
    { name: 'ETH', value: '$25,450.30', amount: '12.5 ETH', change: '+3.2%' },
    { name: 'WBTC', value: '$15,230.20', amount: '0.45 WBTC', change: '-1.2%' },
    { name: 'USDT', value: '$4,550.00', amount: '4,550 USDT', change: '0%' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="card p-6">
        <h2 className="text-xl font-bold mb-6">Portfolio Overview</h2>
        
        <div className="space-y-6">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Total Portfolio Value</div>
                <div className="text-2xl font-bold mt-1">{portfolioStats.totalValue}</div>
              </div>
              <Activity size={24} className="text-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card">
              <div className="text-sm text-gray-400">24h Change</div>
              <div className="text-xl font-bold mt-1 text-green-500 flex items-center gap-2">
                {portfolioStats.todayChange}
                <span className="text-sm">({portfolioStats.todayPercentage})</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="text-sm text-gray-400">30d Change</div>
              <div className="text-xl font-bold mt-1 text-green-500 flex items-center gap-2">
                {portfolioStats.monthChange}
                <span className="text-sm">({portfolioStats.monthPercentage})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold mb-6">Assets</h2>
        
        <div className="space-y-4">
          {assets.map((asset, index) => (
            <div key={index} className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{asset.name}</div>
                  <div className="text-sm text-gray-400 mt-1">{asset.amount}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{asset.value}</div>
                  <div className={`text-sm mt-1 flex items-center justify-end gap-1 ${
                    asset.change.startsWith('+') ? 'text-green-500' : 
                    asset.change.startsWith('-') ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {asset.change.startsWith('+') ? (
                      <TrendingUp size={16} />
                    ) : asset.change.startsWith('-') ? (
                      <TrendingDown size={16} />
                    ) : (
                      <DollarSign size={16} />
                    )}
                    {asset.change}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;