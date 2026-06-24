import { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';

export const useStorage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initStorage = async () => {
      try {
        await StorageService.init();
        if (mounted) {
          setIsLoaded(true);
        }
      } catch (err) {
        console.error('Storage init failed:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Storage init failed'));
          setIsLoaded(true);
        }
      }
    };

    initStorage();

    return () => {
      mounted = false;
    };
  }, []);

  return { isLoaded, error };
};
