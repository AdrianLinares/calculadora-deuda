import { useState } from 'react';
import { FILE_LIMITS } from '@/lib/constants';

interface ImportStatus {
  type: 'success' | 'error';
  message: string;
}

export function useFileImport() {
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);

  const handleFileImport = async (
    file: File,
    onSuccess: (content: string) => void
  ) => {
    if (file.size > FILE_LIMITS.MAX_SIZE) {
      setImportStatus({
        type: 'error',
        message: 'El archivo es demasiado grande. El tamaño máximo es 5MB'
      });
      return;
    }

    try {
      const content = await file.text();
      onSuccess(content);
      setImportStatus({
        type: 'success',
        message: 'Archivo importado correctamente'
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: 'Error al leer el archivo'
      });
    }
  };

  return { importStatus, handleFileImport };
}