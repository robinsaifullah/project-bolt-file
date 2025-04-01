import { useEffect } from 'react';

export const useImagePreload = (imageSources: string[]) => {
  useEffect(() => {
    imageSources.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [imageSources]);
};

export const useDeferredLoad = (callback: () => void, delay = 100) => {
  useEffect(() => {
    const timeoutId = setTimeout(callback, delay);
    return () => clearTimeout(timeoutId);
  }, [callback, delay]);
};

export const measurePerformance = (label: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.time(label);
    return () => console.timeEnd(label);
  }
  return () => {};
};