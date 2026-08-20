import { useState, useCallback } from 'react';
import { InBodyRepository } from '../../core/repositories/inbodyRepository';
import type { InBodyRecord } from '../../core/types';

export const useInBody = () => {
  const [inBodyHistory, setInBodyHistory] = useState<InBodyRecord[]>(() => InBodyRepository.getAll());

  const reload = useCallback(() => {
    setInBodyHistory([...InBodyRepository.getAll()]);
  }, []);

  const saveInBody = useCallback((record: InBodyRecord) => {
    InBodyRepository.save(record);
    reload();
  }, [reload]);

  const updateInBody = useCallback((oldDate: string, record: InBodyRecord) => {
    InBodyRepository.update(oldDate, record);
    reload();
  }, [reload]);

  const deleteInBody = useCallback((date: string) => {
    InBodyRepository.delete(date);
    reload();
  }, [reload]);

  return {
    inBodyHistory,
    saveInBody,
    updateInBody,
    deleteInBody,
    reload
  };
};
