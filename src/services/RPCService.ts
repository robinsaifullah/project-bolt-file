import { ethers } from 'ethers';
import axios from 'axios';

interface RPCEndpoint {
  url: string;
  weight: number;
  failureCount: number;
  lastFailure: number;
  isAlive: boolean;
}

export class RPCService {
  private endpoints: RPCEndpoint[];
  private providers: Map<string, ethers.JsonRpcProvider>;
  private healthCheckInterval: NodeJS.Timeout;
  private readonly MAX_FAILURES = 3;
  private readonly FAILURE_RESET_TIME = 5 * 60 * 1000; // 5 minutes
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private requestCounts: Map<string, number[]>;

  constructor(endpoints: { url: string; weight: number }[]) {
    this.endpoints = endpoints.map(e => ({
      ...e,
      failureCount: 0,
      lastFailure: 0,
      isAlive: true
    }));
    this.providers = new Map();
    this.requestCounts = new Map();
    
    // Initialize providers
    this.endpoints.forEach(endpoint => {
      this.providers.set(endpoint.url, new ethers.JsonRpcProvider(endpoint.url));
      this.requestCounts.set(endpoint.url, []);
    });

    // Start health checks
    this.healthCheckInterval = setInterval(() => this.checkHealth(), 30000);
  }

  private async checkHealth(): Promise<void> {
    for (const endpoint of this.endpoints) {
      try {
        const provider = this.providers.get(endpoint.url);
        if (!provider) continue;

        await provider.getBlockNumber();
        
        // Reset failure count on successful health check
        endpoint.failureCount = 0;
        endpoint.isAlive = true;
      } catch (error) {
        this.handleEndpointFailure(endpoint);
      }
    }
  }

  private handleEndpointFailure(endpoint: RPCEndpoint): void {
    const now = Date.now();
    
    // Reset failure count if enough time has passed
    if (now - endpoint.lastFailure > this.FAILURE_RESET_TIME) {
      endpoint.failureCount = 0;
    }

    endpoint.failureCount++;
    endpoint.lastFailure = now;

    if (endpoint.failureCount >= this.MAX_FAILURES) {
      endpoint.isAlive = false;
      console.error(`RPC endpoint ${endpoint.url} marked as dead after ${this.MAX_FAILURES} failures`);
    }
  }

  private isRateLimited(endpoint: RPCEndpoint): boolean {
    const now = Date.now();
    const requests = this.requestCounts.get(endpoint.url) || [];
    
    // Clean up old requests
    const recentRequests = requests.filter(time => now - time < this.RATE_LIMIT_WINDOW);
    this.requestCounts.set(endpoint.url, recentRequests);

    // Check if we're over the rate limit (100 requests per minute per endpoint)
    return recentRequests.length >= 100;
  }

  private selectEndpoint(): RPCEndpoint {
    const availableEndpoints = this.endpoints.filter(e => e.isAlive && !this.isRateLimited(e));
    
    if (availableEndpoints.length === 0) {
      throw new Error('No healthy RPC endpoints available');
    }

    // Weighted random selection
    const totalWeight = availableEndpoints.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of availableEndpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }

    return availableEndpoints[0];
  }

  async request<T>(method: string, params: any[]): Promise<T> {
    const endpoint = this.selectEndpoint();
    const provider = this.providers.get(endpoint.url);
    
    if (!provider) {
      throw new Error(`No provider found for endpoint ${endpoint.url}`);
    }

    try {
      // Record the request
      const requests = this.requestCounts.get(endpoint.url) || [];
      requests.push(Date.now());
      this.requestCounts.set(endpoint.url, requests);

      // Make the request
      const result = await provider.send(method, params);
      return result as T;
    } catch (error) {
      this.handleEndpointFailure(endpoint);
      throw error;
    }
  }

  async getProvider(): Promise<ethers.JsonRpcProvider> {
    const endpoint = this.selectEndpoint();
    const provider = this.providers.get(endpoint.url);
    
    if (!provider) {
      throw new Error('No provider available');
    }

    return provider;
  }

  cleanup(): void {
    clearInterval(this.healthCheckInterval);
  }
}