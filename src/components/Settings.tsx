import React, { useState } from 'react';
import { Save, RefreshCw, AlertTriangle } from 'lucide-react';
import type { Strategy, TradingParameters } from '../types/trading';

interface SettingsProps {
  strategies: Strategy[];
  tradingParams: TradingParameters;
  onStrategyToggle: (index: number) => void;
  onParameterChange: (field: keyof TradingParameters, value: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ tradingParams, onParameterChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const handleSave = async () => {
    setIsLoading(true);
    setSavedMessage('');
    
    try {
      // Simulate saving settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSavedMessage('Settings saved successfully!');
    } catch (error) {
      setSavedMessage('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    onParameterChange('gasPrice', '15');
    onParameterChange('slippageTolerance', '0.5');
    onParameterChange('maxPositionSize', '10');
    setSavedMessage('Settings reset to defaults');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="card p-6">
        <h2 className="text-xl font-bold mb-6">Trading Parameters</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Gas Price (Gwei)
            </label>
            <input
              type="number"
              value={tradingParams.gasPrice}
              onChange={(e) => onParameterChange('gasPrice', e.target.value)}
              className="input-field"
              placeholder="15"
              min="0"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Slippage Tolerance (%)
            </label>
            <input
              type="number"
              value={tradingParams.slippageTolerance}
              onChange={(e) => onParameterChange('slippageTolerance', e.target.value)}
              className="input-field"
              placeholder="0.5"
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Position Size (ETH)
            </label>
            <input
              type="number"
              value={tradingParams.maxPositionSize}
              onChange={(e) => onParameterChange('maxPositionSize', e.target.value)}
              className="input-field"
              placeholder="10"
              min="0"
              step="0.1"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              <Save size={20} />
              Save Changes
            </button>

            <button
              onClick={handleReset}
              disabled={isLoading}
              className="btn flex-1 bg-gray-700 hover:bg-gray-600"
            >
              <RefreshCw size={20} />
              Reset Defaults
            </button>
          </div>

          {savedMessage && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              savedMessage.includes('Failed') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
            }`}>
              {savedMessage.includes('Failed') ? (
                <AlertTriangle size={18} />
              ) : (
                <Save size={18} />
              )}
              {savedMessage}
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold mb-6">Network Settings</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              RPC Endpoint
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="https://..."
              value="https://mainnet.infura.io/v3/your-project-id"
              disabled
            />
            <p className="mt-2 text-sm text-gray-400">
              Contact support to change RPC endpoint
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Chain ID
            </label>
            <input
              type="number"
              className="input-field"
              value="1"
              disabled
            />
            <p className="mt-2 text-sm text-gray-400">
              Currently supporting Ethereum Mainnet only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;