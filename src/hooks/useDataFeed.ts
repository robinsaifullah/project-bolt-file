import useSWR from 'swr';
import { DataFeeds } from '@/services/DataFeeds';

const dataFeeds = DataFeeds.getInstance();

export function useDataFeed(symbol: string) {
  const { data, error, mutate } = useSWR(
    `price/${symbol}`,
    () => dataFeeds.getPrices([symbol]),
    {
      refreshInterval: 1000,
      revalidateOnFocus: true,
      dedupingInterval: 500
    }
  );

  return {
    price: data?.[0],
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  };
}