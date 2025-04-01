import React from 'react';
import { LineChart as LineChartIcon, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import type { Strategy, TradingParameters } from '../types/trading';

interface AnalyticsProps {
  strategies: Strategy[];
  tradingParams: TradingParameters;
  onStrategyToggle: (index: number) => void;
  onParameterChange: (field: keyof TradingParameters, value: string) => void;
}

const Analytics: React.FC<AnalyticsProps> = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="card p-6">
        <h2 className="text-xl font-bold mb-6">Performance Metrics</h2>
        <div className="space-y-6">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <LineChartIcon size={24} className="text-blue-500" />
              <div>
                <div className="text-sm text-gray-400">Total Profit/Loss</div>
                <div className="text-2xl font-bold text-green-500">+$12,450.00</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3">
              <PieChartIcon size={24} className="text-purple-500" />
              <div>
                <div className="text-sm text-gray-400">Success Rate</div>
                <div className="text-2xl font-bold">85.5%</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3">
              <BarChartIcon size={24} className="text-green-500" />
              <div>
                <div className="text-sm text-gray-400">Total Trades</div>
                <div className="text-2xl font-bold">156</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold mb-6">Strategy Performance</h2>
        <div className="space-y-4">
          {[
            { name: 'Sandwich Trading', profit: '+$5,230', trades: 45, successRate: '88%' },
            { name: 'Arbitrage', profit: '+$4,120', trades: 62, successRate: '92%' },
            { name: 'Flash Loan', profit: '+$3,100', trades: 49, successRate: '76%' }
          ].map((strategy, index) => (
            <div key={index} className="stat-card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{strategy.name}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {strategy.trades} trades • {strategy.successRate} success
                  </div>
                </div>
                <div className="text-lg font-bold text-green-500">
                  {strategy.profit}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;