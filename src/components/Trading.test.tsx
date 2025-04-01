import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Trading from './Trading';
import { TradingEngine } from '../services/TradingEngine';

// Mock TradingEngine
vi.mock('../services/TradingEngine', () => ({
  TradingEngine: {
    getInstance: () => ({
      simulateTrade: vi.fn().mockResolvedValue({
        expectedOutput: '1.1',
        priceImpact: '0.5',
        gasCost: '0.01',
        estimatedFees: '0.005'
      }),
      executeTrade: vi.fn().mockResolvedValue({
        success: true,
        transactionHash: '0x123'
      })
    })
  }
}));

describe('Trading Component', () => {
  const mockProps = {
    strategies: [],
    tradingParams: {
      gasPrice: '50',
      slippageTolerance: '0.5',
      maxPositionSize: '10'
    },
    onStrategyToggle: vi.fn(),
    onParameterChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders trading form', () => {
    render(<Trading {...mockProps} />);
    expect(screen.getByPlaceholderText('0x...')).toBeInTheDocument();
    expect(screen.getByText('Check Profitability')).toBeInTheDocument();
    expect(screen.getByText('Execute Trade')).toBeInTheDocument();
  });

  test('validates input fields', () => {
    render(<Trading {...mockProps} />);
    const checkButton = screen.getByText('Check Profitability');
    expect(checkButton).toBeDisabled();

    // Fill in invalid values
    fireEvent.change(screen.getAllByPlaceholderText('0x...')[0], {
      target: { value: 'invalid' }
    });
    expect(screen.getByText('Invalid token address')).toBeInTheDocument();
  });

  test('checks profitability', async () => {
    render(<Trading {...mockProps} />);
    
    // Fill in valid values
    fireEvent.change(screen.getAllByPlaceholderText('0x...')[0], {
      target: { value: '0x1234567890123456789012345678901234567890' }
    });
    fireEvent.change(screen.getAllByPlaceholderText('0x...')[1], {
      target: { value: '0x0987654321098765432109876543210987654321' }
    });
    fireEvent.change(screen.getByPlaceholderText('0.0'), {
      target: { value: '1.0' }
    });

    fireEvent.click(screen.getByText('Check Profitability'));

    await waitFor(() => {
      expect(screen.getByText('Expected Profit')).toBeInTheDocument();
      expect(screen.getByText('0.085')).toBeInTheDocument(); // Net profit after gas and fees
    });
  });

  test('executes trade', async () => {
    render(<Trading {...mockProps} />);
    
    // Fill in valid values and check profitability first
    fireEvent.change(screen.getAllByPlaceholderText('0x...')[0], {
      target: { value: '0x1234567890123456789012345678901234567890' }
    });
    fireEvent.change(screen.getAllByPlaceholderText('0x...')[1], {
      target: { value: '0x0987654321098765432109876543210987654321' }
    });
    fireEvent.change(screen.getByPlaceholderText('0.0'), {
      target: { value: '1.0' }
    });

    fireEvent.click(screen.getByText('Check Profitability'));
    
    await waitFor(() => {
      expect(screen.getByText('Execute Trade')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText('Execute Trade'));

    await waitFor(() => {
      expect(screen.queryByText('Trade execution failed')).not.toBeInTheDocument();
      expect(screen.getAllByPlaceholderText('0x...')[0].value).toBe(''); // Form should reset
    });
  });
});