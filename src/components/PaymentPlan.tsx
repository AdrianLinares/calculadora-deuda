import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Download, Calendar, CheckCircle, TrendingDown } from 'lucide-react';
import { PaymentMonth } from '@/lib/debtCalculations';
import { toast } from '@/hooks/use-toast';

interface PaymentPlanProps {
  paymentPlan: PaymentMonth[];
  totalDebtAmount: number;
}

interface DebtCompletion {
  debtId: string;
  debtName: string;
  month: number;
  date: string;
}

export default function PaymentPlan({ paymentPlan, totalDebtAmount }: PaymentPlanProps) {
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    // Fetch data
    setIsLoading(false);
  }, []);

  if (!paymentPlan || paymentPlan.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay plan de pagos disponible</h3>
          <p className="text-muted-foreground text-center">
            Configura tu presupuesto mensual para generar el plan de pagos
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short'
    });
  };

  // Get unique years for filtering
  const years = Array.from(new Set(paymentPlan.map(month =>
    new Date(month.date).getFullYear().toString()
  ))).sort();

  // Filter months based on selected year
  const filteredPlan = selectedYear === 'all'
    ? paymentPlan
    : paymentPlan.filter(month =>
      new Date(month.date).getFullYear().toString() === selectedYear
    );

  // Show only first 12 months unless "show all" is clicked
  const displayedPlan = showAllMonths ? filteredPlan : filteredPlan.slice(0, 12);

  // Calculate progress
  const totalPaidSoFar = paymentPlan.reduce((sum, month) => {
    return sum + month.debts.reduce((monthSum, debt) => monthSum + debt.principalPaid, 0);
  }, 0);

  const progressPercentage = totalDebtAmount > 0
    ? (totalPaidSoFar / totalDebtAmount) * 100
    : 0;

  // Get debt completion timeline
  const debtCompletions = paymentPlan.reduce((completions: DebtCompletion[], month) => {
    month.debts.forEach(debt => {
      if (debt.isCompleted && debt.endingBalance === 0 && debt.startingBalance > 0) {
        const existing = completions.find(c => c.debtId === debt.id);
        if (!existing) {
          completions.push({
            debtId: debt.id,
            debtName: debt.name,
            month: month.month,
            date: month.date
          });
        }
      }
    });
    return completions;
  }, []);

  const exportToCsv = async () => {
    try {
      setIsExporting(true);
      const headers = ['Mes', 'Fecha', 'Deuda', 'Saldo Inicial', 'Pago', 'Interés', 'Principal', 'Saldo Final', 'Completada'];
      const rows = paymentPlan.flatMap(month =>
        month.debts.map(debt => [
          month.month,
          month.date,
          debt.name,
          debt.startingBalance.toFixed(2),
          debt.payment.toFixed(2),
          debt.interestPaid.toFixed(2),
          debt.principalPaid.toFixed(2),
          debt.endingBalance.toFixed(2),
          debt.isCompleted ? 'Sí' : 'No'
        ])
      );

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'plan_pagos_bola_nieve.csv';
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Error",
        description: "No se pudo exportar el plan de pago. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Add file size check
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      setImportStatus({
        success: false,
        message: 'El archivo es demasiado grande. El tamaño máximo es 5MB'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Process the file content here
        // For example: const data = JSON.parse(e.target?.result as string);
        setImportStatus({ success: true, message: 'Archivo importado correctamente' });
      } catch (error) {
        setImportStatus({ success: false, message: 'Error al importar el archivo' });
      }
    };
    reader.onerror = () => {
      setImportStatus({ success: false, message: 'Error al leer el archivo' });
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Plan de Pagos Detallado
            </CardTitle>
            <Button onClick={exportToCsv} disabled={isExporting} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Exportar CSV'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progreso del Principal</p>
                <p className="text-2xl font-bold">{progressPercentage.toFixed(1)}%</p>
              </div>
              <div className="flex-1 mx-4">
                <Progress value={progressPercentage} className="h-3" />
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Pagado</p>
                <p className="font-semibold">{formatCurrency(totalPaidSoFar)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {debtCompletions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Cronograma de Eliminación de Deudas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {debtCompletions.map((completion, index) => (
                <div key={completion.debtId} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-600">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-semibold text-green-800">{completion.debtName}</p>
                      <p className="text-sm text-green-600">Se elimina en el mes {completion.month}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-800">{formatDate(completion.date)}</p>
                    <p className="text-sm text-green-600">¡Deuda eliminada!</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly">Vista Mensual</TabsTrigger>
          <TabsTrigger value="summary">Resumen por Deuda</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Filtrar por año:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="all">Todos los años</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Deuda</TableHead>
                      <TableHead>Saldo Inicial</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead>Interés</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>Saldo Final</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedPlan.map((month) => {
                      const activeDebts = month.debts.filter(debt => debt.startingBalance > 0 || debt.payment > 0);

                      return activeDebts.map((debt, idx) => (
                        <TableRow key={`${month.month}-${debt.id}`} className={debt.isCompleted ? 'bg-green-50' : ''}>
                          {idx === 0 && (
                            <>
                              <TableCell className="font-medium" rowSpan={activeDebts.length}>{month.month}</TableCell>
                              <TableCell rowSpan={activeDebts.length}>{formatDate(month.date)}</TableCell>
                            </>
                          )}
                          <TableCell className="font-medium">{debt.name}</TableCell>
                          <TableCell>{formatCurrency(debt.startingBalance)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(debt.payment)}</TableCell>
                          <TableCell className="text-red-600">{formatCurrency(debt.interestPaid)}</TableCell>
                          <TableCell className="text-blue-600">{formatCurrency(debt.principalPaid)}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(debt.endingBalance)}</TableCell>
                          <TableCell>
                            {debt.isCompleted ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">Pagada</span>
                              </div>
                            ) : (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">En proceso</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ));
                    })}
                  </TableBody>
                </Table>
              </div>

              {!showAllMonths && filteredPlan.length > 12 && (
                <div className="p-4 text-center border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllMonths(true)}
                  >
                    Mostrar todos los {filteredPlan.length} meses
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4">
            {paymentPlan.length > 0 && paymentPlan[0].debts.map((debt) => {
              const debtPayments = paymentPlan.map(month =>
                month.debts.find(d => d.id === debt.id)
              ).filter(Boolean);

              const totalPaid = debtPayments.reduce((sum, payment) => sum + (payment?.payment || 0), 0);
              const totalInterest = debtPayments.reduce((sum, payment) => sum + (payment?.interestPaid || 0), 0);

              // Find the month when debt is completed
              const completionIndex = debtPayments.findIndex(payment => payment?.isCompleted && payment?.endingBalance === 0);
              const monthsToPayOff = completionIndex >= 0 ? completionIndex + 1 : null;

              // Get completion date
              const completionMonth = monthsToPayOff !== null ? paymentPlan[completionIndex] : null;
              const completionDate = completionMonth ? new Date(completionMonth.date) : null;
              const formattedCompletionDate = completionDate
                ? completionDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'short' })
                : 'En progreso';

              return (
                <Card key={debt.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{debt.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Meses para pagar</p>
                        <p className="text-xl font-bold">
                          {monthsToPayOff !== null ? monthsToPayOff : 'En progreso'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total pagado</p>
                        <p className="text-xl font-bold">{formatCurrency(totalPaid)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Intereses pagados</p>
                        <p className="text-xl font-bold text-red-600">{formatCurrency(totalInterest)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha de pago final</p>
                        <p className="text-xl font-bold">
                          {formattedCompletionDate}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add file import section */}
      <Card>
        <CardHeader>
          <CardTitle>Importar Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept=".json,.csv"
            onChange={handleFileImport}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {importStatus && (
            <div className={`mt-2 p-2 rounded-md ${importStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {importStatus.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}