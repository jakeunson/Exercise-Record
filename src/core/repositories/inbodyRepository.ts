import localforage from 'localforage';
import { StorageKeys, loadSafe } from './storageInit';
import type { InBodyRecord } from '../types';

const cache = {
  inBody: [] as InBodyRecord[],
};

export const InBodyRepository = {
  init: async () => {
    cache.inBody = await loadSafe(StorageKeys.INBODY, []);
  },

  getAll: () => cache.inBody,

  save: (record: InBodyRecord) => {
    const updated = [record, ...cache.inBody.filter(r => r.date !== record.date)];
    cache.inBody = updated.sort((a, b) => b.date.localeCompare(a.date));
    localforage.setItem(StorageKeys.INBODY, cache.inBody);
  },

  update: (oldDate: string, record: InBodyRecord) => {
    let history = cache.inBody.filter(r => r.date !== oldDate && r.date !== record.date);
    cache.inBody = [record, ...history].sort((a, b) => b.date.localeCompare(a.date));
    localforage.setItem(StorageKeys.INBODY, cache.inBody);
  },

  delete: (date: string) => {
    cache.inBody = cache.inBody.filter(r => r.date !== date);
    localforage.setItem(StorageKeys.INBODY, cache.inBody);
  },

  setAll: (records: InBodyRecord[]) => {
    cache.inBody = records;
    localforage.setItem(StorageKeys.INBODY, records);
  }
};
