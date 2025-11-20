import { useState, useEffect } from 'react';

interface StorageError extends Error {
  type: 'read' | 'write';
  key: string;
}

const createStorageError = (type: 'read' | 'write', key: string, originalError: unknown): StorageError => {
  const error = new Error(`Failed to ${type} from localStorage for key "${key}"`) as StorageError;
  error.type = type;
  error.key = key;
  error.cause = originalError;
  return error;
};

const checkStorageSpace = () => {
  try {
    const testKey = `__storage_test_${Math.random()}`;
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

export function useLocalStorage<T>(
  key: string, 
  initialValue: T,
  onError?: (error: StorageError) => void
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      onError?.(createStorageError('read', key, error));
      return initialValue;
    }
  });

  useEffect(() => {
    if (!checkStorageSpace()) {
      onError?.(createStorageError('write', key, new Error('localStorage is full')));
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (error) {
          onError?.(createStorageError('read', key, error));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, onError]);

  const setValue = (valueOrFn: T | ((prev: T) => T)) => {
    try {
      const newValue = valueOrFn instanceof Function ? valueOrFn(storedValue) : valueOrFn;
      
      // Validate that value can be serialized
      JSON.stringify(newValue);
      
      setStoredValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      onError?.(createStorageError('write', key, error));
    }
  };
  
  return [storedValue, setValue];
}