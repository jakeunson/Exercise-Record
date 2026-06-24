import { useState, useCallback } from 'react';
import { StorageService } from '../services/storage';
import type { InBodyRecord } from '../types';

export const useInBodyState = () => {
  const [inBodyHistory, setInBodyHistory] = useState<InBodyRecord[]>(() => StorageService.getInBodyHistory());

  const saveInBody = useCallback((record: InBodyRecord) => {
    StorageService.saveInBody(record);
    setInBodyHistory(StorageService.getInBodyHistory());
  }, []);

  const updateInBody = useCallback((oldDate: string, record: InBodyRecord) => {
    StorageService.updateInBody(oldDate, record);
    setInBodyHistory(StorageService.getInBodyHistory());
  }, []);

  const deleteInBody = useCallback((date: string) => {
    StorageService.deleteInBody(date);
    setInBodyHistory(StorageService.getInBodyHistory());
  }, []);

  const reloadInBody = useCallback(() => {
    setInBodyHistory(StorageService.getInBodyHistory());
  }, []);

  return {
    inBodyHistory,
    saveInBody,
    updateInBody,
    deleteInBody,
    reloadInBody
  };
};
