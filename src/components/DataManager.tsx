import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Debt } from '@/lib/debtCalculations';
import { toast } from '@/hooks/use-toast';
import { ErrorBoundary } from 'react-error-boundary';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DataManagerProps {
  debts: Debt[];
  monthlyBudget: number;
  onImportDebts: (debts: Debt[]) => void;
  onImportBudget: (budget: number) => void;
}

interface ExportData {
  version: string;
  exportDate: string;
  debts: Debt[];
  monthlyBudget: number;
  metadata: {
    totalDebts: number;
    totalAmount: number;
    totalMinimumPayments: number;
  };
}

const FILE_CONSTANTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['application/json'],
  VERSION: '1.0.0'
} as const;

export function DataManager({ debts, monthlyBudget, onImportDebts, onImportBudget }: DataManagerProps) {
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const exportToJSON = async () => {
    try {
      setDownloadProgress(0);
      setIsLoading(true);
      
      // Simulate progress
      const interval = setInterval(() => {
        setDownloadProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      
      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        debts: debts,
        monthlyBudget: monthlyBudget,
        metadata: {
          totalDebts: debts.length,
          totalAmount: debts.reduce((sum, debt) => sum + debt.balance, 0),
          totalMinimumPayments: debts.reduce((sum, debt) => sum + debt.minimumPayment, 0)
        }
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      
      const fileName = `deudas_bola_nieve_${new Date().toISOString().split('T')[0]}.json`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setImportStatus({
        type: 'success',
        message: `Datos exportados exitosamente como ${fileName}`
      });

      toast({
        title: "Éxito",
        description: "Datos exportados correctamente",
      });

      // Clear message after 5 seconds
      setTimeout(() => {
        setImportStatus({ type: null, message: '' });
      }, 5000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al exportar datos",
        variant: "destructive",
      });
    } finally {
      setDownloadProgress(100);
      setIsLoading(false);
      setTimeout(() => setDownloadProgress(0), 1000);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Add file size check
    if (file.size > FILE_CONSTANTS.MAX_SIZE) {
      setImportStatus({
        type: 'error',
        message: 'El archivo es demasiado grande. El tamaño máximo es 5MB'
      });
      return;
    }

    if (!FILE_CONSTANTS.ALLOWED_TYPES.includes(file.type)) {
      setImportStatus({
        type: 'error',
        message: 'Por favor selecciona un archivo JSON válido'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content) as ExportData;

        // Validate the imported data structure
        if (!importData.debts || !Array.isArray(importData.debts)) {
          throw new Error('Estructura de datos inválida: no se encontraron deudas');
        }

        // Validate each debt object
        const validatedDebts: Debt[] = importData.debts.map((debt, index) => {
          if (!debt.id || !debt.name || typeof debt.balance !== 'number' || 
              typeof debt.interestRate !== 'number' || typeof debt.minimumPayment !== 'number' || 
              !debt.startDate) {
            throw new Error(`Deuda ${index + 1} tiene datos inválidos`);
          }

          return {
            id: debt.id,
            name: debt.name,
            balance: Number(debt.balance),
            interestRate: Number(debt.interestRate),
            minimumPayment: Number(debt.minimumPayment),
            startDate: debt.startDate
          };
        });

        // Import the data
        onImportDebts(validatedDebts);
        
        if (importData.monthlyBudget && typeof importData.monthlyBudget === 'number') {
          onImportBudget(importData.monthlyBudget);
        }

        setImportStatus({
          type: 'success',
          message: `Importación exitosa: ${validatedDebts.length} deudas cargadas${
            importData.monthlyBudget ? ` y presupuesto de $${importData.monthlyBudget.toLocaleString()}` : ''
          }`
        });

      } catch (error) {
        setImportStatus({
          type: 'error',
          message: `Error al importar: ${error instanceof Error ? error.message : 'Archivo JSON inválido'}`
        });
      }
    };

    reader.onerror = () => {
      setImportStatus({
        type: 'error',
        message: 'Error al leer el archivo. Por favor, inténtalo de nuevo.'
      });
    };

    reader.readAsText(file);
  };

  const clearAllData = () => {
    // Add confirmation dialog
    if (window.confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
      onImportDebts([]);
      onImportBudget(0);
      setImportStatus({
        type: 'success',
        message: 'Todos los datos han sido eliminados exitosamente.'
      });
    }
  };

  const handleClearData = () => {
    setShowDeleteDialog(false);
    onImportDebts([]);
    onImportBudget(0);
    toast({
      title: "Datos eliminados",
      description: "Todos los datos han sido eliminados exitosamente",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const handleDebtError = (error: Error) => {
    // Show error toast or notification
    toast.error("Error processing debt data");
  };

  const validateImportedData = (data: unknown): data is ExportData => {
    return (
      typeof data === 'object' &&
      data !== null &&
      'version' in data &&
      'debts' in data &&
      Array.isArray((data as ExportData).debts) &&
      'monthlyBudget' in data &&
      typeof (data as ExportData).monthlyBudget === 'number'
    );
  };

  const DataManagerErrorBoundary = ({ error }: { error: Error }) => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Error al procesar datos: {error.message}
      </AlertDescription>
    </Alert>
  );

  useEffect(() => {
    const lastBackup = localStorage.getItem('lastBackupDate');
    const BACKUP_REMINDER_DAYS = 7;
    
    if (!lastBackup || (Date.now() - new Date(lastBackup).getTime()) > (BACKUP_REMINDER_DAYS * 24 * 60 * 60 * 1000)) {
      toast({
        title: "Recordatorio de respaldo",
        description: "Han pasado más de 7 días desde tu último respaldo de datos",
      });
    }
  }, []);

  return (
    <ErrorBoundary FallbackComponent={DataManagerErrorBoundary}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Gestión de Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Current Data Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Deudas Registradas</p>
                <p className="text-2xl font-bold">{debts.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Adeudado</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(debts.reduce((sum, debt) => sum + debt.balance, 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Presupuesto Mensual</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(monthlyBudget)}
                </p>
              </div>
            </div>

            {/* Export Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Exportar Datos</h3>
              <p className="text-sm text-muted-foreground">
                Descarga todos tus datos (deudas y presupuesto) en un archivo JSON para respaldo o transferencia.
              </p>
              <Button 
                onClick={exportToJSON} 
                className="w-full md:w-auto"
                disabled={debts.length === 0 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar a JSON
                  </>
                )}
              </Button>
            </div>

            {/* Import Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Importar Datos</h3>
              <p className="text-sm text-muted-foreground">
                Carga datos desde un archivo JSON previamente exportado. Esto reemplazará todos los datos actuales.
              </p>
              <div className="space-y-2">
                <Label htmlFor="file-import">Seleccionar archivo JSON</Label>
                <Input
                  id="file-import"
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="cursor-pointer"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="w-full md:w-auto" asChild>
                  <label htmlFor="file-import" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar Archivo
                  </label>
                </Button>
              </div>
            </div>

            {/* Clear Data Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold text-red-600">Zona de Peligro</h3>
              <p className="text-sm text-muted-foreground">
                Elimina permanentemente todos los datos almacenados.
              </p>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                className="w-full md:w-auto"
              >
                Eliminar Todos los Datos
              </Button>
            </div>

            {/* Status Messages */}
            {importStatus.type && (
              <Alert className={importStatus.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {importStatus.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={importStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {importStatus.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💡 Instrucciones de Uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm">Exportar Datos:</h4>
              <p className="text-sm text-muted-foreground">
                Haz clic en "Exportar a JSON" para descargar un archivo con todas tus deudas y configuraciones.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Importar Datos:</h4>
              <p className="text-sm text-muted-foreground">
                Selecciona un archivo JSON previamente exportado para restaurar tus datos. Los datos actuales serán reemplazados.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Respaldo Recomendado:</h4>
              <p className="text-sm text-muted-foreground">
                Exporta tus datos regularmente como respaldo, especialmente antes de hacer cambios importantes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Eliminación</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleClearData}>
                Eliminar Todos los Datos
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundary>
  );
}