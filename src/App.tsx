import React, { Suspense, lazy, useState, useCallback, useMemo } from 'react';
import { 
  LineChart, 
  Wallet, 
  ArrowUpDown, 
  Activity, 
  Settings as SettingsIcon, 
  History,
  PieChart,
  Layers,
  Zap,
  Menu,
  X
} from 'lucide-react';

// Lazy load components
const Dashboard = lazy(() => import('./components/Dashboard'));
const Trading = lazy(() => import('./components/Trading'));
const Analytics = lazy(() => import('./components/Analytics'));
const Portfolio = lazy(() => import('./components/Portfolio'));
const SettingsPanel = lazy(() => import('./components/Settings'));

interface TradingParameters {
  gasPrice: string;
  slippageTolerance: string;
  maxPositionSize: string;
}

interface Strategy {
  name: string;
  enabled: boolean;
}

// Personal wallet configuration
const PERSONAL_WALLET = {
  address: '0x1234567890123456789012345678901234567890', // Replace with your wallet address
  isConnected: true
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [tradingParams, setTradingParams] = useState<TradingParameters>({
    gasPrice: '',
    slippageTolerance: '',
    maxPositionSize: ''
  });
  const [strategies, setStrategies] = useState<Strategy[]>([
    { name: 'Sandwich Trading', enabled: false },
    { name: 'Arbitrage', enabled: false },
    { name: 'Liquidation Protection', enabled: false },
    { name: 'Flash Loan Trading', enabled: false }
  ]);

  const handleStrategyToggle = useCallback((index: number) => {
    setStrategies(prevStrategies => 
      prevStrategies.map((strategy, i) => 
        i === index ? { ...strategy, enabled: !strategy.enabled } : strategy
      )
    );
  }, []);

  const handleParameterChange = useCallback((field: keyof TradingParameters, value: string) => {
    setTradingParams(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const navigationItems = useMemo(() => [
    { icon: LineChart, label: 'Dashboard', id: 'dashboard', component: Dashboard },
    { icon: ArrowUpDown, label: 'Trading', id: 'trading', component: Trading },
    { icon: Activity, label: 'Analytics', id: 'analytics', component: Analytics },
    { icon: Wallet, label: 'Portfolio', id: 'portfolio', component: Portfolio },
    { icon: History, label: 'History', id: 'history' },
    { icon: SettingsIcon, label: 'Settings', id: 'settings', component: SettingsPanel }
  ], []);

  const selectedComponent = useMemo(() => {
    const item = navigationItems.find(item => item.id === selectedTab);
    return item?.component;
  }, [selectedTab, navigationItems]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div 
        className={`fixed lg:relative left-0 top-0 h-full ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-800 border-r border-gray-700 transition-all duration-300 z-50`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-xl">
              <Zap size={24} />
            </div>
            {isSidebarOpen && <span className="font-bold text-xl">FlashMEV</span>}
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-4">
            {navigationItems.map(({ icon: Icon, label, id }) => (
              <button
                key={id}
                onClick={() => setSelectedTab(id)}
                className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors
                  ${selectedTab === id ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
              >
                <Icon size={20} />
                {isSidebarOpen && <span>{label}</span>}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)}
            </h1>
            <p className="text-gray-400">Welcome back</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-gray-800 p-3 rounded-lg">
              <span className="text-blue-400">
                {PERSONAL_WALLET.address.slice(0, 6)}...{PERSONAL_WALLET.address.slice(-4)}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Content with Suspense */}
        <Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        }>
          {selectedComponent && React.createElement(selectedComponent, {
            strategies,
            tradingParams,
            onStrategyToggle: handleStrategyToggle,
            onParameterChange: handleParameterChange,
            wallet: PERSONAL_WALLET
          })}
        </Suspense>
      </div>
    </div>
  );
}

export default App;