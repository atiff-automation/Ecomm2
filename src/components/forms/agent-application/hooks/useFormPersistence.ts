/**
 * Form Persistence Hook
 * Handles local storage persistence for multi-step form data
 * Following CLAUDE.md principles: Centralized state management
 */

import { useEffect, useCallback } from 'react';
import { AgentApplicationFormData } from '@/types/agent-application';

const STORAGE_KEY = 'agent-application-form-data';
const STORAGE_VERSION = '1.0';

interface PersistedFormData {
  version: string;
  data: Partial<AgentApplicationFormData>;
  lastSaved: string;
  currentStep: number;
}

export function useFormPersistence() {
  /**
   * Save form data to localStorage
   */
  const saveFormData = useCallback(
    (data: Partial<AgentApplicationFormData>, currentStep: number) => {
      try {
        const persistedData: PersistedFormData = {
          version: STORAGE_VERSION,
          data,
          lastSaved: new Date().toISOString(),
          currentStep,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedData));
      } catch (error) {
        console.warn('Failed to save form data to localStorage:', error);
      }
    },
    []
  );

  /**
   * Load form data from localStorage
   */
  const loadFormData = useCallback((): {
    data: Partial<AgentApplicationFormData>;
    currentStep: number;
  } | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const persistedData: PersistedFormData = JSON.parse(stored);

      // Check version compatibility
      if (persistedData.version !== STORAGE_VERSION) {
        console.warn('Form data version mismatch, clearing stored data');
        clearFormData();
        return null;
      }

      // Check if data is too old (7 days)
      const lastSaved = new Date(persistedData.lastSaved);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      if (lastSaved < sevenDaysAgo) {
        console.info('Form data is too old, clearing stored data');
        clearFormData();
        return null;
      }

      return {
        data: persistedData.data,
        currentStep: persistedData.currentStep,
      };
    } catch (error) {
      console.warn('Failed to load form data from localStorage:', error);
      clearFormData();
      return null;
    }
  }, []);

  /**
   * Clear form data from localStorage
   */
  const clearFormData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear form data from localStorage:', error);
    }
  }, []);

  /**
   * Check if there's saved form data
   */
  const hasSavedData = useCallback((): boolean => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return false;
      }

      const persistedData: PersistedFormData = JSON.parse(stored);
      return persistedData.version === STORAGE_VERSION;
    } catch {
      return false;
    }
  }, []);

  /**
   * Auto-save effect for form data
   */
  const useAutoSave = (
    data: Partial<AgentApplicationFormData>,
    currentStep: number,
    interval: number = 30000 // 30 seconds
  ) => {
    useEffect(() => {
      const timer = setInterval(() => {
        // Only save if there's actual data
        const hasData = Object.keys(data).some(key => {
          const value = data[key as keyof AgentApplicationFormData];
          return value !== undefined && value !== '' && value !== false;
        });

        if (hasData) {
          saveFormData(data, currentStep);
        }
      }, interval);

      return () => clearInterval(timer);
    }, [data, currentStep, interval, saveFormData]);
  };

  /**
   * Get storage info for debugging
   */
  const getStorageInfo = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const persistedData: PersistedFormData = JSON.parse(stored);
      return {
        version: persistedData.version,
        lastSaved: persistedData.lastSaved,
        currentStep: persistedData.currentStep,
        dataKeys: Object.keys(persistedData.data),
        size: stored.length,
      };
    } catch {
      return null;
    }
  }, []);

  return {
    saveFormData,
    loadFormData,
    clearFormData,
    hasSavedData,
    useAutoSave,
    getStorageInfo,
  };
}
