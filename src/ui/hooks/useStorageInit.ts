import { useState, useEffect } from 'react';
import { initStorage } from '../../core/repositories';

export const useStorageInit = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initStorage()
      .then(() => setIsLoaded(true))
      .catch((e) => {
        console.error('Storage Init failed', e);
        setError(e);
      });
  }, []);

  return { isLoaded, error };
};
